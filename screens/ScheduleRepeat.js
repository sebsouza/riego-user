import "react-native-gesture-handler";
import React, { useRef, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Text, View, Switch, ScrollView, SafeAreaView } from "react-native";
import firebase from "../database/Firebase";
// import { Input, Divider, Slider } from "react-native-elements";
import {
  useUserId,
  useNotAnswering,
  useNotAnsweringUpdate,
} from "../context/UserContext";
import { usePubNub } from "pubnub-react";
import { styles } from "../styles";
import theme from "../styles/theme.style";

const ScheduleRepeat = ({ navigation: { setParams }, route }) => {
  const pubnub = usePubNub();
  const userId = useUserId();
  const notAnswering = useNotAnswering();
  const setNotAnswering = useNotAnsweringUpdate();
  const timer = useRef(null); // we can save timer in useRef and pass it to child
  const timerNotAnswering = useRef(null);

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      if (pubnub) {
        const handleAkg = (event) => {
          const akg = event.message;
          if (akg.cmd == "akgScheduleConfig") {
            setNotAnswering(false);
            // setSaving(false);
            clearTimeout(timer.current);
            console.log(`Schedule Config Changes Applied.`);
            // alert(`Los cambios en la agenda fueron aplicados correctamente.`);
            // props.navigation.reset({
            //   index: 0,
            //   routes: [{ name: "Main" }],
            // });
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

  const toggleSwitch = async (id, value) => {
    let wdayOn = route.params.config.wdayOn;
    wdayOn[id] = Boolean(value);
    // navigation.navigate({
    //   name: "Schedule",
    //   params: {
    //     config: {
    //       ...route.params.config,
    //       wdayOn,
    //     },
    //   },
    //   merge: true,
    // });
    setParams({
      config: {
        ...route.params.config,
        wdayOn,
      },
    });
    // console.log({
    //   ...route.params.config,
    //   wdayOn,
    // });
    try {
      await firebase.db
        .collection("users/" + userId + "/config")
        .doc("schedule")
        .set(route.params.config)
        .then(() => {
          console.log("Schedule Config successfully written!");
        });
    } catch (error) {
      console.error("Error writing document: ", error);
    }
    handleSave(2);
  };

  const handleSave = (cmd) => {
    setNotAnswering(false);
    const message = {
      from: "user",
      cmd: cmd,
    };
    pubnub.publish({ channel: "in-" + userId, message });
    console.log(message);
    console.log("Set Schedule Config request sent");
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
      // setSaving(false);
    }, 8000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Domingo: </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={
              route.params.config.wdayOn[0]
                ? theme.PRIMARY_COLOR
                : theme.SECONDARY_TEXT_COLOR
            }
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitch(0, value)}
            value={route.params.config.wdayOn[0]}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Lunes: </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={
              route.params.config.wdayOn[1]
                ? theme.PRIMARY_COLOR
                : theme.SECONDARY_TEXT_COLOR
            }
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitch(1, value)}
            value={route.params.config.wdayOn[1]}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Martes: </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={
              route.params.config.wdayOn[2]
                ? theme.PRIMARY_COLOR
                : theme.SECONDARY_TEXT_COLOR
            }
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitch(2, value)}
            value={route.params.config.wdayOn[2]}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Miércoles: </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={
              route.params.config.wdayOn[3]
                ? theme.PRIMARY_COLOR
                : theme.SECONDARY_TEXT_COLOR
            }
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitch(3, value)}
            value={route.params.config.wdayOn[3]}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Jueves: </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={
              route.params.config.wdayOn[4]
                ? theme.PRIMARY_COLOR
                : theme.SECONDARY_TEXT_COLOR
            }
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitch(4, value)}
            value={route.params.config.wdayOn[4]}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Viernes: </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={
              route.params.config.wdayOn[5]
                ? theme.PRIMARY_COLOR
                : theme.SECONDARY_TEXT_COLOR
            }
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitch(5, value)}
            value={route.params.config.wdayOn[5]}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Sábado: </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={
              route.params.config.wdayOn[6]
                ? theme.PRIMARY_COLOR
                : theme.SECONDARY_TEXT_COLOR
            }
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitch(6, value)}
            value={route.params.config.wdayOn[6]}
          />
        </View>
        <StatusBar style="auto" />
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

export default ScheduleRepeat;
