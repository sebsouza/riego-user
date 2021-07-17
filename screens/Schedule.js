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
import DateTimePicker from "@react-native-community/datetimepicker";
// import { CalendarList } from "react-native-calendars";
import { useUserId } from "../context/UserContext";
import { usePubNub } from "pubnub-react";
import { styles } from "../styles";

const testIDs = {
  menu: {
    CONTAINER: "menu",
    CALENDARS: "calendars_btn",
    CALENDAR_LIST: "calendar_list_btn",
    HORIZONTAL_LIST: "horizontal_list_btn",
    AGENDA: "agenda_btn",
    EXPANDABLE_CALENDAR: "expandable_calendar_btn",
    WEEK_CALENDAR: "week_calendar_btn",
  },
  calendars: {
    CONTAINER: "calendars",
    FIRST: "first_calendar",
    LAST: "last_calendar",
  },
  calendarList: { CONTAINER: "calendarList" },
  horizontalList: { CONTAINER: "horizontalList" },
  agenda: {
    CONTAINER: "agenda",
    ITEM: "item",
  },
  expandableCalendar: { CONTAINER: "expandableCalendar" },
  weekCalendar: { CONTAINER: "weekCalendar" },
};
const RANGE = 24;
const initialDate = new Date();

const Schedule = (props) => {
  const pubnub = usePubNub();
  const userId = useUserId();
  const [scheduleConfig, updateScheduleConfig] = useState({});
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(initialDate);
  const [waterAutoLog, setWaterAutoLog] = useState({});
  const markedDates = {
    [selected]: {
      selected: true,
      disableTouchEvent: true,
      selectedColor: "#5E60CE",
      selectedTextColor: "white",
    },
  };
  const [showWater1Time, setShowWater1Time] = useState(false);
  const [showWater2Time, setShowWater2Time] = useState(false);
  const timer = useRef(null); // we can save timer in useRef and pass it to child

  // console.log(typeof markedDates);
  const onDayPress = (day) => {
    setSelected(day.dateString);
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      if (pubnub) {
        const handleAkg = (event) => {
          const akg = event.message;
          if (akg.cmd == "akgScheduleConfig") {
            setSaving(false);
            clearTimeout(timer.current);
            console.log(`Schedule Config Changes Applied.`);
            alert(`Los cambios en la agenda fueron aplicados correctamente.`);
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

  useEffect(() => {
    var scheduleConfigRef = firebase.db
      .collection("users/" + userId + "/config")
      .doc("schedule")
      .onSnapshot((snapshot) => {
        const scheduleConfig = snapshot.data();
        updateScheduleConfig(scheduleConfig);
        // setWater1Time(
        //   new Date(
        //     scheduleConfig.water1StartHour * 3600000 +
        //       scheduleConfig.water1StartMinute * 60000
        //   )
        // );
        setInitializing(false);
        // console.log(`Water 1 Time initialized.`);
        // console.log(`Schedule Config updated`);
      });
    return () => {
      // scheduleConfigRef();
    };
  }, []);

  var options = { year: "numeric", month: "numeric", day: "numeric" };
  useEffect(() => {
    var waterAutoLogRef = firebase.db
      .collection("users/" + userId + "/waterState")
      .where("state", "==", 1)
      .orderBy("timestamp", "desc")
      .limit(10)
      .onSnapshot((querySnapshot) => {
        // var waterAutoLog = {};
        querySnapshot.forEach((doc) => {
          var waterAutoState = doc.data();
          var waterAutoDate = new Date(
            Math.floor(waterAutoState.currentWaterStartTimestamp / 60) *
              60 *
              1000
          );
          markedDates[waterAutoDate.toLocaleDateString("es-CL", options)] = {
            marked: true,
            dotColor: "red",
          };
          setWaterAutoLog({
            ...waterAutoLog,
            Date: waterAutoDate,
            soilMoistInit: waterAutoState.soilMoistInit,
          });
          // console.log("waterAutoState: ", waterAutoState);
        });
        console.log(markedDates);
        // setLoading(false);
      });
    return () => {
      waterAutoLogRef();
    };
  }, []);

  const handleSave = (cmd) => {
    const message = {
      from: "user",
      cmd: cmd,
    };
    pubnub.publish({ channel: "in-" + userId, message });
    console.log(message);
    console.log("Set Schedule Config request sent");
    timer.current = setTimeout(() => {
      console.log(`ALERT! Saving timeout`);
      alert(
        "Sin respuesta del controlador. Los cambios serán aplicados cuando el equipo se reconecte a internet."
      );
      setSaving(false);
    }, 8000);
  };

  const handleChange1 = (event, value) => {
    console.log(`Water 1 Time value => ${value}`);
    const selectedTime =
      value ||
      new Date(
        Date.UTC(
          2000,
          0,
          1,
          scheduleConfig.water1StartHour + new Date().getTimezoneOffset() / 60,
          scheduleConfig.water1StartMinute +
            (new Date().getTimezoneOffset() % 60)
        )
      );
    const selectedHour = selectedTime.getHours();
    const selectedMinute = selectedTime.getMinutes();
    console.log(`Selected Water 1 Time: ${selectedHour}:${selectedMinute}`);
    setShowWater1Time(Platform.OS === "ios");
    updateScheduleConfig({
      ...scheduleConfig,
      water1StartHour: Number(selectedHour),
      water1StartMinute: Number(selectedMinute),
    });
  };

  const handleChange2 = (value) => {
    console.log(`Water 2 Time value => ${value}`);
    const selectedTime =
      value ||
      new Date(
        Date.UTC(
          2000,
          0,
          1,
          scheduleConfig.water2StartHour + new Date().getTimezoneOffset() / 60,
          scheduleConfig.water2StartMinute +
            (new Date().getTimezoneOffset() % 60)
        )
      );
    const selectedHour = selectedTime.getHours();
    const selectedMinute = selectedTime.getMinutes();
    console.log(`Selected Water 2 Time: ${selectedHour}:${selectedMinute}`);
    setShowWater1Time(Platform.OS === "ios");
    updateScheduleConfig({
      ...scheduleConfig,
      water2StartHour: Number(selectedHour),
      water2StartMinute: Number(selectedMinute),
    });
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await firebase.db
        .collection("users/" + userId + "/config")
        .doc("schedule")
        .set(scheduleConfig)
        .then(() => {
          console.log("Schedule Config successfully written!");
        });
    } catch (error) {
      console.error("Error writing document: ", error);
    }
    handleSave(2);
  };

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
          {/*    <View style={{ height: 340, width: 320 }}>
            <CalendarList
              testID={testIDs.calendarList.CONTAINER}
              current={initialDate}
              pastScrollRange={RANGE}
              futureScrollRange={RANGE}
              renderHeader={renderCustomHeader}
              theme={theme}
              onDayPress={onDayPress}
              // markedDates={markedDates}
              markedDates={{
                "2021-06-16": {
                  selected: true,
                  marked: true,
                  selectedColor: "blue",
                },
                "2021-06-17": { marked: true },
                "2021-06-18": {
                  marked: true,
                  dotColor: "red",
                  activeOpacity: 0,
                },
                "2021-06-19": { disabled: true, disableTouchEvent: true },
              }}
            />
          </View> */}

          <ListItem
            containerStyle={{
              backgroundColor: "#121212",
              paddingLeft: -10,
            }}
            onPress={() => {
              setShowWater1Time(true);
              console.log(`Water 1 Time Picker pressed.`);
            }}
          >
            <ListItem.Content>
              <ListItem.Title style={{ color: "#b3b3b3" }}>
                Horario Riego Principal
              </ListItem.Title>
              <ListItem.Subtitle style={{ color: "#535353" }}>
                {scheduleConfig.water1StartHour}:
                {scheduleConfig.water1StartMinute > 9
                  ? scheduleConfig.water1StartMinute
                  : "0" + scheduleConfig.water1StartMinute}
              </ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
          <ListItem
            containerStyle={{
              backgroundColor: "#121212",
              paddingLeft: -10,
            }}
            onPress={() => {
              setShowWater2Time(true);
              console.log(`Water 2 Time Picker pressed.`);
            }}
          >
            <ListItem.Content>
              <ListItem.Title style={{ color: "#b3b3b3" }}>
                Horario Riego Refuerzo (Verano)
              </ListItem.Title>
              <ListItem.Subtitle style={{ color: "#535353" }}>
                {scheduleConfig.water2StartHour}:
                {scheduleConfig.water2StartMinute > 9
                  ? scheduleConfig.water2StartMinute
                  : "0" + scheduleConfig.water2StartMinute}
              </ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
          <ListItem
            containerStyle={{
              backgroundColor: "#121212",
              paddingLeft: -10,
            }}
            onPress={() => {
              props.navigation.navigate("ScheduleRepeat", {
                config: scheduleConfig,
                // setConfig: updateScheduleConfig,
              });
            }}
          >
            <ListItem.Content>
              <ListItem.Title style={{ color: "#b3b3b3" }}>
                Repetir
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>

          <Divider style={{ padding: 10, backgroundColor: "#121212" }} />
          <Button
            title="Aplicar"
            color="#1db954"
            onPress={() => saveConfig()}
          />
          <View>
            {showWater1Time && (
              <DateTimePicker
                testID="dateTimePicker"
                value={
                  new Date(
                    Date.UTC(
                      2000,
                      0,
                      1,
                      scheduleConfig.water1StartHour +
                        new Date().getTimezoneOffset() / 60,
                      scheduleConfig.water1StartMinute +
                        (new Date().getTimezoneOffset() % 60)
                    )
                  )
                }
                mode={"time"}
                is24Hour={true}
                display="spinner"
                minuteInterval={1}
                onChange={handleChange1}
              />
            )}
          </View>
          <View>
            {showWater2Time && (
              <DateTimePicker
                testID="dateTimePicker"
                value={
                  new Date(
                    Date.UTC(
                      2000,
                      0,
                      1,
                      scheduleConfig.water2StartHour +
                        new Date().getTimezoneOffset() / 60,
                      scheduleConfig.water2StartMinute +
                        (new Date().getTimezoneOffset() % 60)
                    )
                  )
                }
                mode={"time"}
                is24Hour={true}
                display="spinner"
                minuteInterval={1}
                onChange={handleChange2}
              />
            )}
          </View>
          <StatusBar style="light" />
        </ScrollView>
      </SafeAreaView>
    );
};

const theme = {
  "stylesheet.calendar.header": {
    dayHeader: {
      fontWeight: "600",
      color: "#48BFE3",
    },
  },
  "stylesheet.day.basic": {
    today: {
      borderColor: "#48BFE3",
      borderWidth: 0.8,
    },
    todayText: {
      color: "#5390D9",
      fontWeight: "800",
    },
  },
};

function renderCustomHeader(date) {
  const header = date.toString("MMMM yyyy");
  const [month, year] = header.split(" ");
  const textStyle = {
    fontSize: 18,
    fontWeight: "bold",
    paddingTop: 10,
    paddingBottom: 10,
    color: "#5E60CE",
    paddingRight: 5,
  };

  return (
    <View style={styles.header}>
      <Text style={[styles.month, textStyle]}>{`${month}`}</Text>
      <Text style={[styles.year, textStyle]}>{year}</Text>
    </View>
  );
}

export default Schedule;
