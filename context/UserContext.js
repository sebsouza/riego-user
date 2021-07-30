import React, { useContext, useState } from "react";
import firebase from "../database/Firebase";

const UserContext = React.createContext();
const UserUpdateContext = React.createContext();
const ZonesContext = React.createContext();
const ZonesUpdateContext = React.createContext();
const SystemConfigContext = React.createContext();
const SystemConfigUpdateContext = React.createContext();

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

export function UserProvider({ children }) {
  const [userId, setUserId] = useState("");
  const [zones, setZones] = useState([]);
  const [systemConfig, setSystemConfig] = useState({});

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
      });
    console.log("getZones");
  }

  function getSystemConfig() {
    firebase.db
      .collection("users/" + firebase.auth.currentUser.uid + "/config")
      .doc("system")
      .onSnapshot((snapshot) => {
        const systemConfig = snapshot.data();
        console.log(systemConfig);
        setSystemConfig(systemConfig);
      });
    console.log("getSystemConfig");
  }

  return (
    <UserContext.Provider value={userId}>
      <UserUpdateContext.Provider value={getUserId}>
        <ZonesContext.Provider value={zones}>
          <ZonesUpdateContext.Provider value={getZones}>
            <SystemConfigContext.Provider value={systemConfig}>
              <SystemConfigUpdateContext.Provider value={getSystemConfig}>
                {children}
              </SystemConfigUpdateContext.Provider>
            </SystemConfigContext.Provider>
          </ZonesUpdateContext.Provider>
        </ZonesContext.Provider>
      </UserUpdateContext.Provider>
    </UserContext.Provider>
  );
}
