import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { saveNotificationToStorage } from "./extras";

// This hook listens for notifications and redirects the user to the page specified in the notification.
function useNotificationObserver() {
  useEffect(() => {
    let isMounted = true;

    async function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.page;
      if (url) {
        await saveNotificationToStorage(notification);
        router.push(url);
      }
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) {
        return;
      }
      redirect(response?.notification);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // console.log("notification received", response);
        redirect(response.notification);
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}

export default useNotificationObserver;
