import { Text, TouchableOpacity, View } from "react-native";
import React, { useContext, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Location from "expo-location";
import { SOSContext } from "@/app/(app)/home";

export default function SendSOS({
  lastRecordedUri,
}: {
  lastRecordedUri: string | null;
}) {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const sos = useContext(SOSContext);
  const [disabled, setDisabled] = React.useState(false);
  async function sendSOS(priority: "high" | "low" = "high") {
    setDisabled(true);
    try {
      const response = await axios.post(
        API_URL + "/user/sos",
        {
          audio: lastRecordedUri
            ? await FileSystem.readAsStringAsync(lastRecordedUri, {
                encoding: FileSystem.EncodingType.Base64,
              })
            : undefined,
          location: await Location.getCurrentPositionAsync(),
          priority,
        },
        {
          headers: {
            Authorization: "Bearer " + (await AsyncStorage.getItem("loggedIn")),
          },
        }
      );
    } catch (error) {
      alert("Error in sending SOS");
    }
    setDisabled(false);
  }

  useEffect(() => {
    if (sos?.forceSos?.force) {
      sendSOS(sos?.forceSos?.priority);
      sos?.setForceSos({ force: false, priority: undefined });
    }
  }, [sos?.forceSos]);
  return (
    <View className="ml-4">
      <TouchableOpacity
        className={
          "p-4 px-8 my-10 rounded-full mx-auto" +
          (disabled ? " bg-yellow-100" : " bg-red-500")
        }
        onPress={() => {
          sendSOS("high");
        }}
        disabled={disabled}
      >
        <Text className="text-xl text-center font-medium tracking-widest">
          {disabled ? "Informing" : "Send\nSOS!"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
