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
import { useUserId } from "../context/UserContext";
import { usePubNub } from "pubnub-react";
import { styles } from "../styles";

const ZoneDetails = (props) => {
  const pubnub = usePubNub();
  const userId = useUserId();
  // const [zoneConfig, updateZoneConfig] = useState([]);
  const [zoneDetails, updateZoneDetails] = useState({});
  const [valveState, updateValveState] = useState({});
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const zoneNumber = props.route.params.zoneNumber; // 0...(n-1)
  const timer = useRef(null); // we can save timer in useRef and pass it to child

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      if (pubnub) {
        const handleAkg = (event) => {
          const akg = event.message;
          if (akg.cmd == "akgZoneConfig") {
            setSaving(false);
            props.navigation.navigate("Zones");
            clearTimeout(timer.current);
            alert(
              `Los cambios en la Zona ${
                zoneNumber + 1
              } fueron guardados correctamente.`
            );
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

  const handleChange = (name, value) => {
    updateZoneDetails({ ...zoneDetails, [name]: value });
    console.log(`zoneDetails.waterQ => ${zoneDetails.waterQ}`);
    console.log(`zoneDetails.waterQMax => ${zoneDetails.waterQMax}`);
  };

  const handleSave = (cmd) => {
    const message = {
      from: "user",
      cmd: cmd,
    };
    pubnub.publish({ channel: "in-" + userId, message });
    console.log(message);
    console.log("Set Zone Config request sent");
    timer.current = setTimeout(() => {
      console.log(`ALERT! Saving timeout`);
      alert(
        "Sin respuesta del controlador. Los cambios serán aplicados cuando el equipo se reconecte a internet."
      );
    }, 8000);
  };

  const toggleSwitch = (name, value) => {
    updateZoneDetails({ ...zoneDetails, [name]: Boolean(value) });
    // console.log(zoneDetails);
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
        });
    } catch (error) {
      console.error("Error writing document: ", error);
    }
    handleSave(7);
  };

  const saveConfig = async () => {
    setSaving(true);
    console.log(`Saving => ${saving}`);
    try {
      await firebase.db
        .collection("users/" + userId + "/zones")
        .doc("zone" + (zoneNumber + 1))
        .set(zoneDetails)
        .then(() => {
          console.log("Zone Config successfully written!");
        });
    } catch (error) {
      console.error("Error writing document: ", error);
    }
    handleSave(3);
  };

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

  useEffect(() => {
    var zoneDetailsRef = firebase.db
      .collection("users/" + userId + "/zones")
      .doc("zone" + (zoneNumber + 1))
      .onSnapshot((doc) => {
        const zoneDetails = doc.data();
        console.log(doc.id, " => ", zoneDetails);
        // });
        // updateZoneConfig(zoneConfig);
        updateZoneDetails(zoneDetails);
        // console.log(zoneConfig[zoneNumber]);
        setInitializing(false);
      });
    return () => {
      zoneDetailsRef();
    };
  }, []);

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

  if (initializing)
    return (
      <View
        style={{
          flex: 1,
          padding: 35,
          marginTop: 150,
        }}
      >
        <ActivityIndicator size="large" color="#00b0ff" />
        <StatusBar style="light" />
      </View>
    );
  else if (saving)
    return (
      <View
        style={{
          flex: 1,
          padding: 35,
          marginTop: 150,
        }}
      >
        <ActivityIndicator size="large" color="#03ff13" />
        <StatusBar style="light" />
      </View>
    );
  else
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
            <Text style={styles.textSmall}>Riego Auto: </Text>
            <Switch
              trackColor={{ false: "#535353", true: "#5356E6" }}
              thumbColor={zoneDetails.waterAuto ? "#1db954" : "#b3b3b3"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={(value) => toggleSwitch("waterAuto", value)}
              value={zoneDetails.waterAuto}
            />
          </View>
          <View style={styles.slider}>
            <Text style={styles.textSmall}>
              Humedad: {zoneDetails.waterQ} %
            </Text>
            <Slider
              style={styles.slider}
              value={zoneDetails.waterQ}
              onValueChange={(value) => handleChange("waterQ", Number(value))}
              maximumValue={100}
              minimumValue={0}
              step={1}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#000000"
              thumbTintColor="#1db954"
            />
          </View>
          <View style={styles.slider}>
            <Text style={styles.textSmall}>
              Cantidad de Riego Máx: {zoneDetails.waterQMax} mm
            </Text>
            <Slider
              style={styles.slider}
              value={zoneDetails.waterQMax}
              onValueChange={(value) =>
                handleChange("waterQMax", Number(value))
              }
              maximumValue={zoneDetails.waterCapacity}
              minimumValue={0}
              step={1}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#000000"
              thumbTintColor="#1db954"
            />
          </View>
          <View style={styles.switch}>
            <Text style={styles.textSmall}>Probar Zona: </Text>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={
                valveState["zone" + zoneNumber] ? "#1db954" : "#f4f3f4"
              }
              ios_backgroundColor="#3e3e3e"
              onValueChange={(value) => toggleSwitchValveState(value)}
              value={valveState["zone" + zoneNumber]}
            />
          </View>
          <Divider style={{ padding: 10, backgroundColor: "#121212" }} />
          <Button
            title="Aplicar"
            color="#1db954"
            onPress={() => saveConfig()}
          />
        </ScrollView>
      </SafeAreaView>
    );
};
export default ZoneDetails;
