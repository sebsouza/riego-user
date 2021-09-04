import "react-native-gesture-handler";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Text,
  View,
  Button,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import firebase from "../database/Firebase";
import { Divider, ListItem } from "react-native-elements";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, LocaleConfig } from "react-native-calendars";
import {
  useUserId,
  useSchedule,
  useMarkedDates,
  useZones,
  useNotAnswering,
  useNotAnsweringUpdate,
} from "../context/UserContext";
import { usePubNub } from "pubnub-react";
import { styles } from "../styles";
import theme from "../styles/theme.style";
// import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "react-native-elements";

LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthNamesShort: [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ],
  dayNames: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

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
const RANGE = 12;

function formatDate(date) {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

const initialDate = formatDate(new Date());
// const calendarWidth = "80%";

const Schedule = ({ navigation, route }) => {
  const pubnub = usePubNub();
  const userId = useUserId();
  const zones = useZones();
  const notAnswering = useNotAnswering();
  const setNotAnswering = useNotAnsweringUpdate();

  const [scheduleConfig, setScheduleConfig] = useState(useSchedule());
  // const [initializing, setInitializing] = useState(true);
  // const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(initialDate);
  const [showDateDetails, setShowDateDetails] = useState(false);
  const autoWaterLog = useMarkedDates();
  const markedDates = {
    ...autoWaterLog,
    [selected]: {
      selected: true,
      disableTouchEvent: true,
      selectedColor: theme.SECONDARY_COLOR,
      selectedTextColor: "white",
      ...(autoWaterLog.hasOwnProperty(selected) ? autoWaterLog[selected] : {}),
    },
  };
  const [selectedDuration, setSelectedDuration] = useState(0);

  const [showWater1Time, setShowWater1Time] = useState(false);
  const [showWater2Time, setShowWater2Time] = useState(false);
  const timer = useRef(null); // we can save timer in useRef and pass it to child
  const timerDayDetails = useRef(null); // we can save timer in useRef and pass it to child
  const timerNotAnswering = useRef(null);
  // useFocusEffect(
  //   useCallback(() => {
  //     console.log(route);
  //   })
  // );

  // useEffect(() => {
  //   console.log(`params updated`);
  //   if (route.params?.config) {
  //     console.log(route.params?.config);
  //   }
  //   // return () => {
  //   //   cleanup;
  //   // };
  // }, [route.params?.config]);

  // console.log(typeof markedDates);
  const onDayPress = (day) => {
    setSelected(day.dateString);
    if (autoWaterLog[day.dateString] !== undefined) {
      setShowDateDetails(true);
      clearTimeout(timerDayDetails.current);
      timerDayDetails.current = setTimeout(() => {
        setShowDateDetails(false);
      }, 8000);
    } else setShowDateDetails(false);
  };

  function formatDayMonth(date) {
    const regex = /^\d{4}[\-](0?[1-9]|1[012])[\-](0?[1-9]|[12][0-9]|3[01])$/;
    return date.replace(regex, "$2/$1");
  }

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

  useEffect(() => {
    if (autoWaterLog[selected] !== undefined) {
      var duration = 0;
      zones.forEach((zone) => {
        duration += autoWaterLog[selected].duration[zone.id] / 60.0;
        // console.log(autoWaterLog[selected].duration[zone.id]);
        setSelectedDuration(duration);
      });
    }

    // return () => {
    //   cleanup;
    // };
  }, [selected]);

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

  const handleChange1 = async (event, value) => {
    // console.log(`Water 1 Time value => ${value}`);
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
    setScheduleConfig({
      ...scheduleConfig,
      water1StartHour: Number(selectedHour),
      water1StartMinute: Number(selectedMinute),
    });
    try {
      await firebase.db
        .collection("users/" + userId + "/config")
        .doc("schedule")
        .set({
          ...scheduleConfig,
          water1StartHour: Number(selectedHour),
          water1StartMinute: Number(selectedMinute),
        })
        .then(() => {
          console.log("Schedule Config successfully written!");
        });
    } catch (error) {
      console.error("Error writing document: ", error);
    }
    handleSave(2);
  };

  const handleChange2 = async (event, value) => {
    // console.log(`Water 2 Time value => ${value}`);
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
    setShowWater2Time(Platform.OS === "ios");
    setScheduleConfig({
      ...scheduleConfig,
      water2StartHour: Number(selectedHour),
      water2StartMinute: Number(selectedMinute),
    });
    try {
      await firebase.db
        .collection("users/" + userId + "/config")
        .doc("schedule")
        .set({
          ...scheduleConfig,
          water2StartHour: Number(selectedHour),
          water2StartMinute: Number(selectedMinute),
        })
        .then(() => {
          console.log("Schedule Config successfully written!");
        });
    } catch (error) {
      console.error("Error writing document: ", error);
    }
    handleSave(2);
  };

  // const saveConfig = async () => {
  //   setSaving(true);
  //   try {
  //     await firebase.db
  //       .collection("users/" + userId + "/config")
  //       .doc("schedule")
  //       .set(scheduleConfig)
  //       .then(() => {
  //         console.log("Schedule Config successfully written!");
  //       });
  //   } catch (error) {
  //     console.error("Error writing document: ", error);
  //   }
  //   handleSave(2);
  // };

  // if (initializing)
  //   return (
  //     <View
  //       style={{
  //         flex: 1,
  //         padding: 35,
  //         marginTop: 150,
  //       }}
  //     >
  //       <ActivityIndicator size="large" color="#00b0ff" />
  //       <StatusBar style="light" />
  //     </View>
  //   );
  // else
  // if (saving)
  //   return (
  //     <View style={styles.containerLoading}>
  //       <StatusBar style="light" />
  //       <ActivityIndicator size="large" color={theme.PRIMARY_COLOR} />
  //     </View>
  //   );
  // else
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.calendarList}>
        <Calendar
          testID={testIDs.calendars.CONTAINER}
          current={initialDate}
          pastScrollRange={RANGE}
          futureScrollRange={RANGE}
          horizontal
          pagingEnabled
          // calendarWidth={340}
          // renderHeader={renderCustomHeader}
          theme={themeCalendar}
          onDayPress={onDayPress}
          markedDates={markedDates}
        />
      </View>
      <ScrollView>
        <ListItem
          containerStyle={{
            backgroundColor: "#121212",
            paddingLeft: -10,
          }}
          onPress={() => {
            setShowWater1Time(true);
            // console.log(`Water 1 Time Picker pressed.`);
          }}
        >
          <ListItem.Content>
            <ListItem.Title style={{ color: "#b3b3b3" }}>
              Horario Riego 1ʳⁱᵒ
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
            <ListItem.Title style={{ color: theme.SECONDARY_TEXT_COLOR }}>
              Horario Riego 2ʳⁱᵒ
            </ListItem.Title>
            <ListItem.Subtitle style={{ color: theme.TERTIARY_TEXT_COLOR }}>
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
            navigation.navigate("ScheduleRepeat", {
              config: scheduleConfig,
            });
          }}
        >
          <ListItem.Content>
            <ListItem.Title style={{ color: theme.SECONDARY_TEXT_COLOR }}>
              Repetir
            </ListItem.Title>
            <ListItem.Subtitle style={{ color: theme.TERTIARY_TEXT_COLOR }}>
              {scheduleConfig.wdayOn[0] ? "Dom " : ""}
              {scheduleConfig.wdayOn[1] ? "Lun " : ""}
              {scheduleConfig.wdayOn[2] ? "Mar " : ""}
              {scheduleConfig.wdayOn[3] ? "Mié " : ""}
              {scheduleConfig.wdayOn[4] ? "Jue " : ""}
              {scheduleConfig.wdayOn[5] ? "Vie " : ""}
              {scheduleConfig.wdayOn[6] ? "Sáb " : ""}
            </ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>

        {/* <Divider style={{ padding: 10, backgroundColor: "#121212" }} />
          <Button
            title="Aplicar"
            color={theme.PRIMARY_COLOR}
            onPress={() => saveConfig()}
          /> */}
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
              minuteInterval={10}
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
              minuteInterval={10}
              onChange={handleChange2}
            />
          )}
        </View>
        <StatusBar style="light" />
      </ScrollView>
      {showDateDetails && (
        <View style={styles.footerCalendar}>
          <Text style={styles.textLarge}>{formatDayMonth(selected)}</Text>
          <Icon
            name="water"
            color={theme.SECONDARY_COLOR}
            size={18}
            type="entypo"
          />
          <Text style={styles.textSmall}>
            {"".concat(Math.round(autoWaterLog[selected].soilMoistInit), " %")}
          </Text>
          <Icon
            name="clock"
            color={theme.PRIMARY_COLOR}
            size={18}
            type="entypo"
          />
          <Text style={styles.textSmall}>
            {"".concat(Math.round(selectedDuration), " min")}
          </Text>
        </View>
      )}
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

const themeCalendar = {
  calendarBackground: "#121212",
  dayTextColor: /* theme.TERTIARY_TEXT_COLOR */ "red",
  "stylesheet.calendar.header": {
    dayHeader: {
      fontWeight: "600",
      color: theme.SECONDARY_TEXT_COLOR,
    },
    monthText: { color: theme.SECONDARY_TEXT_COLOR },
    arrow: { padding: 5 },
    arrowImage: { tintColor: theme.SECONDARY_COLOR },
  },
  "stylesheet.day.basic": {
    today: {
      borderColor: "#121212",
      borderWidth: 0.8,
    },
    todayText: {
      color: theme.PRIMARY_TEXT_COLOR,
      fontWeight: "800",
    },
    text: {
      color: theme.SECONDARY_TEXT_COLOR,
      marginTop: Platform.OS === "android" ? 4 : 6,
      fontSize: theme.FONT_SIZE_MEDIUM,
      // fontFamily: appStyle.textDayFontFamily,
      fontWeight: "400",
      backgroundColor: "rgba(255, 255, 255, 0)",
    },
    disabledText: {
      color: theme.TERTIARY_TEXT_COLOR,
    },
  },
};

// function renderCustomHeader(date) {
//   const header = date.toString("MMMM yyyy");
//   const [month, year] = header.split(" ");
//   const textStyle = {
//     fontSize: 18,
//     fontWeight: "bold",
//     paddingTop: 10,
//     paddingBottom: 10,
//     color: theme.PRIMARY_TEXT_COLOR,
//     paddingRight: 5,
//   };

//   return (
//     <View style={styles.header}>
//       <Text style={[styles.month, textStyle]}>{`${month}`}</Text>
//       <Text style={[styles.year, textStyle]}>{year}</Text>
//     </View>
//   );
// }

export default Schedule;
