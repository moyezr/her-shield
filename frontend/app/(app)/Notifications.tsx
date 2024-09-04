import { Platform, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { NotificationData } from "@/components/types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

//returns the persistant expo push token string
async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      handleRegistrationError(
        "Permission not granted to get push token for push notification!"
      );
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError("Project ID not found");
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError("Must use physical device for push notifications");
  }
}

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationData[]>([]);
  const [token, setToken] = useState("");
  const [notification, setNotification] =
    useState<Notifications.Notification>();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    const fetchData = async () => {
      const data = await AsyncStorage.getItem("notifications");
      if (data) {
        setData(JSON.parse(data));
      }
    };
    fetchData();
  }, []);

  //notification logic
  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => setToken(token ?? ""))
      .catch((error: any) => setToken(`${error}`));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notif", notification);
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        setNotification(response.notification);
      });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  useEffect(() => {
    async function saveNotification() {
      if (notification) {
        // Remove page from data as not required for display
        if (notification.request.content.data?.page)
          delete notification.request.content.data.page;
        const newNotification: NotificationData = {
          date: notification.date,
          body: notification.request.content.body ?? "",
          data: JSON.stringify(notification.request.content.data),
        };
        await AsyncStorage.setItem(
          "notifications",
          JSON.stringify([newNotification, ...data])
        );
        setData([newNotification, ...data]);
        setNotification(undefined);
      }
    }
    saveNotification();
  }, [notification]);

  return (
    <View className="flex-1 items-center justify-center">
      <Text>Expo Push Token: {token}</Text>
      <View>
        {data.map((notification, index) => {
          return (
            <View key={index} className="m-5 border rounded-md p-2">
              <Text>{new Date(notification.date).toISOString()}</Text>
              <Text>{notification.body}</Text>
              <Text>{JSON.stringify(notification.data)}</Text>
            </View>
          );
        })}
        {data.length === 0 && <Text>No notifications</Text>}
      </View>
    </View>
  );
}
