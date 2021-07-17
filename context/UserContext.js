import React, { useContext, useState } from "react";
import firebase from "../database/Firebase";

const UserContext = React.createContext();
const UserUpdateContext = React.createContext();

export function useUserId() {
  return useContext(UserContext);
}

export function useUserIdUpdate() {
  return useContext(UserUpdateContext);
}

export function UserProvider({ children }) {
  const [userId, setUserId] = useState("");

  function getUserId() {
    const _userId = firebase.auth.currentUser.uid;
    setUserId(_userId);
    console.log("getUserId");
  }

  return (
    <UserContext.Provider value={userId}>
      <UserUpdateContext.Provider value={getUserId}>
        {children}
      </UserUpdateContext.Provider>
    </UserContext.Provider>
  );
}
