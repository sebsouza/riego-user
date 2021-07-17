import "react-native-gesture-handler";
import React, { useState, useEffect } from "react";
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
import { Input, Divider, Slider } from "react-native-elements";
import { useUserId } from "../context/UserContext";
import { usePubNub } from "pubnub-react";
import { styles } from "../styles";

const ScheduleRepeat = (props) => {
  const [scheduleConfig, updateScheduleConfig] = useState(
    props.route.params.config
  );

  const toggleSwitch = (id, value) => {
    let wdayOn = scheduleConfig.wdayOn;
    wdayOn[id] = Boolean(value);
    updateScheduleConfig({
      ...scheduleConfig,
      wdayOn,
    });
    console.log(scheduleConfig);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Domingo: </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={scheduleConfig.wdayOn[0] ? "#618833" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitch(0, value)}
            value={scheduleConfig.wdayOn[0]}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Lunes: </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={scheduleConfig.wdayOn[1] ? "#618833" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitch(1, value)}
            value={scheduleConfig.wdayOn[1]}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Martes: </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={scheduleConfig.wdayOn[2] ? "#618833" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitch(2, value)}
            value={scheduleConfig.wdayOn[2]}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Miércoles: </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={scheduleConfig.wdayOn[3] ? "#618833" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitch(3, value)}
            value={scheduleConfig.wdayOn[3]}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Jueves: </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={scheduleConfig.wdayOn[4] ? "#618833" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitch(4, value)}
            value={scheduleConfig.wdayOn[4]}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Viernes: </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={scheduleConfig.wdayOn[5] ? "#618833" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitch(5, value)}
            value={scheduleConfig.wdayOn[5]}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.textSmall}>Sábado: </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={scheduleConfig.wdayOn[6] ? "#618833" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => toggleSwitch(6, value)}
            value={scheduleConfig.wdayOn[6]}
          />
        </View>
        <StatusBar style="auto" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScheduleRepeat;
