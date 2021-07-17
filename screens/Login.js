import React, { useState, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Button, ScrollView, ActivityIndicator } from "react-native";
import firebase from "../database/Firebase";
import { Input, Text } from "react-native-elements";
import { useUserIdUpdate } from "../context/UserContext";
import { styles } from "../styles";

const Login = (props) => {
  const getUserId = useUserIdUpdate();
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loginUser, setLoginUser] = useState({
    email: "",
    password: "",
  });
  const timer = useRef(null); // we can save timer in useRef and pass it to child

  useEffect(() => {
    const subscriber = firebase.auth.onAuthStateChanged(function (user) {
      if (user) {
        // User is signed in.
        getUserId();
        console.log("User is signed in.");
        // setInitializing(false);

        props.navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      } else {
        // No user is signed in.
        console.log("No user is signed in.");
        setInitializing(false);
      }
    });
    return subscriber; // unsubscribe on unmount
  }, []);

  const handleChangeText = (name, value) => {
    setLoginUser({ ...loginUser, [name]: value });
  };

  const setLogin = async () => {
    if (loginUser.email === null) alert("Email Inválido.");
    else if (loginUser.password === null) alert("Contraseña Inválida.");
    else {
      setSaving(true);
      timer.current = setTimeout(() => {
        console.log(`ALERT! Saving timeout`);
        alert(
          "Sin conexión al servidor. Revise la conexión a internet y vuelva a intentar."
        );
        setSaving(false);
      }, 8000);
      await firebase.auth
        .signInWithEmailAndPassword(loginUser.email, loginUser.password)
        .then(() => {
          setSaving(false);
          clearTimeout(timer.current);
          console.log("User signed in with Email and Password.");
        })
        .catch((error) => {
          //   var errorCode = error.code;
          var errorMessage = error.message;
          alert(errorMessage);
        });
    }
  };

  if (initializing)
    return (
      <View style={styles.containerLoading}>
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
  else {
    return (
      <ScrollView>
        <View style={styles.containerModal}>
          <Text style={styles.textLarge}>Iniciar sesión:</Text>
          <View style={styles.textSmall}>
            <Input
              inputStyle={{ color: "#b3b3b3" }}
              placeholder="Email"
              onChangeText={(value) => handleChangeText("email", value)}
            />
          </View>
          <View style={styles.textSmall}>
            <Input
              inputStyle={{ color: "#b3b3b3" }}
              placeholder="Contraseña"
              secureTextEntry={true}
              onChangeText={(value) => handleChangeText("password", value)}
            />
          </View>
          <View>
            <Button
              title="Conectar"
              color="#8bc34a"
              onPress={() => setLogin()}
            />
          </View>
        </View>
        <StatusBar style="light" />
      </ScrollView>
    );
  }
};
export default Login;
