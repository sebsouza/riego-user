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
import { useUserId } from "../context/UserContext";
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
} from "victory-native";

const Dashboard = () => {
  const pubnub = usePubNub();
  const userId = useUserId();
  const [waterState, updateWaterState] = useState({});
  const [lastAutoWater, updateLastAutoWater] = useState({});
  const [measures, updateMeasures] = useState([]);
  const [soilMoistInitMeasures, updateSoilMoistInitMeasures] = useState([]);
  const [currentMeasure, updateCurrentMeasure] = useState({});
  const [loading, setLoading] = useState([true]);
  const [display, updateDisplay] = useState({ clockDisplay: true });
  let date = new Date();
  const [dateTime, setDateTime] = useState(date.getTime());
  const [updating, setUpdating] = useState(true);
  const [online, setOnline] = useState(false);
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
      alert(
        "Sin respuesta del controlador. Los datos serán actualizados cuando el equipo se reconecte a internet."
      );
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
            setOnline(true);
            setUpdating(false);
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
          setUpdating(false);
        };
      }
    }
  }, [pubnub]);

  let options = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    // second: "numeric",
  };

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
            console.log("currentWaterZone: ", zone.slice(-1));
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
                currentMeasure.soilMoisture = Number(soilMoistInit);
              } else currentMeasure.soilMoisture = Number(soilMoisture);
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

  // // const styleById = {
  // //   // Humedad: {
  // //   //   strokeDasharray: "1, 16",
  // //   //   strokeWidth: 8,
  // //   //   strokeLinejoin: "round",
  // //   //   strokeLinecap: "round",
  // //   // },
  // //   // Temperatura: {
  // //   //   strokeDasharray: "6, 6",
  // //   //   strokeWidth: 4,
  // //   // },
  // //   Riego: {
  // //     // strokeDasharray: "1, 16",
  // //     strokeWidth: 12,
  // //     strokeLinejoin: "round",
  // //     strokeLinecap: "round",
  // //   },
  // //   default: {
  // //     // strokeDasharray: "12, 6",
  // //     strokeWidth: 2,
  // //   },
  // // };

  // // const DashedLine = ({ series, lineGenerator, xScale, yScale }) => {
  // //   return series.map(({ id, data, color }) => (
  // //     <path
  // //       key={id}
  // //       d={lineGenerator(
  // //         data.map((d) => ({
  // //           x: xScale(d.data.x),
  // //           y: yScale(d.data.y),
  // //         }))
  // //       )}
  // //       fill="none"
  // //       stroke={color}
  // //       style={styleById[id] || styleById.default}
  // //     />
  // //   ));
  // // };

  // // const CustomSymbol = ({ size, color, borderWidth, borderColor }) => (
  // //   <g>
  // //     <path d="M0 -20 L-16 20 L16 20 Z" />
  // //   </g>
  // // );

  // function SymbolCircle({
  //   x,
  //   y,
  //   size,
  //   fill,
  //   opacity = 1,
  //   borderWidth = 0,
  //   borderColor = "transparent",
  // }) {
  //   return (
  //     <Svg>
  //       <Circle
  //         r={size / 2}
  //         cx={x + size / 2}
  //         cy={y + size / 2}
  //         fill={fill}
  //         opacity={opacity}
  //         strokeWidth={borderWidth}
  //         stroke={borderColor}
  //         style={{
  //           pointerEvents: "none",
  //         }}
  //       />
  //     </Svg>
  //   );
  // }

  // // function SymbolTriangle({
  // //   x,
  // //   y,
  // //   size,
  // //   fill,
  // //   opacity = 1,
  // //   borderWidth = 0,
  // //   borderColor = "transparent",
  // // }) {
  // //   return (
  // //     <g transform={`translate(${x},${y})`}>
  // //       <path
  // //         d={`
  // //               M${size / 2} 0
  // //               L${size} ${size}
  // //               L0 ${size}
  // //               L${size / 2} 0
  // //           `}
  // //         fill={fill}
  // //         opacity={opacity}
  // //         strokeWidth={borderWidth}
  // //         stroke={borderColor}
  // //         style={{
  // //           pointerEvents: "none",
  // //         }}
  // //       />
  // //     </g>
  // //   );
  // // }

  // function SymbolWater({
  //   x,
  //   y,
  //   size,
  //   fill,
  //   opacity = 1,
  //   borderWidth = 0,
  //   borderColor = "transparent",
  // }) {
  //   return (
  //     <Svg transform={`translate(${x},${y})`}>
  //       <Path
  //         d={`
  //         M 6.4 12.2 C 9.7 12.2 12.4 9.5 12.4 6.2 C 12.4 3 6.8 -4.4 6.6 -4.7 L 6.4 -4.9 L 6.3 -4.7 C 6 -4.4 0.4 3 0.4 6.2 C 0.4 9.5 3.1 12.2 6.4 12.2 Z
  //         `}
  //         fill={"#1db954"}
  //         opacity={opacity}
  //         strokeWidth={borderWidth}
  //         stroke={borderColor}
  //         style={{
  //           pointerEvents: "none",
  //         }}
  //       />
  //     </Svg>
  //   );
  // }

  // function Points({ pointSize = 0, points }) {
  //   /**
  //    * We reverse the `points` array so that points from the lower lines in stacked lines
  //    * graph are drawn on top. See https://github.com/plouc/nivo/issues/1051.
  //    */
  //   const mappedPoints = points.reverse().map((point) => ({
  //     id: point.id,
  //     symbol: ["Riego"].includes(`${point.serieId}`)
  //       ? SymbolWater
  //       : SymbolCircle,
  //     x: point.x - pointSize / 2,
  //     y: point.y - pointSize / 2,
  //     fill: point.color,
  //     borderColor: point.borderColor,
  //   }));

  //   return (
  //     <g>
  //       {mappedPoints.map(({ symbol, ...point }) =>
  //         React.createElement(symbol, {
  //           ...point,
  //           size: pointSize,
  //           key: point.id,
  //         })
  //       )}
  //     </g>
  //   );
  // }

  if (loading)
    return (
      <View style={styles.containerLoading}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#00b0ff" />
      </View>
    );
  else
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView>
          {waterState.state == 0 && (
            <View>
              {updating ? (
                <View style={styles.text}>
                  <Text style={styles.textLarge}>Actualizando...</Text>
                  <ActivityIndicator size="small" color="#00b0ff" />
                </View>
              ) : (
                <View></View>
              )}
              {online ? (
                <View style={styles.text}>
                  <Text style={styles.textLarge}>Conectado</Text>
                  <Icon name="done" color="#1db954" size={18} />
                </View>
              ) : (
                <View style={styles.text}>
                  <Text style={styles.textLarge}>Esperando...</Text>
                  <Icon name="schedule" color="#b3b3b3" size={18} />
                </View>
              )}
              <View style={styles.text}>
                <Text style={styles.textSmall}>Último Riego:</Text>
                <Text style={styles.textLarge}>
                  {display.startTime.toLocaleString(undefined, options)}
                </Text>
              </View>
              <View style={styles.text}>
                <Text style={styles.textSmall}>Duración:</Text>
                <Text style={styles.textLarge}>
                  {display.durationHr}:{display.durationMin}
                </Text>
              </View>
            </View>
          )}

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
                style={{ data: { fill: "#1EBA55" } }}
                size={7}
                x="timestamp"
                y="soilMoistInit"
                data={soilMoistInitMeasures}
              />
            </VictoryChart>
            {/* <ResponsiveLine
              data={measures}
              colors={{ scheme: "set1" }}
              theme={{ background: "#121212", textColor: "#b3b3b3" }}
              margin={{
                top: 20,
                right: 15,
                bottom: 30,
                left: 30,
              }}
              curve="monotoneX"
              xScale={{
                type: "time",
                format: "%d/%m/%Y %H:%M",
                useUTC: false,
                precision: "second",
              }}
              xFormat="time:%d/%m/%Y %H:%M"
              yScale={{
                type: "linear",
                stacked: false,
              }}
              axisLeft={
                {
                  // legend: "Humedad / Temperatura",
                  // legendOffset: -12,
                  // legendPosition: "middle",
                }
              }
              axisBottom={{
                format: "%e/%m",
                tickValues: "every 1 days",
                // legend: "time scale",
                // legendOffset: 36,
                // legendPosition: "middle",
              }}
              layers={[
                "grid",
                "markers",
                "areas",
                // DashedLine,
                "lines",
                "slices",
                // Points,
                "axes",
                "legends",
              ]}
              // isInteractive={false}
              lineWidth={3}
              animate={true}
              pointSize={1}
              // pointBorderWidth={1}
              // pointBorderColor={{
              //   from: "color",
              //   modifiers: [["darker", 0.3]],
              // }}
              // pointColor="green"
              useMesh={true}
              enableSlices={false}
              legends={[
                {
                  anchor: "bottom-right",
                  direction: "column",
                  justify: false,
                  translateX: -25,
                  translateY: -5,
                  itemsSpacing: 0,
                  itemDirection: "left-to-right",
                  itemWidth: 80,
                  itemHeight: 20,
                  itemOpacity: 0.8,
                  symbolSize: 12,
                  symbolShape: (props) =>
                    ["Riego"].includes(`${props.id}`) ? (
                      <SymbolWater {...props} />
                    ) : (
                      <SymbolCircle {...props} />
                    ),
                  // symbolShape: "circle",
                  symbolBorderColor: "rgba(0, 0, 0, .5)",
                  // effects: [
                  //   {
                  //     on: "hover",
                  //     style: {
                  //       itemBackground: "rgba(0, 0, 0, .03)",
                  //       itemOpacity: 1,
                  //     },
                  //   },
                  // ],
                },
              ]}
            /> */}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
};
export default Dashboard;
