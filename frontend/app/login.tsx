import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState<string>(""); // Provide a default value for email

  async function handleLogin() {
    if (email === "") return;
    await AsyncStorage.setItem("email", email);
    router.replace("/(app)/");
  }

  return (
    <View className="flex flex-1 items-center justify-center">
      <Text>Email</Text>
      <TextInput
        placeholder="Email"
        keyboardType="email-address"
        className="text-lg border rounded-md w-4/5 p-2"
        value={email}
        onChange={(e) => setEmail(e.nativeEvent.text)} // Access the value using e.nativeEvent.text
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
