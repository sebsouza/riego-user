import React, { useEffect, useState, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Icon } from "react-native-elements";
import {
  useUserId,
  useZones,
  useNotAnswering,
  useNotAnsweringUpdate,
} from "../context/UserContext";
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
import theme from "../styles/theme.style";

const Dashboard = () => {
  const pubnub = usePubNub();
  const userId = useUserId();
  const zones = useZones();
  const notAnswering = useNotAnswering();
  const setNotAnswering = useNotAnsweringUpdate();

  const [currentWaterState, setCurrentWaterState] = useState({});
  const [lastAutoWater, setLastAutoWater] = useState({});
  const [prevAutoWater, setPrevAutoWater] = useState({});
  const [measures, updateMeasures] = useState([]);
  const [soilMoistInitMeasures, updateSoilMoistInitMeasures] = useState([]);
  const [currentMeasure, setCurrentMeasure] = useState({});
  const [prevMeasure, setPrevMeasure] = useState({});
  const [soilMoistureDelta, setSoilMoistureDelta] = useState(0);
  const [waterDurationDelta, setWaterDurationDelta] = useState(0);
  // const [display, updateDisplay] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(true);
  // const [online, setOnline] = useState(false);
  // const [clientStatus, setClientStatus] = useState("updating");
  const [connected, setConnected] = useState(false);
  // const [notAnswering, setNotAnswering] = useState(false);
  let date = new Date();
  const [dateTime, setDateTime] = useState(date.getTime());
  const timer = useRef(null); // we can save timer in useRef and pass it to child
  const timerConnected = useRef(null);
  const timerNotAnswering = useRef(null);

  const wait = (timeout) => {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  };

  const getState = () => {
    setNotAnswering(false);
    console.log("Refreshing...");
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
      // setConnected(true);
      setUpdating(false);
      setNotAnswering(true);
      // setClientStatus("offline");
      timerNotAnswering.current = setTimeout(() => {
        setNotAnswering(false);
        clearTimeout(timerNotAnswering.current);
      }, 4000);
    }, 8000);
  };

  const onRefresh = React.useCallback(() => {
    setUpdating(true);
    getState();
    wait(2000).then(() => setUpdating(false));
  }, []);

  useEffect(() => {
    getState();
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
          console.log(akg);
          if (akg.cmd === "setState") {
            console.log(`WaterState set`);
            // setOnline(true);
            setUpdating(false);
            // setClientStatus("online");
            setNotAnswering(false);
            clearTimeout(timer.current);
            setConnected(true);
            timerConnected.current = setTimeout(() => {
              setConnected(false);
              clearTimeout(timerConnected.current);
            }, 4000);
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
    }, 60000);
    return () => {
      clearInterval(id);
    };
  }, []);

  // Current Water State
  useEffect(() => {
    var currentWaterStateRef = firebase.db
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
          }
        }
        setCurrentWaterState({
          state: waterState.state,
          currentWaterZone: currentWaterZone,
        });
      });
    return () => {
      currentWaterStateRef();
    };
  }, []);

  // Last Auto Water State
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
        const startTime = new Date(
          Math.floor(lastAutoWater.currentWaterStartTimestamp / 60) * 60 * 1000
        );
        // const startDate = startTime.getDate();
        // console.log(`startDate => ${startDate}`);
        // const startMonth = startTime.getMonth();
        const endTime = new Date(
          Math.floor(lastAutoWater.currentWaterEndTimestamp / 60) * 60 * 1000
        );

        setLastAutoWater({
          ...lastAutoWater,
          startTime: startTime,
          // startDate: startDate,
          // startMonth: startMonth,
          endTime: endTime,
          // soilMoistInit: soilMoistInit,
          endTimes: lastAutoWater.endTimes,
          // waterDuration: duration,
        });
      });
    return () => {
      waterTimesRef();
    };
  }, []);

  // Prev Auto Water Duration
  useEffect(() => {
    var measuresRef = firebase.db
      .collection("users/" + userId + "/measures")
      .where("state", "==", 1)
      .orderBy("timestamp", "desc")
      .limit(2)
      .onSnapshot((querySnapshot) => {
        var i = 0;
        var waterLog = {};
        // var currentDuration = 0;
        querySnapshot.forEach((doc) => {
          waterLog = doc.data();
          if (i == 0) {
            const startTime = new Date(
              Math.floor(waterLog.timestamp / 60) * 60 * 1000
            );
            const startDate = startTime.getDate();
            const startMonth = startTime.getMonth();
            // console.log(`startMonth => ${startMonth}`);
            var duration = 0;
            // console.log(`zones => ${zones}`);
            zones.forEach((zone) => {
              // console.log(`water SP for ${zone.id} => ${zone.zoneDetails.waterCapacity}`);
              duration += waterLog.duration[zone.id] / 60.0;
            });
            setLastAutoWater({
              ...lastAutoWater,
              startDate: startDate,
              startMonth: startMonth,
              waterDuration: duration,
            });
          }
          // console.log(waterDuration.duration);
          if (i == 1) {
            var duration = 0;
            // console.log("Prev Auto Water Duration =>");
            // console.log(waterDuration.duration);
            zones.forEach((zone) => {
              // console.log(`water SP for ${zone.id} => ${zone.zoneDetails.waterCapacity}`);
              duration += waterLog.duration[zone.id] / 60.0;
            });

            setPrevAutoWater({ ...prevAutoWater, waterDuration: duration });
            setLoading(false);
          }
          i++;
        });
        // setWaterDurationDelta(currentDuration - duration);
        // setLoading(false);
      });
    return () => {
      measuresRef();
    };
  }, [zones]);

  useEffect(() => {
    if (currentMeasure.soilMoisture != null && prevMeasure.soilMoisture != null)
      setSoilMoistureDelta(
        currentMeasure.soilMoisture - prevMeasure.soilMoisture
      );
    else setSoilMoistureDelta(0);
    // console.log(`Soil Moisture Measure Delta => ${soilMoistureDelta}`);
    // return () => {
    //   cleanup;
    // };
  }, [measures]);

  useEffect(() => {
    var i = 0;
    var measures = [];
    var _soilMoistInitMeasures = [];
    var _currentMeasure = {};
    var _prevMeasure = {};
    var measuresRef = firebase.db
      .collection("users/" + userId + "/measures")
      .orderBy("timestamp", "desc")
      .limit(100)
      .onSnapshot(
        (querySnapshot) => {
          console.log(i);
          querySnapshot.forEach((childMeasure) => {
            var {
              estimatedTemperature,
              soilMoisture,
              soilMoistInit,
              timestamp,
            } = childMeasure.data();
            // console.log(`i = ${i} => i % 10 = ${i % 10}`);
            if (i == 0) {
              // Current
              if (soilMoistInit !== undefined) {
                if (soilMoistInit < 0) _currentMeasure.soilMoisture = null;
                else {
                  // soilMoistInit = 0;
                  _currentMeasure.soilMoisture = soilMoistInit;
                }
              } else {
                switch (soilMoisture) {
                  case -1: // Soil Moisture Sensor Error ! Reading is under AIR value
                    _currentMeasure.soilMoisture = null;
                    break;
                  case -2:
                    _currentMeasure.soilMoisture = null;
                    break;
                  case -3:
                    _currentMeasure.soilMoisture = null;
                    break;
                  case -4:
                    _currentMeasure.soilMoisture = null;
                    break;
                  default:
                    _currentMeasure.soilMoisture = Number(soilMoisture);
                    break;
                }
              }
            }
            if (i == 1) {
              // Prev
              if (soilMoistInit !== undefined) {
                if (soilMoistInit < 0) _prevMeasure.soilMoisture = null;
                else {
                  // soilMoistInit = 0;
                  _prevMeasure.soilMoisture = soilMoistInit;
                }
              } else {
                switch (soilMoisture) {
                  case -1: // Soil Moisture Sensor Error ! Reading is under AIR value
                    _prevMeasure.soilMoisture = null;
                    break;
                  case -2:
                    _prevMeasure.soilMoisture = null;
                    break;
                  case -3:
                    _prevMeasure.soilMoisture = null;
                    break;
                  case -4:
                    _prevMeasure.soilMoisture = null;
                    break;
                  default:
                    _prevMeasure.soilMoisture = Number(soilMoisture);
                    break;
                }
              }
            }
            if (soilMoistInit !== undefined) {
              soilMoistInit >= 0
                ? (soilMoistInit = Number(soilMoistInit))
                : (soilMoistInit = 0);
              _soilMoistInitMeasures.push({
                timestamp: new Date(timestamp * 1000),
                soilMoistInit: soilMoistInit,
              });
            } /* if (i % 1 == 0) */ else {
              // console.log(`Display measure number: ${i}`);
              soilMoisture >= 0
                ? (soilMoisture = Number(soilMoisture))
                : (soilMoisture = null);
              measures.push({
                timestamp: new Date(timestamp * 1000),
                // .toLocaleDateString(
                //   undefined,
                //   options
                // ),
                soilMoisture: soilMoisture,
                temperature: Number(estimatedTemperature),
                // label: "Humedad",
              });
            }
            i++;
          });
        },
        (error) => {
          // var errorCode = error.code;
          var errorMessage = error.message;
          alert(errorMessage);
        }
      );
    setPrevMeasure(_prevMeasure);
    setCurrentMeasure(_currentMeasure);
    updateMeasures(measures);
    updateSoilMoistInitMeasures(_soilMoistInitMeasures);
    // console.log(_soilMoistInitMeasures);
    return () => {
      measuresRef();
    };
  }, []);

  if (loading)
    return (
      <View style={styles.containerLoading}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={theme.SECONDARY_COLOR} />
      </View>
    );
  else
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView
          style={styles.body}
          refreshControl={
            <RefreshControl
              refreshing={updating}
              onRefresh={onRefresh}
              colors={[theme.PRIMARY_COLOR, theme.SECONDARY_COLOR]}
            />
          }
        >
          <View style={styles.row}>
            <Text style={styles.textLarge}>Humedad del Suelo:</Text>
            <View style={styles.dataItem}>
              {soilMoistureDelta != 0 ? (
                <Icon
                  name={soilMoistureDelta > 0 ? "arrow-up" : "arrow-down"}
                  color={
                    soilMoistureDelta > 0
                      ? theme.PRIMARY_COLOR
                      : theme.TERTIARY_COLOR
                  }
                  size={18}
                  type="entypo"
                />
              ) : (
                <View></View>
              )}
              <Text style={styles.textLarge}>
                {" "}
                {Math.round(currentMeasure.soilMoisture)}%
              </Text>
            </View>
          </View>
          {currentWaterState.state == 0 && (
            <View>
              <View style={styles.row}>
                <Text style={styles.textLarge}>Último Riego</Text>
                <Icon
                  name="check"
                  color={theme.PRIMARY_COLOR}
                  size={18}
                  type="entypo"
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.textSmall}>Fecha:</Text>
                <Text style={styles.textLarge}>
                  {lastAutoWater.startDate}/{lastAutoWater.startMonth + 1}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.textSmall}>Duración:</Text>

                <View style={styles.dataItem}>
                  {lastAutoWater.waterDuration - prevAutoWater.waterDuration !=
                  0 ? (
                    <Icon
                      name={
                        lastAutoWater.waterDuration -
                          prevAutoWater.waterDuration >
                        0
                          ? "arrow-up"
                          : "arrow-down"
                      }
                      color={
                        lastAutoWater.waterDuration -
                          prevAutoWater.waterDuration >
                        0
                          ? theme.PRIMARY_COLOR
                          : theme.TERTIARY_COLOR
                      }
                      size={18}
                      type="entypo"
                    />
                  ) : (
                    <View></View>
                  )}
                  <Text style={styles.textLarge}>
                    {" "}
                    {Math.round(lastAutoWater.waterDuration)} min
                  </Text>
                </View>
              </View>
            </View>
          )}

          {currentWaterState.state == 1 && (
            <View>
              <View style={styles.row}>
                <Text style={styles.textLarge}>Regando</Text>
                <Text style={styles.textLarge}>
                  Zona {currentWaterState.currentWaterZone}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.textSmall}>Tiempo Pendiente:</Text>
                <Text style={styles.textLarge}>
                  {lastAutoWater.remainingMin} min
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.textSmall}>Duración Estimada:</Text>
                <Text style={styles.textLarge}>
                  {Math.round(lastAutoWater.waterDuration)} min
                </Text>
              </View>
            </View>
          )}
          {currentWaterState.state == 2 && (
            <View>
              <View style={styles.row}>
                <Text style={styles.textLarge}>
                  Regando Manual Zona {currentWaterState.currentWaterZone}
                </Text>
              </View>
            </View>
          )}
          {currentWaterState.state == 3 && (
            <View>
              <View style={styles.row}>
                <Text style={styles.textLarge}>
                  Prueba Zona {currentWaterState.currentWaterZone}
                </Text>
              </View>
            </View>
          )}
          {currentWaterState.state == 4 && (
            <View>
              <View style={styles.row}>
                <Text style={styles.textLarge}>Llenando Tanque</Text>
              </View>
            </View>
          )}

          <View style={styles.chart}>
            <VictoryChart
              padding={60}
              theme={VictoryTheme.material}
              scale={{ x: "time" }}
              // containerComponent={
              //   <VictoryVoronoiContainer
              //     voronoiDimension="x"
              //     labels={({ datum }) => `${datum.x}: ${datum.y}`}
              //     labelComponent={
              //       <VictoryTooltip
              //         cornerRadius={0}
              //         flyoutStyle={{ fill: "white" }}
              //       />
              //     }
              //   />
              // }
            >
              <VictoryAxis
                // tickValues={measures.map((d) => new Date(d.timestamp))}
                tickFormat={(t) => `${t.getDate()}/${t.getMonth() + 1}`}
                tickCount={3}
                // tickFormat={(date) =>
                //   date.toLocaleDateString("es-AR", { year: "none" })
                // }
              />
              <VictoryAxis
                dependentAxis
                crossAxis
                // width={400}
                // height={400}
                domain={[0, 100]}
                theme={VictoryTheme.grayscale}
                // offsetY={200}
                standalone={false}
              />
              <VictoryAxis dependentAxis />
              <VictoryLine
                interpolation="monotoneX"
                data={measures}
                x="timestamp"
                y="soilMoisture"
                style={{
                  data: {
                    stroke: theme.SECONDARY_COLOR,
                    strokeWidth: 3,
                    strokeLinecap: "round",
                  },
                }}
              />
              <VictoryLine
                interpolation="monotoneX"
                data={measures}
                x="timestamp"
                y="temperature"
                style={{
                  data: { stroke: "#F21F18" },
                }}
              />
              <VictoryScatter
                style={{ data: { fill: theme.PRIMARY_COLOR } }}
                size={7}
                x="timestamp"
                y="soilMoistInit"
                data={soilMoistInitMeasures}
              />
            </VictoryChart>
          </View>
          {/* {showAlert && (
            <View>
              <Text style={styles.alert}>Sin conexión al programador</Text>
            </View>
          )} */}
        </ScrollView>
        {connected && (
          <View style={styles.footer}>
            <Text style={styles.textLarge}>Actualizado</Text>
            <Icon
              name="check"
              color={theme.PRIMARY_COLOR}
              size={18}
              type="entypo"
            />
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
export default Dashboard;
