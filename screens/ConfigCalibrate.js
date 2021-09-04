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
// import firebase from "../database/Firebase";
import { Input, Divider, Slider } from "react-native-elements";
import {
  useUserId,
  useSystemConfig,
  useNotAnswering,
  useNotAnsweringUpdate,
} from "../context/UserContext";
import { usePubNub } from "pubnub-react";
import { styles } from "../styles";

const ConfigCalibrate = (props) => {
  const pubnub = usePubNub();
  const userId = useUserId();
  const notAnswering = useNotAnswering();
  const setNotAnswering = useNotAnsweringUpdate();

  const [systemConfig, updateSystemConfig] = useState(
    // props.route.params.config
    useSystemConfig()
  );
  // const [saving, setSaving] = useState(false);
  const timerNotAnswering = useRef(null);

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      if (pubnub) {
        const handleAkg = (event) => {
          const akg = event.message;
          if (akg.cmd == "akgSaveAirValue") {
            // setSaving(false);
            setNotAnswering(false);
            alert("Valor de Humedad Mínimo guardado");
          }
          if (akg.cmd == "akgSaveWaterValue") {
            // setSaving(false);
            setNotAnswering(false);
            alert("Valor de Humedad Máximo guardado");
          }
          if (akg.cmd == "akgAirWaterReset") {
            // setSaving(false);
            setNotAnswering(false);
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

  // useEffect(() => {
  //   var systemConfigRef = firebase.db
  //     .collection("users/" + userId + "/config")
  //     .doc("system")
  //     .onSnapshot((snapshot) => {
  //       const systemConfig = snapshot.data();
  //       console.log(systemConfig);
  //       updateSystemConfig(systemConfig);
  //       // setInitializing(false);
  //     });
  //   return () => {
  //     systemConfigRef();
  //   };
  // }, []);

  const handleSave = (cmd) => {
    setNotAnswering(false);
    const message = {
      from: "user",
      cmd: cmd,
    };
    pubnub.publish({ channel: "in-" + userId, message });
    // setSaving(true);
    console.log(message);
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

  const setAirValue = () => {
    handleSave(4);
  };

  const setWaterValue = () => {
    handleSave(5);
  };

  const resetAirWaterValues = () => {
    handleSave(6);
  };
  // if (saving)
  //   return (
  //     <View
  //       style={{
  //         flex: 1,
  //         padding: 35,
  //         marginTop: 150,
  //       }}
  //     >
  //       <ActivityIndicator size="large" color="#03ff13" />
  //       <StatusBar style="light" />
  //     </View>
  //   );
  // else
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView>
        <View style={styles.text}>
          <Text style={styles.textSmall}>Límite mínimo:</Text>
          <Text style={styles.textLarge}>{systemConfig.airValue} </Text>
        </View>
        <View style={styles.text}>
          <Text style={styles.textSmall}>Límite máximo:</Text>
          <Text style={styles.textLarge}>{systemConfig.waterValue} </Text>
        </View>
        <Divider style={{ padding: 10, backgroundColor: "#121212" }} />
        <View>
          <Button
            title="Calibrar Humedad Mín"
            color="#00b0ff"
            onPress={() => setAirValue()}
          />
        </View>
        <Divider style={{ padding: 10, backgroundColor: "#121212" }} />
        <View>
          <Button
            title="Calibrar Humedad Máx"
            color="#00b0ff"
            onPress={() => setWaterValue()}
          />
        </View>
        <Divider style={{ padding: 10, backgroundColor: "#121212" }} />
        <View>
          <Button
            title="Resetear Calibración"
            color="#00b0ff"
            onPress={() => resetAirWaterValues()}
          />
        </View>
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

export default ConfigCalibrate;
