import axios from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getReuest } from "../services/apiService";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  // State to hold the authentication token
  const [token, setToken_] = useState(localStorage.getItem("token"));

  // Function to set the authentication token
  const setToken = (newToken) => {
    setToken_(newToken);
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = "Bearer " + token;
      localStorage.setItem("token", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  }, [token]);

  // Memoized value of the authentication context
  const contextValue = useMemo(
    () => ({
      token,
      setToken,
    }),
    [token]
  );

  // Provide the authentication context to the children components
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export const setUser = (user, about) => {
  localStorage.setItem('thisUser', JSON.stringify({ user, about }));
};

export const removeUser = () => {
  localStorage.removeItem('thisUser');
};

export const getUser = () => {
  return JSON.parse(localStorage.getItem('thisUser'));
};

export const fetchSubscription = async () => {
  console.log(localStorage.getItem("token"))
  return getReuest(`my-subscription`, localStorage.getItem("token")).then(res => {
    localStorage.setItem("subscription", JSON.stringify(res.subscription));
    console.log('subscription', res);
    // setProfile(res.subscription);
    return res.subscription
  });
};

export const fetchMyUsage = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth()

  getReuest(`my-usage`, localStorage.getItem("token")).then(res => {
    if (res.usages.length && res.usages[0].year == year && res.usages[0].year == month)
      localStorage.setItem("myUsage", res.usages)
    console.log('usage', res);
  });
}

export const getMySubscription = () => {
  const subscriptionData = localStorage.getItem("subscription");
  if (subscriptionData) {
    try {
      return JSON.parse(subscriptionData);
    } catch (error) {
      console.error("Error parsing subscription data:", error);
      return {}; // Return an empty object in case of parsing error
    }
  } else {
    return {}; // Return an empty object if no subscription data found
  }
};

export default AuthProvider;
