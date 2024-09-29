import {
  Platform,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { NotificationData } from "@/components/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Linking from "expo-linking";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function formatDate(date: Date) {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Intl.DateTimeFormat("en-IN", options).format(new Date(date));
}

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
    registerForPushNotificationsAsync();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // console.log("Notif", notification);
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
        for (const notif of data) {
          if (notif.date === notification.date) {
            return;
          }
        }
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
    <ScrollView>
      <View className="flex-1 items-center m-2 gap-y-2">
        <Text className="text-2xl font-semibold pt-4">Notifications</Text>
        <View className="flex-1 w-full gap-y-2">
          {data.map((notification, index) => {
            const data = JSON.parse(notification.data);
            const [latitude, longitude] = data.location.split(",");
            const locationUri = `https://www.google.com/maps/place/${latitude}+${longitude}`;
            return (
              <View key={index} className="m-5 border rounded-lg p-2 gap-y-1">
                <Text>{"From: " + notification.body}</Text>
                <Text>{"Date: " + formatDate(data.createdAt)}</Text>
                <Text>{"Priority: " + data.priority}</Text>
                {/* <Text>{JSON.stringify(notification.data)}</Text> */}
                <View className="flex-row items-center justify-between">
                  {data.audioUrl ? (
                    <TouchableOpacity
                      className="p-2 rounded-full bg-slate-300"
                      onPress={() => Linking.openURL(data.audioUrl ?? "")}
                    >
                      <Ionicons name="play" size={24} />
                    </TouchableOpacity>
                  ) : (
                    <Text></Text>
                  )}

                  <TouchableOpacity
                    className="p-2 rounded-lg bg-slate-300"
                    onPress={() => Linking.openURL(locationUri)}
                  >
                    <Text>View Location</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          {data.length === 0 && <Text>No notifications</Text>}
        </View>
      </View>
    </ScrollView>
  );
}
