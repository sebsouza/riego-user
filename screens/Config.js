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
import { Divider, ListItem } from "react-native-elements";
import { useUserId } from "../context/UserContext";
import { usePubNub } from "pubnub-react";
import { styles } from "../styles";

const Config = (props) => {
  const pubnub = usePubNub();
  const userId = useUserId();
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemConfig, updateSystemConfig] = useState({});
  const timer = useRef(null); // we can save timer in useRef and pass it to child

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      if (pubnub) {
        const handleAkg = (event) => {
          const akg = event.message;
          if (akg.cmd == "akgSystemConfig") {
            setSaving(false);
            clearTimeout(timer.current);
            console.log(`System Config Changes Applied.`);
            alert(
              `Los cambios en la configuración fueron aplicados correctamente.`
            );
            // props.navigation.reset({
            //   index: 0,
            //   routes: [{ name: "Main" }],
            // });
          }
          if (akg.cmd == "akgSaveAirValue") {
            setSaving(false);
            clearTimeout(timer.current);
            alert("Valor de Humedad Mínimo configurado");
          }
          if (akg.cmd == "akgSaveWaterValue") {
            setSaving(false);
            clearTimeout(timer.current);
            alert("Valor de Humedad Máximo configurado");
          }
          if (akg.cmd == "akgAirWaterReset") {
            setSaving(false);
            clearTimeout(timer.current);
            alert("Valores de Humedad Mínimo y Máximo reseteados");
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

  useEffect(() => {
    var systemConfigRef = firebase.db
      .collection("users/" + userId + "/config")
      .doc("system")
      .onSnapshot((snapshot) => {
        const systemConfig = snapshot.data();
        console.log(systemConfig);
        updateSystemConfig(systemConfig);
        setInitializing(false);
      });
    return () => {
      // systemConfigRef();
    };
  }, []);

  const handleSave = (cmd) => {
    const message = {
      from: "user",
      cmd: cmd,
    };
    pubnub.publish({ channel: "in-" + userId, message });
    console.log(message);
    console.log("Set System Config request sent");
    timer.current = setTimeout(() => {
      console.log(`ALERT! Saving timeout`);
      alert(
        "Sin respuesta del controlador. Los cambios serán aplicados cuando el equipo se reconecte a internet."
      );
      setSaving(false);
    }, 8000);
  };

  const handleChangeText = (name, value) => {
    updateSystemConfig({ ...systemConfig, [name]: Number(value) });
  };

  const toggleSwitch = (name, value) => {
    updateSystemConfig({ ...systemConfig, [name]: Boolean(value) });
  };

  const saveConfig = async () => {
    setSaving(true);
    console.log(`Saving => ${saving}`);
    try {
      await firebase.db
        .collection("users/" + userId + "/config")
        .doc("system")
        .set(systemConfig)
        .then(() => {
          console.log("System Config successfully written!");
        });
    } catch (error) {
      console.error("Error writing document: ", error);
    }
    handleSave(1);
  };

  const signOut = () => {
    console.log("signout");
    firebase.auth
      .signOut()
      .then(() => {
        props.navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    setTimeout(() => {
      console.log(`Saving timeout`);
      console.log(`Saving => ${saving}`);
      if (saving) {
        alert(
          "Sin respuesta del controlador. Los cambios serán aplicados cuando el equipo se reconecte a internet."
        );
        setSaving(false);
        // props.navigation.navigate("Dashboard");
      }
    }, 8000);
  }, [saving]);

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
          <View style={styles.switch}>
            <View>
              <Text style={styles.textSmall}>Riego Automático: </Text>
            </View>
            <View>
              <Switch
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={systemConfig.autoMode ? "#1db954" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={(value) => toggleSwitch("autoMode", value)}
                value={systemConfig.autoMode}
              />
            </View>
          </View>
          <View style={styles.switch}>
            <View>
              <Text style={styles.textSmall}>Sensor: </Text>
            </View>
            <View>
              <Switch
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={systemConfig.sensorMode ? "#1db954" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={(value) => toggleSwitch("sensorMode", value)}
                value={systemConfig.sensorMode}
              />
            </View>
          </View>
          <ListItem
            containerStyle={{
              backgroundColor: "#121212",
              paddingLeft: -10,
            }}
            onPress={() => {
              props.navigation.navigate("ConfigCalibrate", {
                config: systemConfig,
              });
            }}
          >
            <ListItem.Content>
              <ListItem.Title style={{ color: "#b3b3b3" }}>
                Calibración
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
          <Divider style={{ padding: 10, backgroundColor: "#121212" }} />
          <View>
            <Button
              title="Guardar cambios"
              color="#1db954"
              onPress={() => saveConfig()}
            />
          </View>
          <Divider style={{ padding: 10, backgroundColor: "#121212" }} />
          <View>
            <Button
              title="Desconectar"
              color="tomato"
              onPress={() => signOut()}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
};

export default Config;
