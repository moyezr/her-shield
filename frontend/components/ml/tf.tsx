import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import * as FileSystem from "expo-file-system";
import {
  FFmpegKit,
  FFmpegKitConfig,
  ReturnCode,
} from "ffmpeg-kit-react-native";
import { useContext, useEffect, useState } from "react";
import yamnetClassNames from "../yamnet_classes";
import { yamnetModel } from "../Singleton";
import { SOSContext } from "@/app/(app)/home";

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
    const command = `-i ${audioPath} -ar 16000 -f wav ${outputPath}`;
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

async function yamnet(lastRecordedUri: string, setStatus: any) {
  console.log("YAMNet", lastRecordedUri, yamnetModel.model);
  const modelUrl = "https://www.kaggle.com/models/google/yamnet/TfJs/tfjs/1";
  console.log("Loading model..");
  if (!yamnetModel.model) {
    yamnetModel.model = await tf.loadGraphModel(modelUrl, { fromTFHub: true });
  }
  setStatus("CALCULATING");
  try {
    const waveform = await convertAudioToFloat32Array(lastRecordedUri);
    if (!waveform) return;
    // @ts-ignore
    const [scores] = yamnetModel.model.predict(waveform);
    const classIds = scores.mean(0).topk(5).indices.arraySync();
    tf.dispose([waveform, scores]);
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
  const [status, setStatus] = useState<
    "DONE" | "LOADING" | "CALCULATING" | undefined
  >();
  const [isScream, setIsScream] = useState(0);
  const sos = useContext(SOSContext);
  async function init() {
    setStatus("LOADING");
    await tf.ready();
    if (lastRecordedUri.startsWith("file:///")) {
      const res = await yamnet(lastRecordedUri, setStatus);
      const myArray: string[] = [];
      for (let v of res) {
        // @ts-ignore
        myArray.push(yamnetClassNames[v]);
      }
      console.log("My Array:", myArray);
      setClassIds(myArray);
      setStatus("DONE");
      setIsScream(Math.random());
    }
  }

  useEffect(() => {
    if (isScream) {
      sos?.setForceSos({
        force: isScream >= 0.3,
        priority:
          isScream >= 0.3 ? (isScream >= 0.6 ? "high" : "low") : undefined,
      });
    }
  }, [isScream]);

  return (
    <>
      <TouchableOpacity
        onPress={init}
        disabled={status === "LOADING" || status === "CALCULATING"}
        className="p-2 my-2 rounded-md bg-blue-400 w-full"
      >
        <Text className="mx-auto text-white text-base">
          {`ANALYSE` + (status ? ", " + status : "")}
        </Text>
      </TouchableOpacity>
      {classIds.length > 0 && (
        <>
          <Text className="text-center font-semibold text-lg">
            Predictions:
          </Text>
          <View className="m-2 p-2flex flex-row gap-2 flex-wrap">
            {classIds.map((name, index) => (
              <Text
                className="p-2 bg-sky-400 border rounded-md text-white"
                key={index}
              >
                {name}
              </Text>
            ))}
            {isScream >= 0.3 && (
              <Text className="p-2 bg-green-500 border rounded-md text-white">
                Screaming
              </Text>
            )}
          </View>
        </>
      )}
    </>
  );
}
