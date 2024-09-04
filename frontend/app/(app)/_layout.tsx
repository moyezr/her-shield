import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Redirect, router, Slot, Stack } from "expo-router";

export default function AppLayout() {
  const [email, setEmail] = useState<string | null>("");
  useEffect(() => {
    const getEmail = async () => {
      const email = await AsyncStorage.getItem("email");
      if (!email) router.replace("/login");
      setEmail(email);
    };
    getEmail();
  }, []);
  return (
    <>
      <Slot />
    </>
  );
}
