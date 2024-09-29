import useNotificationObserver from "@/components/NotificationRedirect";
import { Stack } from "expo-router";

export default function RootLayout() {
  useNotificationObserver();
  return (
    <Stack
      initialRouteName="(app)/home"
      screenOptions={{
        headerTitle: "HerShield",
        statusBarColor: "black",
      }}
    >
      <Stack.Screen
        name="(auth)/signin"
        options={
          {
            // headerShown: false,
          }
        }
      />
      <Stack.Screen
        name="(auth)/signup"
        options={
          {
            // headerShown: false,
          }
        }
      />
      <Stack.Screen
        name="(app)"
        // options={{
        //   headerShown: false,
        // }}
      />
    </Stack>
  );
}
