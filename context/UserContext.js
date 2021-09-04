import React, { useContext, useState } from "react";
import firebase from "../database/Firebase";
import theme from "../styles/theme.style";

const UserContext = React.createContext();
const UserUpdateContext = React.createContext();
const ZonesContext = React.createContext();
const ZonesUpdateContext = React.createContext();
const SystemConfigContext = React.createContext();
const SystemConfigUpdateContext = React.createContext();
const ScheduleContext = React.createContext();
const ScheduleUpdateContext = React.createContext();
const MarkedDatesContext = React.createContext();
const MarkedDatesUpdateContext = React.createContext();
const NotAnsweringContext = React.createContext();
const NotAnsweringUpdateContext = React.createContext();

export function useUserId() {
  return useContext(UserContext);
}

export function useUserIdUpdate() {
  return useContext(UserUpdateContext);
}

export function useZones() {
  return useContext(ZonesContext);
}

export function useZonesUpdate() {
  return useContext(ZonesUpdateContext);
}

export function useSystemConfig() {
  return useContext(SystemConfigContext);
}

export function useSystemConfigUpdate() {
  return useContext(SystemConfigUpdateContext);
}

export function useSchedule() {
  return useContext(ScheduleContext);
}

export function useScheduleUpdate() {
  return useContext(ScheduleUpdateContext);
}

export function useMarkedDates() {
  return useContext(MarkedDatesContext);
}

export function useMarkedDatesUpdate() {
  return useContext(MarkedDatesUpdateContext);
}

export function useNotAnswering() {
  return useContext(NotAnsweringContext);
}

export function useNotAnsweringUpdate() {
  return useContext(NotAnsweringUpdateContext);
}

export function UserProvider({ children }) {
  const [userId, setUserId] = useState("");
  const [zones, setZones] = useState([]);
  const [systemConfig, setSystemConfig] = useState({});
  const [schedule, setSchedule] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [notAnswering, setNotAnswering] = useState(false);
  // const timerNotAnswering = useRef(null);

  function getUserId() {
    const _userId = firebase.auth.currentUser.uid;
    setUserId(_userId);
    console.log("getUserId");
  }

  function getZones() {
    firebase.db
      .collection("users/" + firebase.auth.currentUser.uid + "/zones")
      .onSnapshot((snapshot) => {
        const zones = [];
        snapshot.forEach((doc) => {
          const zoneDetails = doc.data();
          console.log(doc.id, " => ", zoneDetails);
          zones.push({
            id: doc.id,
            zoneDetails,
          });
        });
        // console.log(zones);
        setZones(zones);
        console.log("getZones");
      });
  }

  function getSystemConfig() {
    firebase.db
      .collection("users/" + firebase.auth.currentUser.uid + "/config")
      .doc("system")
      .onSnapshot((snapshot) => {
        const systemConfig = snapshot.data();
        console.log(systemConfig);
        setSystemConfig(systemConfig);
        console.log("getSystemConfig");
      });
  }

  function getSchedule() {
    firebase.db
      .collection("users/" + firebase.auth.currentUser.uid + "/config")
      .doc("schedule")
      .onSnapshot((snapshot) => {
        const schedule = snapshot.data();
        console.log(schedule);
        setSchedule(schedule);
        console.log("getSchedule");
      });
  }

  function formatDate(date) {
    var d = new Date(date),
      month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }

  function getMarkedDates() {
    var _markedDates = {};
    firebase.db
      .collection("users/" + firebase.auth.currentUser.uid + "/measures")
      .where("state", "==", 1)
      .orderBy("timestamp", "desc")
      .limit(100)
      .onSnapshot((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const waterAutoState = doc.data();
          const waterAutoDate = new Date(
            Math.floor(waterAutoState.timestamp / 60) * 60 * 1000
          );
          const waterAutoFormatDate = formatDate(waterAutoDate);
          // console.log(waterAutoState.duration);

          _markedDates[waterAutoFormatDate] = {
            marked: true,
            dotColor: theme.PRIMARY_COLOR,
            soilMoistInit: waterAutoState.soilMoistInit,
            duration: waterAutoState.duration,
          };
        });
        setMarkedDates(_markedDates);
        console.log("getMarkedDates");
      });

    // function getNotAnswering(){
    //   timerNotAnswering.current = setTimeout(() => {
    //     setNotAnswering(false);
    //     clearTimeout(timerNotAnswering.current);
    //   }, 4000);
    // }
  }

  return (
    <UserContext.Provider value={userId}>
      <UserUpdateContext.Provider value={getUserId}>
        <ZonesContext.Provider value={zones}>
          <ZonesUpdateContext.Provider value={getZones}>
            <SystemConfigContext.Provider value={systemConfig}>
              <SystemConfigUpdateContext.Provider value={getSystemConfig}>
                <ScheduleContext.Provider value={schedule}>
                  <ScheduleUpdateContext.Provider value={getSchedule}>
                    <MarkedDatesContext.Provider value={markedDates}>
                      <MarkedDatesUpdateContext.Provider value={getMarkedDates}>
                        <NotAnsweringContext.Provider value={notAnswering}>
                          <NotAnsweringUpdateContext.Provider
                            value={setNotAnswering}
                          >
                            {children}
                          </NotAnsweringUpdateContext.Provider>
                        </NotAnsweringContext.Provider>
                      </MarkedDatesUpdateContext.Provider>
                    </MarkedDatesContext.Provider>
                  </ScheduleUpdateContext.Provider>
                </ScheduleContext.Provider>
              </SystemConfigUpdateContext.Provider>
            </SystemConfigContext.Provider>
          </ZonesUpdateContext.Provider>
        </ZonesContext.Provider>
      </UserUpdateContext.Provider>
    </UserContext.Provider>
  );
}
