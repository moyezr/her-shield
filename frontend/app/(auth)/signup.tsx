import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import axios from "axios";

export default function Signup() {
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  async function handleSignup() {
    if (name === "" || !phone || password.length < 5) return;
    try {
      axios.post(API_URL + "/health").then((res) => console.log(res.data));
      // return;
      const response = await axios.post(`${API_URL}/auth/signup`, {
        name,
        phoneNo: phone,
        password,
      });
      await AsyncStorage.setItem("loggedIn", response.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
      router.replace("/(app)/home");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert("Sign up Error", error.response?.data.message);
        console.error(error);
      }
    }
  }

  return (
    <View className="flex flex-1 justify-start gap-y-4 m-4">
      <Text className="text-2xl font-bold mx-auto">Sign up</Text>
      <Text className="self-start">Full Name</Text>
      <TextInput
        placeholder="Jane Doe"
        className="text-base border rounded-md p-2"
        value={name}
        textContentType="name"
        onChange={(e) => setName(e.nativeEvent.text)}
      />
      <Text className="self-start">Phone no.</Text>
      <TextInput
        placeholder="Your 10-digit phone number"
        keyboardType="phone-pad"
        className="text-base border rounded-md p-2"
        value={phone}
        textContentType="telephoneNumber"
        onChange={(e) => setPhone(e.nativeEvent.text)}
      />
      <Text className="self-start">Password</Text>
      <TextInput
        placeholder="Minimum 5 characters"
        keyboardType="visible-password"
        className="text-base border rounded-md p-2"
        textContentType="password"
        onChange={(e) => setPassword(e.nativeEvent.text)}
      />
      <TouchableOpacity
        onPress={handleSignup}
        className="bg-blue-500  p-2 rounded-md"
      >
        <Text className="text-center text-white">Submit</Text>
      </TouchableOpacity>
    </View>
  );
}
