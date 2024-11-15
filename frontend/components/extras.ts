import AsyncStorage from "@react-native-async-storage/async-storage";
import { Notification } from "expo-notifications";
import { NotificationData } from "./types";
import {
  AndroidAudioEncoder,
  AndroidOutputFormat,
  IOSAudioQuality,
  IOSOutputFormat,
  RecordingOptions,
} from "expo-av/build/Audio";

const CUSTOM_REC_QUALITY: RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: ".aac",
    outputFormat: AndroidOutputFormat.AAC_ADTS,
    audioEncoder: AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: ".m4a",
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: IOSAudioQuality.MAX,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 128000,
  },
};

async function saveNotificationToStorage(notification: Notification) {
  if (notification) {
    // Remove page from data as not required for display
    if (notification.request.content.data?.page)
      delete notification.request.content.data.page;
    const newNotification: NotificationData = {
      date: notification.date,
      body: notification.request.content.body ?? "",
      data: JSON.stringify(notification.request.content.data),
    };
    const data = await AsyncStorage.getItem("notifications");
    const prevNotifications: NotificationData[] = data ? JSON.parse(data) : [];
    await AsyncStorage.setItem(
      "notifications",
      JSON.stringify([newNotification, ...prevNotifications])
    );
  }
}

export { CUSTOM_REC_QUALITY, saveNotificationToStorage };
