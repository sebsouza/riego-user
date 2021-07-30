import React, { useEffect, useState, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Icon } from "react-native-elements";
import { useUserId, useZones } from "../context/UserContext";
// import { useZones } from "../context/ZonesContext";
import { usePubNub } from "pubnub-react";
import firebase from "../database/Firebase";
import { styles } from "../styles";
import {
  VictoryLine,
  VictoryChart,
  VictoryTheme,
  VictoryVoronoiContainer,
  VictoryTooltip,
  VictoryScatter,
  VictoryAxis,
} from "victory-native";

const Dashboard = () => {
  const pubnub = usePubNub();
  const userId = useUserId();
  const zones = useZones();
  const [waterState, updateWaterState] = useState({});
  const [lastAutoWater, updateLastAutoWater] = useState({});
  const [measures, updateMeasures] = useState([]);
  const [soilMoistInitMeasures, updateSoilMoistInitMeasures] = useState([]);
  const [currentMeasure, updateCurrentMeasure] = useState({});
  const [display, updateDisplay] = useState({});
  const [loading, setLoading] = useState([true]);
  // const [updating, setUpdating] = useState(true);
  // const [online, setOnline] = useState(false);
  const [clientStatus, setClientStatus] = useState("updating");
  const [showAlert, setShowAlert] = useState(false);
  let date = new Date();
  const [dateTime, setDateTime] = useState(date.getTime());
  const timer = useRef(null); // we can save timer in useRef and pass it to child

  useEffect(() => {
    const message = {
      from: "user",
      cmd: 0,
    };
    // Publish our message to the channel `chat`
    pubnub.publish({ channel: "in-" + userId, message });
    console.log(message);
    console.log("Get waterState request sent");
    timer.current = setTimeout(() => {
      console.log(`ALERT! Updating timeout`);
      // alert(
      //   "Sin respuesta del controlador. Los datos serán actualizados cuando el equipo se reconecte a internet."
      // );
      setShowAlert(true);
      // setUpdating(false);
      setClientStatus("offline");
    }, 8000);
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      if (pubnub) {
        const handleAkg = (event) => {
          const akg = event.message;
          if (akg.cmd === "setState") {
            // setOnline(true);
            // setUpdating(false)
            setClientStatus("online");
            clearTimeout(timer.current);
            console.log(`WaterState updated => ${event.message.cmd}`);
          }
        };
        pubnub.addListener({ message: handleAkg });
        pubnub.subscribe({ channels: ["out-" + userId] });
        return () => {
          mounted = false;
          console.log("Dashboard PubNub Listener unmounted");
          pubnub.removeListener({ message: handleAkg });
          pubnub.unsubscribeAll();
          // setUpdating(false);
        };
      }
    }
  }, [pubnub]);

  // const options = {
  //   weekday: "long",
  //   year: "numeric",
  //   month: "long",
  //   day: "numeric",
  // };

  useEffect(() => {
    const id = setInterval(() => {
      const date = new Date();
      setDateTime(date.getTime());
      // displayClock != displayClock;
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    var waterStateRef = firebase.db
      .collection("users/" + userId + "/waterState")
      .orderBy("timestamp", "desc")
      .limit(1)
      .onSnapshot((querySnapshot) => {
        var waterState = {};
        querySnapshot.forEach((doc) => {
          waterState = doc.data();
        });
        var currentWaterZone = "";
        for (const zone in waterState.valveState) {
          const valveState = waterState.valveState[zone];
          if (valveState) {
            currentWaterZone = zone.slice(-1);
            // console.log("currentWaterZone: ", zone.slice(-1));
          }
        }
        updateWaterState({
          state: waterState.state,
          currentWaterZone: currentWaterZone,
          // currentWaterEndTimestamp:waterState.currentWaterEndTimestamp
        });
        // console.log("Water State: ", waterState);
      });
    return () => {
      waterStateRef();
    };
  }, []);

  useEffect(() => {
    var waterTimesRef = firebase.db
      .collection("users/" + userId + "/waterState")
      .where("state", "==", 1)
      .orderBy("timestamp", "desc")
      .limit(1)
      .onSnapshot((querySnapshot) => {
        var lastAutoWater = {};
        querySnapshot.forEach((doc) => {
          lastAutoWater = doc.data();
        });
        updateLastAutoWater({
          currentWaterStartTimestamp: lastAutoWater.currentWaterStartTimestamp,
          currentWaterEndTimestamp: lastAutoWater.currentWaterEndTimestamp,
          soilMoistInit: lastAutoWater.soilMoistInit,
        });
        // console.log("Water Timestamps: ", lastAutoWater);
      });
    return () => {
      waterTimesRef();
    };
  }, [waterState]);

  useEffect(() => {
    var state = waterState.state;

    var waterZone = waterState.currentWaterZone + 1;

    var endTime = new Date(
      Math.floor(lastAutoWater.currentWaterEndTimestamp / 60) * 60 * 1000
    );

    var remaining = Math.ceil((display.endTime - dateTime) / 1000);
    if (remaining < 0) remaining = 0;
    var remainingHr = Math.floor(remaining / 3600);
    var remainingMin = Math.floor((remaining - remainingHr * 3600) / 60);
    remainingMin = remainingMin < 10 ? "0" + remainingMin : remainingMin;
    var remainingSec = remaining - remainingHr * 3600 - remainingMin * 60;
    remainingSec = remainingSec < 10 ? "0" + remainingSec : remainingSec;

    var startTime = new Date(
      Math.floor(lastAutoWater.currentWaterStartTimestamp / 60) * 60 * 1000
    );
    var duration = Math.ceil((endTime - startTime) / 1000);
    if (duration < 0) duration = 0;
    var durationHr = Math.floor(duration / 3600);
    var durationMin = Math.floor((duration - durationHr * 3600) / 60);
    durationMin = durationMin < 10 ? "0" + durationMin : durationMin;

    updateDisplay({
      ...display,
      state: state,
      waterZone: waterZone,
      remainingHr: remainingHr,
      remainingMin: remainingMin,
      remainingSec: remainingSec,
      durationHr: durationHr,
      durationMin: durationMin,
      startTime: startTime,
      endTime: endTime,
    });
  }, [waterState, lastAutoWater, dateTime]);

  useEffect(() => {
    const waterVolume = zones.forEach((zone) => {
      console.log(`water SP for ${zone.id} => ${zone.zoneDetails.waterQ}`);
    });
  }, []);

  useEffect(() => {
    var measuresRef = firebase.db
      .collection("users/" + userId + "/measures")
      .orderBy("timestamp", "desc")
      .limit(500)
      .onSnapshot(
        (querySnapshot) => {
          var i = 0;

          var measures = [];
          var soilMoistInitMeasures = [];
          var currentMeasure = {};
          querySnapshot.forEach((childMeasure) => {
            const {
              estimatedTemperature,
              soilMoisture,
              soilMoistInit,
              timestamp,
            } = childMeasure.data();
            // console.log(`i = ${i} => i % 10 = ${i % 10}`);
            if (i == 0) {
              if (soilMoistInit !== undefined) {
                // if (soilMoistInit == -1)
                //   currentMeasure.soilMoisture = 'Sensor';
                // else
                if (soilMoistInit == -2) currentMeasure.soilMoisture = "ERROR";
                else currentMeasure.soilMoisture = Number(soilMoistInit);
              } else if (soilMoisture == -2)
                currentMeasure.soilMoisture = "ERROR";
              else currentMeasure.soilMoisture = Number(soilMoisture);
            }
            if (soilMoistInit !== undefined) {
              soilMoistInitMeasures.push({
                timestamp: new Date(timestamp * 1000),
                soilMoistInit: Number(soilMoistInit),
              });
            } else if (i % 20 == 0) {
              // console.log(`Display measure number: ${i}`);
              measures.push({
                timestamp: new Date(timestamp * 1000),
                // .toLocaleDateString(
                //   undefined,
                //   options
                // ),
                soilMoisture: Number(soilMoisture),
                temperature: Number(estimatedTemperature),
                // label: "Humedad",
              });
            }
            i++;
          });
          updateMeasures(measures);
          updateSoilMoistInitMeasures(soilMoistInitMeasures);
          updateCurrentMeasure(currentMeasure);
          console.log(soilMoistInitMeasures);
          setLoading(false);
        },
        (error) => {
          // var errorCode = error.code;
          var errorMessage = error.message;
          alert(errorMessage);
        }
      );
    return () => {
      measuresRef();
    };
  }, []);

  if (loading)
    return (
      <View style={styles.containerLoading}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#3034ba" />
      </View>
    );
  else
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView style={styles.body}>
          <View>
            {clientStatus == "updating" ? (
              <View style={styles.text}>
                <Text style={styles.textLarge}>Actualizando...</Text>
                <ActivityIndicator size="small" color="#3034ba" />
              </View>
            ) : (
              <View>
                {clientStatus == "online" ? (
                  <View>
                    <View style={styles.text}>
                      <Text style={styles.textLarge}>Último Riego</Text>
                      <Icon name="done" color="#1db954" size={18} />
                    </View>

                    <View style={styles.text}>
                      <Text style={styles.textSmall}>Fecha:</Text>
                      <Text style={styles.textLarge}>
                        {display.startTime.getUTCDate()}/
                        {display.startTime.getUTCMonth() + 1}
                      </Text>
                    </View>

                    <View style={styles.text}>
                      <Text style={styles.textSmall}>Volumen:</Text>
                      <Text style={styles.textLarge}>
                        {/* {display.durationHr}:{display.durationMin} */}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View>
                    <View style={styles.text}>
                      <Text style={styles.textLarge}>Error de conexión</Text>
                      {/* <Icon name="schedule" color="#b3b3b3" size={18} /> */}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {waterState.state == 1 && (
            <View>
              <View style={styles.text}>
                <Text style={styles.textLarge}>
                  Regando Zona {waterState.currentWaterZone}
                </Text>
              </View>
              <View style={styles.text}>
                <Text style={styles.textSmall}>Tiempo Pendiente:</Text>
                <Text style={styles.textLarge}>
                  {display.remainingHr}:{display.remainingMin}:
                  {display.remainingSec}
                </Text>
              </View>
            </View>
          )}
          {waterState.state == 2 && (
            <View>
              <View style={styles.text}>
                <Text style={styles.textLarge}>
                  Regando Manual Zona {waterState.currentWaterZone}
                </Text>
              </View>
            </View>
          )}
          {waterState.state == 3 && (
            <View>
              <View style={styles.text}>
                <Text style={styles.textLarge}>
                  Prueba Zona {waterState.currentWaterZone}
                </Text>
              </View>
            </View>
          )}
          {waterState.state == 4 && (
            <View>
              <View style={styles.text}>
                <Text style={styles.textLarge}>Llenando Tanque</Text>
              </View>
            </View>
          )}

          <View style={styles.text}>
            <Text style={styles.textSmall}>Humedad del Suelo:</Text>
            <Text style={styles.textLarge}>
              {Math.round(currentMeasure.soilMoisture)}%
            </Text>
          </View>

          <View style={styles.chart}>
            <VictoryChart
              padding={60}
              theme={VictoryTheme.material}
              scale={{ x: "time" }}
              // containerComponent={
              // <VictoryVoronoiContainer
              //   voronoiDimension="x"
              //   labels={({ datum }) => `${datum.x}: ${datum.y}`}
              //   labelComponent={
              //     <VictoryTooltip
              //       cornerRadius={0}
              //       flyoutStyle={{ fill: "white" }}
              //     />
              //   }
              // />
              // }
            >
              <VictoryLine
                interpolation="monotoneX"
                data={measures}
                x="timestamp"
                y="soilMoisture"
                style={{
                  data: { stroke: "#494DF2" },
                }}
              />
              {/* <VictoryLine
                interpolation="monotoneX"
                data={measures}
                x="timestamp"
                y="temperature"
                style={{
                  data: { stroke: "#F21F18" },
                }}
              /> */}
              <VictoryScatter
                style={{ data: { fill: "#1EBA55" } }}
                size={7}
                x="timestamp"
                y="soilMoistInit"
                data={soilMoistInitMeasures}
              />
              <VictoryAxis
                // tickValues={measures.map((d) => new Date(d.timestamp))}
                tickFormat={(t) => `${t.getUTCDate()}/${t.getUTCMonth() + 1}`}
              />
              <VictoryAxis dependentAxis />
            </VictoryChart>
          </View>
          {/* {showAlert && (
            <View>
              <Text style={styles.alert}>Sin conexión al programador</Text>
            </View>
          )} */}
        </ScrollView>
        <View style={styles.footer}>
          <Text>Conectado</Text>
          <Icon name="done" color="#1db954" size={18} />
        </View>
      </SafeAreaView>
    );
};
export default Dashboard;
