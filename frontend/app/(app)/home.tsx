import { useEffect, useState } from "react";
import { Button, Text, TouchableOpacity, View } from "react-native";
import { Audio } from "expo-av";
import { RecordingStatus } from "expo-av/build/Audio";
import { CUSTOM_REC_QUALITY } from "@/components/extras";
import MachineLearning from "@/components/ml/tf";
import { User } from "@/components/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const [recording, setRecording] = useState<any | undefined>();
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [user, setUser] = useState<User>();
  useEffect(() => {
    const getUser = async () => {
      const user = await AsyncStorage.getItem("user");
      if (user) {
        setUser(JSON.parse(user));
      }
    };
    getUser();
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  async function startRecording() {
    try {
      //@ts-ignore
      if (permissionResponse.status !== "granted") {
        console.log("Requesting permission..");
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      console.log("Starting recording..");
      const { recording } = await Audio.Recording.createAsync(
        CUSTOM_REC_QUALITY
      );
      setRecording(recording);

      recording.setOnRecordingStatusUpdate((status: RecordingStatus) => {
        if (status.isRecording) {
          const { durationMillis, metering = -100 } = status;
          // console.log("Recording duration", durationMillis);
        }
      });
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    console.log("Stopping recording..");
    setRecording(undefined);
    if (recording) {
      await recording.stopAndUnloadAsync();
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording.getURI();
    setRecordingUri(uri);
    console.log("Recording stopped and stored at", uri);
  }

  async function playSound() {
    console.log("Loading Sound");
    const { sound } = await Audio.Sound.createAsync({
      uri: recordingUri!,
    });
    await sound.playAsync();
  }

  return (
    <View className="flex flex-1 px-8 gap-4 mt-2">
      <Text className="text-center font-semibold text-2xl">
        {"Welcome, " + user?.name}
      </Text>
      <View className="rounded-md border p-3 px-5 flex gap-y-2">
        <TouchableOpacity
          onPress={recording ? stopRecording : startRecording}
          className="p-2 rounded-md bg-blue-400 w-full"
        >
          <Text className="mx-auto text-white text-base">
            {recording ? "Stop Recording" : "Start Recording"}
          </Text>
        </TouchableOpacity>

        {recordingUri ? (
          <TouchableOpacity
            onPress={playSound}
            className="p-2 rounded-md bg-blue-400 w-full"
          >
            <Text className="mx-auto text-white text-base">Play Sound</Text>
          </TouchableOpacity>
        ) : null}
        {recordingUri ? (
          <MachineLearning lastRecordedUri={recordingUri} />
        ) : null}
      </View>
      <View>
        <TouchableOpacity className="p-4 px-8 bg-red-500 my-10 rounded-full mx-auto">
          <Text className="text-xl text-center font-medium tracking-widest">
            {"Send\nSOS!"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}