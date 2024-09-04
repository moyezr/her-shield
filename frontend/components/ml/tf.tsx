import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { Button, Text, View } from "react-native";
import * as FileSystem from "expo-file-system";
import {
  FFmpegKit,
  FFmpegKitConfig,
  ReturnCode,
} from "ffmpeg-kit-react-native";
import { useState } from "react";
import yamnetClassNames from "../yamnet_classes";
import { yamnetModel } from "../Singleton";

async function init() {
  console.log("Initializing FFmpeg..");
  console.log(await FFmpegKitConfig.init());
}

init();

// Function to convert WAV PCM data to Float32Array
const pcmToFloat32Array = (pcmData: any) => {
  const view = new DataView(pcmData);
  const pcmDataOffset = 44; // WAV header size
  const length = (pcmData.byteLength - pcmDataOffset) / 2;
  const float32Array = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const int16 = view.getInt16(pcmDataOffset + i * 2, true);
    float32Array[i] = int16 / 32768;
  }

  return float32Array;
};

// Function to read WAV file and return PCM data as ArrayBuffer
const readWavFile = async (filePath: string) => {
  console.log("Reading WAV file:", filePath);
  const response = await fetch(filePath);
  const arrayBuffer = await response.arrayBuffer();
  return arrayBuffer;
};

const convertAudioToFloat32Array = async (audioPath: string) => {
  try {
    const outputPath = `${
      FileSystem.cacheDirectory
    }Audio/output-${Date.now()}.wav`; // Temporary path for the WAV file

    // Run FFmpeg command to convert AAC to WAV
    const command = `-i ${audioPath} -f wav ${outputPath}`;
    const result = await FFmpegKit.execute(command);
    console.log("FFmpeg result:", result);
    if (ReturnCode.isSuccess(await result.getReturnCode())) {
      // Read the WAV file and convert to Float32Array
      const pcmData = await readWavFile(outputPath);
      const floatArray = pcmToFloat32Array(pcmData);
      const audioTensor = tf.tensor1d(floatArray);
      await FileSystem.deleteAsync(outputPath);
      return audioTensor;
    } else {
      console.error("FFmpeg conversion failed:", result);
    }
  } catch (error) {
    console.error("Error converting AAC to Float32Array:", error);
  }
};

async function yamnet(lastRecordedUri: string) {
  console.log("YAMNet", lastRecordedUri, yamnetModel.model);
  const modelUrl = "https://www.kaggle.com/models/google/yamnet/TfJs/tfjs/1";
  console.log("Loading model..");
  if (!yamnetModel.model) {
    yamnetModel.model = await tf.loadGraphModel(modelUrl, { fromTFHub: true });
  }

  try {
    const waveform = await convertAudioToFloat32Array(lastRecordedUri);
    if (!waveform) return;
    // @ts-ignore
    const [scores] = yamnetModel.model.predict(waveform);
    const classIds = scores.mean(0).topk(5).indices.dataSync();
    console.log(classIds);
    return classIds;
  } catch (error) {
    console.error("Error in prediction:", error);
  }
}

export default function MachineLearning({
  lastRecordedUri,
}: {
  lastRecordedUri: string;
}) {
  const [classIds, setClassIds] = useState<string[]>([]);

  async function init() {
    await tf.ready();
    if (lastRecordedUri.startsWith("file:///")) {
      const res = await yamnet(lastRecordedUri);
      const resString = JSON.stringify(res);

      const parsedRes = JSON.parse(resString);
      console.log("Class IDs:", parsedRes);
      const myArray: string[] = [];
      for (let v of Object.values(parsedRes)) {
        // @ts-ignore
        myArray.push(yamnetClassNames[v]);
      }
      console.log("My Array:", myArray);
      setClassIds(myArray);
    }
  }

  return (
    <>
      <Button title="Machine Learning" onPress={init} />
      <View className="m-8 p-2 justify-center flex flex-row gap-2 flex-wrap">
        {classIds.map((name, index) => (
          <Text className="p-2 bg-sky-400 border rounded-md" key={index}>
            {name}
          </Text>
        ))}
      </View>
    </>
  );
}
