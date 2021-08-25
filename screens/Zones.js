import "react-native-gesture-handler";
import React, { useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import firebase from "../database/Firebase";
import { ListItem } from "react-native-elements";
import { useUserId, useZones, useZonesUpdate } from "../context/UserContext";
// import { usePubNub } from "pubnub-react";
import { styles } from "../styles";
import { useFocusEffect } from "@react-navigation/native";

const Zones = (props) => {
  // const pubnub = usePubNub();
  // const userId = useUserId();
  // const [initializing, setInitializing] = useState(true);
  // const getZones = useZonesUpdate();
  const zones = useZones();
  const [zoneConfig, setZoneConfig] = useState(zones);

  useFocusEffect(
    useCallback(() => {
      if (zones && zones !== null) {
        // console.log(`useFocusEffect`);
        setZoneConfig(zones);
      }
      // setZoneConfig(useZones());
      // return () => unsubscribe();
    }, [zones])
  );

  // const getZoneConfig = useZoneConfigUpdate();
  // getZoneConfig();
  // const zoneConfig = useZoneConfig();
  // console.log(zoneConfig);
  // const handleChange = (name, value) => {
  //   updateZoneConfig({ ...zoneConfig, [name]: value });
  //   console.log(zoneConfig);
  // };

  // const handleSave = (cmd) => {
  //   const message = {
  //     from: "user",
  //     cmd: cmd,
  //   };
  //   pubnub.publish({ channel: "in-" + userId, message });
  //   setSaving(true);
  //   console.log(message);
  // };

  // useEffect(() => {
  //   let mounted = true;
  //   if (mounted) {
  //     if (pubnub) {
  //       const handleAkg = (event) => {
  //         const akg = event.message;
  //         if (akg.cmd == "akgZoneConfig") {
  //           props.navigation.reset({
  //             index: 0,
  //             routes: [{ name: "Main" }],
  //           });
  //         }
  //       };
  //       pubnub.addListener({ message: handleAkg });
  //       pubnub.subscribe({ channels: ["out-" + userId] });

  //       return () => {
  //         mounted = false;
  //         pubnub.removeListener({ message: handleAkg });
  //         pubnub.unsubscribeAll();
  //       };
  //     }
  //   }
  // }, [pubnub]);

  // useEffect(() => {
  //   var zoneConfigRef = firebase.db
  //     .collection("users/" + userId + "/zones")
  //     .onSnapshot((querySnapshot) => {
  //       const _zoneConfig = [];
  //       querySnapshot.forEach((doc) => {
  //         const zoneDetails = doc.data();
  //         console.log(doc.id, " => ", zoneDetails);
  //         _zoneConfig.push({
  //           id: doc.id,
  //           zoneDetails,
  //         });
  //       });
  //       updateZoneConfig(_zoneConfig);
  //       setInitializing(false);
  //     });
  //   return () => {
  //     // zoneConfigRef();
  //   };
  // }, []);

  // if (initializing)
  //   return (
  //     <View style={styles.container}>
  //       <ActivityIndicator size="large" color="#3034ba" />
  //       <StatusBar style="light" />
  //     </View>
  //   );
  // else
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView>
        {zoneConfig.map((zone, index) => {
          return (
            <ListItem
              key={index}
              bottomDivider
              containerStyle={{
                backgroundColor: "#212121",
              }}
              onPress={() => {
                props.navigation.navigate("ZoneDetails", {
                  zoneNumber: index,
                  // onGoBack: () => updateZoneConfig(useZones()),
                });
              }}
            >
              <ListItem.Content>
                <ListItem.Title
                  style={/* { color: "#b3b3b3" } */ styles.textSmall}
                >
                  Zona {zone.zoneDetails.name}
                </ListItem.Title>
                <ListItem.Subtitle
                  style={/* { color: "#b3b3b3" } */ styles.textSmall}
                >
                  {zone.zoneDetails.waterAuto ? "ON" : "OFF"}
                  {", "}
                  {zone.zoneDetails.waterQ} %
                </ListItem.Subtitle>
              </ListItem.Content>
              <ListItem.Chevron />
            </ListItem>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};
export default Zones;
