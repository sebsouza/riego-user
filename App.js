import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { UserProvider } from "./context/UserContext";
import PubNub from "pubnub";
import { PubNubProvider } from "pubnub-react";

import Login from "./screens/Login";
import Dashboard from "./screens/Dashboard";
import Zones from "./screens/Zones";
import ZoneDetails from "./screens/ZoneDetails";
import Schedule from "./screens/Schedule";
import ScheduleRepeat from "./screens/ScheduleRepeat";
import Config from "./screens/Config";
import ConfigCalibrate from "./screens/ConfigCalibrate";

const pubnub = new PubNub({
  subscribeKey: "sub-c-61b73fce-569f-11eb-bf6e-f20b4949e6d2",
  publishKey: "pub-c-97e71727-b845-4713-9cd2-44dcfa191348",
});

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#1db954",
    background: "#121212",
    card: "#535353",
    text: "#b3b3b3",
    border: "#212121",
    notification: "#212121",
  },
};

const MainStack = createBottomTabNavigator();
const RootStack = createStackNavigator();
const ZoneStack = createStackNavigator();
const ConfigStack = createStackNavigator();
const ScheduleStack = createStackNavigator();

function ScheduleNav() {
  return (
    <ScheduleStack.Navigator>
      <ScheduleStack.Screen
        name="Schedule"
        component={Schedule}
        options={{ title: "Agenda", headerShown: false }}
      />
      <ScheduleStack.Screen
        name="ScheduleRepeat"
        component={ScheduleRepeat}
        options={{ title: "Repetir" }}
      />
    </ScheduleStack.Navigator>
  );
}

function ConfigNav() {
  return (
    <ConfigStack.Navigator>
      <ConfigStack.Screen
        name="Config"
        component={Config}
        options={{ title: "Ajustes", headerShown: false }}
      />
      <ConfigStack.Screen
        name="ConfigCalibrate"
        component={ConfigCalibrate}
        options={{ title: "Calibración" }}
      />
    </ConfigStack.Navigator>
  );
}

function ZoneNav() {
  return (
    <ZoneStack.Navigator>
      <ZoneStack.Screen
        name="Zones"
        component={Zones}
        options={{ title: "Zonas", headerShown: false }}
      />
      <ZoneStack.Screen
        name="ZoneDetails"
        component={ZoneDetails}
        options={{ title: "Configuración" }}
      />
    </ZoneStack.Navigator>
  );
}

function Main() {
  return (
    <MainStack.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Dashboard") {
            iconName = focused ? "ios-stats-chart" : "ios-stats-chart-outline";
          } else if (route.name === "ConfigNav") {
            iconName = focused ? "ios-settings" : "ios-settings-outline";
          } else if (route.name === "ZoneNav") {
            iconName = focused ? "ios-water" : "ios-water-outline";
          } else if (route.name === "ScheduleNav") {
            iconName = focused ? "ios-calendar" : "ios-calendar-outline";
          }
          // You can return any component that you like here!
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
      tabBarOptions={{
        activeBackgroundColor: "#1db954",
        inactiveBackgroundColor: "#535353",
        activeTintColor: "white",
        inactiveTintColor: "#212121",
        showLabel: false,
      }}
    >
      <MainStack.Screen
        name="Dashboard"
        component={Dashboard}
        options={{ title: "Estado" }}
      />
      <MainStack.Screen
        name="ZoneNav"
        component={ZoneNav}
        options={{ title: "Zonas" }}
      />
      <MainStack.Screen
        name="ScheduleNav"
        component={ScheduleNav}
        options={{ title: "Agenda" }}
      />
      <MainStack.Screen
        name="ConfigNav"
        component={ConfigNav}
        options={{ title: "Ajustes" }}
      />
    </MainStack.Navigator>
  );
}

export default function App() {
  return (
    <UserProvider>
      <NavigationContainer theme={MyTheme}>
        <PubNubProvider client={pubnub}>
          <RootStack.Navigator mode="modal" headerMode="none">
            <RootStack.Screen name="Login" component={Login} />
            <RootStack.Screen name="Main" component={Main} />
          </RootStack.Navigator>
        </PubNubProvider>
      </NavigationContainer>
    </UserProvider>
  );
}
