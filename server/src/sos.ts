import { Router } from "express";
import { ContainerClient } from "@azure/storage-blob";
import { prisma } from "./app";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

interface Sos {
  id: number;
  fromId: number;
  location: string;
  priority: "HIGH" | "LOW" | "MEDIUM";
  audioUrl: string | null;
  createdAt: Date;
}

const sos = Router();
const containerUri = process.env.AZURE_BLOB_CONTAINER_URI ?? "";

const containerClient = new ContainerClient(
  process.env.AZURE_BLOB_CONTAINER_SAS ?? ""
);

const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
});

let workerActive = false;
const sosQueue: Sos[] = [];

async function processSosQueue() {
  if (workerActive) return;
  workerActive = true;
  while (sosQueue.length > 0) {
    const sos = sosQueue.shift();
    if (!sos) break;
    const messages: ExpoPushMessage[] = [];
    const fromUser = await prisma.user.findUnique({
      where: {
        id: sos.fromId,
      },
      select: {
        name: true,
        phoneNo: true,
      },
    });
    const alertedUsers = await prisma.contact.findMany({
      where: {
        fromId: sos.fromId,
      },
      select: {
        toUser: {
          select: {
            expoPushToken: true,
          },
        },
      },
    });
    for (const alertedUser of alertedUsers) {
      if (alertedUser.toUser.expoPushToken) {
        messages.push({
          to: alertedUser.toUser.expoPushToken,
          sound: "default",
          title: "SOS Alert",
          body: `${fromUser?.name}`,
          data: {
            ...sos,
          },
        });
      }
    }
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error(error);
      }
    }
  }
  workerActive = false;
}

async function uploadToBlob(audio: Buffer) {
  const blobName = `myaudio-${Date.now()}.aac`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(audio, audio.length, {
    blobHTTPHeaders: { blobContentType: "audio/aac" },
  });
  return containerUri + "/" + blobName;
}

sos.post("/", async (req, res) => {
  try {
    const { userId, location, priority } = req.body;
    let audio: Buffer;
    let audioUrl: string | undefined;
    if (req.body.audio) {
      audio = Buffer.from(req.body.audio, "base64");
      audioUrl = await uploadToBlob(audio);
    }
    const sos = await prisma.sos.create({
      data: {
        fromId: userId,
        audioUrl,
        location: location.coords.latitude + "," + location.coords.longitude,
        priority: priority.toUpperCase(),
      },
    });
    sosQueue.push(sos);
    processSosQueue();
    res.status(200).json({ message: "Request Successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Request Failed" });
  }
});

export default sos;
