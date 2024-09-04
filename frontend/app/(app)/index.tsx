import { useEffect, useState } from "react";
import { Button, Text, TouchableOpacity, View } from "react-native";
import { Audio } from "expo-av";
import { RecordingStatus } from "expo-av/build/Audio";
import { Link } from "expo-router";
import { CUSTOM_REC_QUALITY } from "@/components/extras";
import MachineLearning from "@/components/ml/tf";

export default function Index() {
  const [recording, setRecording] = useState<any | undefined>();
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  useEffect(() => {
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
    <View className="flex flex-col flex-1 px-8 justify-center">
      <Text>Main User</Text>
      <Button
        title={recording ? "Stop Recording" : "Start Recording"}
        onPress={recording ? stopRecording : startRecording}
      />

      {recordingUri && <Button title="Play Sound" onPress={playSound} />}
      {recordingUri && <MachineLearning lastRecordedUri={recordingUri} />}

      <Link href={{ pathname: "/Notifications" }}>Go to Notifications</Link>
      <TouchableOpacity className="p-4 px-8 bg-red-500 my-10 rounded-full mx-auto">
        <Text className="text-xl font-medium">{"Send\nSOS"}</Text>
      </TouchableOpacity>
    </View>
  );
}
