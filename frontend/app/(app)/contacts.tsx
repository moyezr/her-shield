import { Text, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import * as Contacts from "expo-contacts";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
const API_URL = process.env.EXPO_PUBLIC_API_URL;

function useAlertedContacts(isRefetch: boolean) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get(API_URL + "/user/contacts", {
          headers: {
            Authorization: `Bearer ${await AsyncStorage.getItem("loggedIn")}`,
          },
        });
        setData(response.data.contacts);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [isRefetch]);
  return data;
}

function useAddableContacts(isRefetch: boolean) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });
        const nameAndNumber = data.map((contact) => {
          let phone = contact.phoneNumbers?.[0].number ?? "";
          phone = phone[0] === "+" ? phone.slice(3) : phone;
          phone = phone
            .split("")
            .filter((char) => char >= "0" && char <= "9")
            .join("");
          return {
            name: contact.name,
            phoneNo: phone,
          };
        });

        const response = await axios.post(
          API_URL + "/user/contacts/available",
          {
            contacts: nameAndNumber,
          },
          {
            headers: {
              Authorization: `Bearer ${await AsyncStorage.getItem("loggedIn")}`,
            },
          }
        );
        setData(response.data.contacts);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [isRefetch]);
  return data;
}

function DisplayAlertedContacts({
  isRefetch,
  setIsRefetch,
}: {
  isRefetch: boolean;
  setIsRefetch: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const alerted = useAlertedContacts(isRefetch);
  async function removeContact(phoneNo: number) {
    try {
      await axios.post(
        API_URL + "/user/contacts/remove",
        {
          phoneNo,
        },
        {
          headers: {
            Authorization: `Bearer ${await AsyncStorage.getItem("loggedIn")}`,
          },
        }
      );
      setIsRefetch(!isRefetch);
      alert("Contact removed successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to remove contact");
    }
  }
  return (
    <View>
      <Text className="text-base">Alerted Contacts</Text>
      <View className="gap-y-2">
        {alerted.map((contact, index) => (
          <View
            key={index}
            className="flex flex-row justify-between border bg-slate-200 border-black p-2 rounded-md"
          >
            <Text className="text-base">{contact.toName}</Text>
            <Text className="text-base">{contact.toUser.phoneNo}</Text>
            <TouchableOpacity
              className="bg-red-500 p-1 rounded-md"
              onPress={() => removeContact(contact.toUser.phoneNo)}
            >
              <Text className="text-white">Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        {alerted.length === 0 && (
          <Text className="mx-auto">No contacts alerted</Text>
        )}
      </View>
    </View>
  );
}

function DisplayAddableContacts({
  isRefetch,
  setIsRefetch,
}: {
  isRefetch: boolean;
  setIsRefetch: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const addable = useAddableContacts(isRefetch);
  async function addContact(phoneNo: number, toName: string) {
    try {
      await axios.post(
        API_URL + "/user/contacts/add",
        {
          phoneNo,
          toName,
        },
        {
          headers: {
            Authorization: `Bearer ${await AsyncStorage.getItem("loggedIn")}`,
          },
        }
      );
      setIsRefetch(!isRefetch);
      alert("Contact added successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to add contact");
    }
  }
  return (
    <View>
      <Text className="text-base">Addable Contacts</Text>
      <View className="gap-y-2">
        {addable.map((contact, index) => (
          <View
            key={index}
            className="flex flex-row items-center justify-between border border-black p-2 rounded-md"
          >
            <Text className="text-base">{contact.name}</Text>
            <Text className="text-base">{contact.phoneNo}</Text>
            <TouchableOpacity
              className="bg-sky-500 p-1 rounded-md"
              onPress={() => addContact(contact.phoneNo, contact.name)}
            >
              <Text className="text-white">Add</Text>
            </TouchableOpacity>
          </View>
        ))}
        {addable.length === 0 && (
          <Text className="mx-auto">No more contacts on HerShield</Text>
        )}
      </View>
    </View>
  );
}

export default function ContactsPage() {
  const [addContacts, setAddContacts] = useState(false);
  const [isRefetch, setIsRefetch] = useState(false);
  console.log("ContactsPage", isRefetch);
  return (
    <View className="flex flex-1 justify-start gap-y-4 m-4">
      <Text className="text-2xl font-bold mx-auto">Contacts</Text>
      <DisplayAlertedContacts
        isRefetch={isRefetch}
        setIsRefetch={setIsRefetch}
      />
      <View>
        {addContacts ? (
          <DisplayAddableContacts
            isRefetch={isRefetch}
            setIsRefetch={setIsRefetch}
          />
        ) : (
          <TouchableOpacity
            className="bg-sky-500 p-2 rounded-md"
            onPress={() => setAddContacts(true)}
          >
            <Text className="text-white mx-auto">Add Contacts</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
