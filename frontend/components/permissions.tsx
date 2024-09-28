import { Platform, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Audio } from "expo-av";
import axios from "axios";
import * as Contacts from "expo-contacts";
import * as Location from "expo-location";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
}

async function PushNotificationsPermission() {
  // if (Platform.OS === "android") {
  //   Notifications.setNotificationChannelAsync("default", {
  //     name: "default",
  //     importance: Notifications.AndroidImportance.MAX,
  //     vibrationPattern: [0, 250, 250, 250],
  //     lightColor: "#FF231F7C",
  //   });
  // }

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
      return false;
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
      if ((await AsyncStorage.getItem("pushToken")) === null) {
        await AsyncStorage.setItem("pushToken", pushTokenString);
        await axios.put(
          `${API_URL}/user/pushToken`,
          {
            pushToken: pushTokenString,
          },
          {
            headers: {
              Authorization: `Bearer ${await AsyncStorage.getItem("loggedIn")}`,
            },
          }
        );
      }
      return true;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
      return false;
    }
  } else {
    handleRegistrationError("Must use physical device for push notifications");
    return true;
  }
}

async function AudioPermission() {
  const { status: existingStatus } = await Audio.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Audio.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    handleRegistrationError("Permission not granted to record audio!");
    return false;
  }
  return true;
}

async function ContactsPermission() {
  const { status: existingStatus } = await Contacts.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Contacts.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    handleRegistrationError("Permission not granted to access contacts!");
    return false;
  }
  return true;
}

async function LocationPermission() {
  const { status: existingStatus } =
    await Location.getForegroundPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Location.requestForegroundPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    handleRegistrationError("Permission not granted to access location!");
    return false;
  }
  return true;
}

export default function usePermissions() {
  const [permissions, setPermissions] = useState(false);
  useEffect(() => {
    async function getPermissions() {
      const isLoggedin = await AsyncStorage.getItem("loggedIn");
      if (!isLoggedin) return;
      const push = await PushNotificationsPermission();
      const audio = await AudioPermission();
      const contacts = await ContactsPermission();
      const location = await LocationPermission();
      setPermissions(push && audio && contacts && location);
    }
    getPermissions();
  }, []);
  return permissions;
}
