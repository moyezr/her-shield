import useNotificationObserver from "@/components/NotificationRedirect";
import { Stack } from "expo-router";

export default function RootLayout() {
  useNotificationObserver();
  return (
    <Stack>
      <Stack.Screen name="login" />
    </Stack>
  );
}
