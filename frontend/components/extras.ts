import AsyncStorage from "@react-native-async-storage/async-storage";
import { Notification } from "expo-notifications";
import { NotificationData } from "./types";

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

export { saveNotificationToStorage };
