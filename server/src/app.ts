import express, { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { hash, compare } from "bcrypt";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { connect } from "http2";

const app = express();
const prisma = new PrismaClient();

function Authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const user = verify(token, "secret") as JwtPayload;
    req.body.userId = user.userId;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized" });
  }
}

app.use(express.json());

app.get("/", (_, res) => {
  res.send("Her Shield API");
});

app.get("/health", (_, res) => {
  res.send("API is healthy");
});
app.post("/health", (_, res) => {
  res.send("API is healthy");
});

app.post("/auth/signup", async (req, res) => {
  try {
    const { phoneNo, password, name } = req.body;
    if (!phoneNo || !password || !name || phoneNo.length != 10)
      return res.status(400).json({ message: "Invalid Request" });
    const user = await prisma.user.create({
      data: {
        phoneNo: phoneNo,
        password: await hash(password, 10),
        name,
      },
      select: {
        id: true,
        name: true,
      },
    });
    const token = sign({ userId: user.id }, "secret");
    res.status(201).json({ message: "Request Successful", user, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Request Failed" });
  }
});

app.post("/auth/signin", async (req, res) => {
  try {
    const { phoneNo, password } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        phoneNo: phoneNo,
      },
      select: {
        id: true,
        name: true,
        password: true,
      },
    });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch)
      return res.status(400).json({ message: "Invalid Password" });
    const token = sign({ userId: user.id }, "secret");
    const matchedUser = { id: user.id, name: user.name };
    res
      .status(200)
      .json({ message: "Request Successful", user: matchedUser, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Request Failed" });
  }
});

app.put("/user/pushToken", Authenticate, async (req, res) => {
  try {
    const { userId, pushToken } = req.body;
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        expoPushToken: pushToken,
      },
    });
    res.status(200).json({ message: "Request Successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Request Failed" });
  }
});

app.get("/user/contacts", Authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    const contacts = await prisma.contact.findMany({
      where: {
        fromId: userId,
      },
      select: {
        toName: true,
        toUser: {
          select: {
            phoneNo: true,
          },
        },
      },
    });

    res.status(200).json({ message: "Request Successful", contacts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Request Failed" });
  }
});

app.post("/user/contacts/available", Authenticate, async (req, res) => {
  try {
    const { userId, contacts } = req.body;
    const alertedUserIds = await prisma.contact.findMany({
      where: {
        fromId: userId,
      },
      select: {
        toId: true,
      },
    });
    const available = await prisma.user.findMany({
      where: {
        phoneNo: {
          in: contacts.map((contact: any) => contact.phoneNo),
        },
        id: {
          notIn: alertedUserIds.map((contact: any) => contact.toId),
        },
      },
      select: {
        phoneNo: true,
      },
    });
    let availablePhoneNos: { [key: number]: boolean } = {};
    available.forEach((contact) => {
      availablePhoneNos[Number(contact.phoneNo)] = true;
    });
    const availableContacts = contacts.filter(
      (contact: any) => availablePhoneNos[contact.phoneNo]
    );
    res
      .status(200)
      .json({ message: "Request Successful", contacts: availableContacts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Request Failed" });
  }
});

app.post("/user/contacts/add", Authenticate, async (req, res) => {
  try {
    const { userId, phoneNo, toName } = req.body;
    const toUser = await prisma.user.findFirst({
      where: {
        phoneNo: phoneNo,
      },
      select: {
        id: true,
      },
    });
    if (!toUser) return res.status(400).json({ message: "User not found" });
    await prisma.contact.create({
      data: {
        fromId: userId,
        toId: toUser?.id,
        toName,
      },
    });
    res.status(201).json({ message: "Request Successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Request Failed" });
  }
});

app.post("/user/contacts/remove", Authenticate, async (req, res) => {
  try {
    const { userId, phoneNo } = req.body;
    const toUser = await prisma.user.findFirst({
      where: {
        phoneNo,
      },
      select: {
        id: true,
      },
    });
    console.log(toUser, phoneNo);
    if (!toUser) return res.status(400).json({ message: "User not found" });
    await prisma.contact.deleteMany({
      where: {
        fromId: userId,
        toId: toUser.id,
      },
    });
    res.status(200).json({ message: "Request Successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Request Failed" });
  }
});

export default app;
