import { Text, View } from "react-native";
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function Logout() {
  async function logout() {
    try {
      await AsyncStorage.removeItem("loggedIn");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("pushToken");
      await AsyncStorage.removeItem("notifications");
      router.replace("/(auth)/signin");
    } catch (error) {
      alert("Error in logging out");
    }
  }
  return (
    <View className="mt-20">
      <Text onPress={logout} className="underline mx-auto">
        Logout
      </Text>
    </View>
  );
}
