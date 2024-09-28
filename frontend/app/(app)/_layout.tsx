import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { router, Tabs } from "expo-router";
import usePermissions from "@/components/permissions";
import { View, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function AppLayout() {
  const permissions = usePermissions();
  useEffect(() => {
    const getEmail = async () => {
      const loggedin = await AsyncStorage.getItem("loggedIn");
      if (!loggedin) router.replace("/(auth)/signin");
    };
    getEmail();
  }, []);
  return (
    <>
      {permissions ? (
        <Tabs
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: "Home",
              tabBarIcon: (props) => (
                <View>
                  <Ionicons name="home" size={24} color={props.color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              title: "Notifications",
              tabBarIcon: (props) => (
                <View>
                  <Ionicons
                    name="notifications"
                    size={24}
                    color={props.color}
                  />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="contacts"
            options={{
              title: "Contacts",
              tabBarIcon: (props) => (
                <View>
                  <Ionicons name="people" size={24} color={props.color} />
                </View>
              ),
            }}
          />
        </Tabs>
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text>Grant All Required Permission</Text>
        </View>
      )}
    </>
  );
}
