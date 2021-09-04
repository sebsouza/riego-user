import "react-native-gesture-handler";
import React, { useState, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Text,
  View,
  Switch,
  Button,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import firebase from "../database/Firebase";
import { Input, Divider } from "react-native-elements";
import Slider from "@react-native-community/slider";
import { Icon } from "react-native-elements";
import {
  useUserId,
  useZones,
  useZonesUpdate,
  useNotAnswering,
  useNotAnsweringUpdate,
} from "../context/UserContext";
import { usePubNub } from "pubnub-react";
import { styles } from "../styles";
import theme from "../styles/theme.style.js";

const ZoneDetails = (props) => {
  const pubnub = usePubNub();
  const userId = useUserId();
  const getZones = useZonesUpdate();
  const zones = useZones();
  const notAnswering = useNotAnswering();
  const setNotAnswering = useNotAnsweringUpdate();

  const zoneNumber = props.route.params.zoneNumber; // 0...(n-1)
  const [zoneDetails, updateZoneDetails] = useState(
    zones[zoneNumber].zoneDetails
  );
  // console.log(zoneDetails.name);
  const [valveState, updateValveState] = useState({});
  // const [maxWaterTime, setMaxWaterTime] = useState("");
  // const [initializing, setInitializing] = useState(true);
  // const [saving, setSaving] = useState(false);
  // const [notAnswering, setNotAnswering] = useState(false);
  const timer = useRef(null); // we can save timer in useRef and pass it to child
  const timerNotAnswering = useRef(null);

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      if (pubnub) {
        const handleAkg = (event) => {
          const akg = event.message;
          if (akg.cmd == "akgZoneConfig") {
            setNotAnswering(false);
            getZones();
            // setSaving(false);
            clearTimeout(timer.current);
            // alert(`Los cambios en la zona fueron aplicados correctamente.`);
            console.log("Zone changes applied");
            // props.props.route.params.onGoBack();
            // props.navigation.navigate("Zones");
          }
        };
        pubnub.addListener({ message: handleAkg });
        pubnub.subscribe({ channels: ["out-" + userId] });

        return () => {
          mounted = false;
          pubnub.removeListener({ message: handleAkg });
          pubnub.unsubscribeAll();
        };
      }
    }
  }, [pubnub]);

  const handleChange = async (name, value) => {
    updateZoneDetails({ ...zoneDetails, [name]: value });
    // console.log(`zoneDetails.waterQ => ${zoneDetails.waterQ}`);
    // console.log(`zoneDetails.waterQMax => ${zoneDetails.waterQMax}`);
    try {
      await firebase.db
        .collection("users/" + userId + "/zones")
        .doc("zone" + (zoneNumber + 1))
        .set({ ...zoneDetails, [name]: value })
        .then(() => {
          console.log("Zone Config successfully written!");
          handleSave(3);
        });
    } catch (error) {
      console.error("Error writing document: ", error);
    }
  };

  const handleSave = (cmd) => {
    setNotAnswering(false);
    const message = {
      from: "user",
      cmd: cmd,
    };
    pubnub.publish({ channel: "in-" + userId, message });
    console.log(message);
    console.log("Set Zone Config request sent");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      console.log(`ALERT! Saving timeout`);
      setNotAnswering(true);
      timerNotAnswering.current = setTimeout(() => {
        setNotAnswering(false);
        clearTimeout(timerNotAnswering.current);
      }, 4000);
      // alert(
      //   "Sin respuesta del controlador. Los cambios serán aplicados cuando el equipo se reconecte a internet."
      // );
    }, 8000);
  };

  const toggleSwitch = async (name, value) => {
    updateZoneDetails({ ...zoneDetails, [name]: Boolean(value) });
    // console.log(zoneDetails);
    try {
      await firebase.db
        .collection("users/" + userId + "/zones")
        .doc("zone" + (zoneNumber + 1))
        .set({ ...zoneDetails, [name]: Boolean(value) })
        .then(() => {
          console.log("Zone Config successfully written!");
          handleSave(3);
        });
    } catch (error) {
      console.error("Error writing document: ", error);
    }
  };

  const toggleSwitchValveState = async (value) => {
    const _valveState = {};

    for (const zone in valveState) {
      _valveState[zone] = false;
    }

    console.log("_valveState: ", _valveState);
    _valveState["zone" + zoneNumber] = Boolean(value);
    updateValveState(_valveState);
    console.log("_valveState: ", _valveState);
    try {
      await firebase.db
        .collection("users/" + userId + "/valveSet")
        .doc("valveState")
        .set(_valveState)
        .then(() => {
          // setSaving(true);
          console.log("Valve State successfully written!");
          handleSave(7);
        });
    } catch (error) {
      console.error("Error writing document: ", error);
    }
  };

  // const saveConfig = async () => {
  //   setSaving(true);
  //   try {
  //     await firebase.db
  //       .collection("users/" + userId + "/zones")
  //       .doc("zone" + (zoneNumber + 1))
  //       .set(zoneDetails)
  //       .then(() => {
  //         console.log("Zone Config successfully written!");
  //         handleSave(3);
  //       });
  //   } catch (error) {
  //     console.error("Error writing document: ", error);
  //   }
  // };

  // useEffect(() => {
  //   setTimeout(() => {
  //     console.log(`Saving timeout`);
  //     console.log(`Saving => ${saving}`);
  //     if (saving) {
  //       alert(
  //         "Sin respuesta del controlador. Los cambios serán aplicados cuando el equipo se reconecte a internet."
  //       );
  //       setSaving(false);
  //       props.navigation.navigate("Zones");
  //     }
  //   }, 8000);
  // }, [saving]);

  // useEffect(() => {
  //   var zoneDetailsRef = firebase.db
  //     .collection("users/" + userId + "/zones")
  //     .doc("zone" + (zoneNumber + 1))
  //     .onSnapshot((doc) => {
  //       const zoneDetails = doc.data();
  //       console.log(doc.id, " => ", zoneDetails);
  //       updateZoneDetails(zoneDetails);
  //       setInitializing(false);
  //     });
  //   return () => {
  //     zoneDetailsRef();
  //   };
  // }, []);

  // useEffect(() => {
  //   var zoneDetails = zones["zone" + (zoneNumber + 1)];
  //   updateZoneDetails(zoneDetails);
  //   // return () => {
  //   //   cleanup
  //   // }
  // }, [zones]);

  useEffect(() => {
    var valveSetRef = firebase.db
      .collection("users/" + userId + "/valveSet")
      .doc("valveState")
      .onSnapshot((snapshot) => {
        const valveState = snapshot.data();
        console.log("valveState: ", valveState);
        updateValveState(valveState);
        // setInitializing(false);
      });
    return () => {
      valveSetRef();
    };
  }, []);

  // if (initializing)
  //   return (
  //     <View style={styles.container}>
  //       <ActivityIndicator size="large" color="#3034ba" />
  //       <StatusBar style="light" />
  //     </View>
  //   );
  // else
  // if (saving)
  //   return (
  //     <View style={styles.containerLoading}>
  //       <ActivityIndicator size="large" color={theme.PRIMARY_COLOR} />
  //       <StatusBar style="light" />
  //     </View>
  //   );
  // else
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView>
        <View style={styles.text}>
          <Text style={styles.textSmall}>Nombre: </Text>
          <Input
            value={zoneDetails.name}
            style={styles.textLarge}
            onChangeText={(value) => handleChange("name", String(value))}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Riego Automático: </Text>
          <Switch
            trackColor={{ false: "#535353", true: theme.SECONDARY_COLOR }}
            thumbColor={
              zoneDetails.waterAuto
                ? theme.PRIMARY_COLOR
                : theme.SECONDARY_TEXT_COLOR
            }
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitch("waterAuto", value)}
            value={zoneDetails.waterAuto}
          />
        </View>
        <View style={styles.slider}>
          <Text style={styles.textSmall}>Humedad: {zoneDetails.waterQ} %</Text>
          <Slider
            style={styles.slider}
            value={zoneDetails.waterQ}
            onValueChange={(value) => handleChange("waterQ", Number(value))}
            maximumValue={100}
            minimumValue={0}
            step={5}
            minimumTrackTintColor={theme.SECONDARY_COLOR}
            maximumTrackTintColor="#535353"
            thumbTintColor={theme.PRIMARY_COLOR}
          />
        </View>
        <View style={styles.slider}>
          <Text style={styles.textSmall}>
            Tiempo de Riego Máximo: {zoneDetails.waterQMax} min
          </Text>
          <Slider
            style={styles.slider}
            value={zoneDetails.waterQMax}
            onValueChange={(value) => handleChange("waterQMax", Number(value))}
            maximumValue={60}
            minimumValue={0}
            step={5}
            minimumTrackTintColor={theme.SECONDARY_COLOR}
            maximumTrackTintColor="#535353"
            thumbTintColor={theme.PRIMARY_COLOR}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Probar Zona: </Text>
          <Switch
            trackColor={{ false: "#767577", true: theme.SECONDARY_COLOR }}
            thumbColor={
              valveState["zone" + zoneNumber]
                ? theme.PRIMARY_COLOR
                : theme.SECONDARY_TEXT_COLOR
            }
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitchValveState(value)}
            value={valveState["zone" + zoneNumber]}
          />
        </View>
        {/* <Divider style={{ padding: 10, backgroundColor: "#121212" }} />
        <Button
          title="Aplicar"
          color={theme.PRIMARY_COLOR}
          onPress={() => saveConfig()}
        /> */}
      </ScrollView>
      {notAnswering && (
        <View style={styles.footer}>
          <Text style={styles.textLarge}>Sin Respuesta</Text>
          <Icon
            name="warning"
            color={theme.TERTIARY_COLOR}
            size={18}
            type="entypo"
          />
        </View>
      )}
    </SafeAreaView>
  );
};
export default ZoneDetails;
