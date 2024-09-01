import { Platform, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

interface NotificationData {
  date: number;
  body: string;
  data: any;
}

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
        const newNotification: NotificationData = {
          date: notification.date,
          body: notification.request.content.body ?? "",
          data: JSON.stringify(notification.request.content.data),
        };
        await AsyncStorage.setItem(
          "notifications",
          JSON.stringify([...data, newNotification])
        );
        setData([newNotification, ...data]);
      }
    }
    saveNotification();
  }, [notification]);

  return (
    <View style={styles.container}>
      <Text>Expo Push Token: {token}</Text>
      <View>
        {data.map((notification, index) => {
          return (
            <View key={index} style={styles.card}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    margin: 5,
    borderWidth: 1,
    padding: 2,
  },
});