import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { Audio } from "expo-av";
import { RecordingStatus } from "expo-av/build/Audio";
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake";
import { Link } from "expo-router";

const BACKGROUND_RECORDING_TASK = "BACKGROUND_RECORDING_TASK";
export default function Index() {
  const [recording, setRecording] = useState<any | undefined>();
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  useEffect(() => {
    registerBackgroundTask();
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  const registerBackgroundTask = async () => {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_RECORDING_TASK, {
        minimumInterval: 1, // 1 second
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log("Task registered");
    } catch (err) {
      console.log("Task Register failed:", err);
    }
  };

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
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);

      recording.setOnRecordingStatusUpdate((status: RecordingStatus) => {
        if (status.isRecording) {
          const { durationMillis, metering = -100 } = status;
          console.log("Recording duration", durationMillis);
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
    deactivateKeepAwake();
    setRecordingUri(uri);
    console.log("Recording stopped and stored at", uri);
  }

  async function playSound() {
    console.log("Loading Sound");
    const { sound } = await Audio.Sound.createAsync({
      uri: recordingUri!,
    });

    console.log("Playing Sound");
    await sound.playAsync();
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Button
        title={recording ? "Stop Recording" : "Start Recording"}
        onPress={recording ? stopRecording : startRecording}
      />

      {recordingUri && <Button title="Play Sound" onPress={playSound} />}

      <Link href={{ pathname: "/Notifications" }}>Go to Notifications</Link>
    </View>
  );
}
