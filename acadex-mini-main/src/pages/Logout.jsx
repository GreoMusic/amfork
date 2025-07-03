import { useNavigate } from "react-router-dom";
import { useAuth, removeUser } from "../provider/authProvider";
import { postReuest } from "../services/apiService";
import { useEffect } from "react";
import axios from 'axios';
import LoadingOverlay from "../layout/LoadingOverlay";
import LoadingComponent from "../layout/LoadingComponent";

const Logout = () => {
  const { token, setToken } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken();
    removeUser();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    postReuest({}, 'logout').then(res => {
      handleLogout();
    });
    // if (token.length)
    //   axios.post("http://localhost:8000/api/logout", {}, {
    //     headers: {
    //       "Authorization": `Bearer ${token}`,
    //       "Content-Type": "multipart/form-data",
    //     }
    //   }).then((res) => {
    //     console.log(res)
    //     alert("Logged out Successfully");
    //   }).catch((error) => {
    //     alert("Error");
    //     console.log(error)
    //   });
  }, [])

  setTimeout(() => {
    handleLogout();
  }, 3 * 1000);

  return <LoadingComponent isLoading={true} title="Logging out..." />
    ;
};

export default Logout;
