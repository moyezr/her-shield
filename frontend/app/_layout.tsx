import useNotificationObserver from "@/components/NotificationRedirect";
import { Stack } from "expo-router";

export default function RootLayout() {
  useNotificationObserver();
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="Notifications" />
    </Stack>
  );
}
