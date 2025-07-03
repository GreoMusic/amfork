import { lazy, useEffect } from 'react';
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuth } from "../provider/authProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import Login from "../pages/Login";
import Logout from "../pages/Logout";
import SignIn from "../pages/Authentication/SignIn";
import Signup from "../pages/Authentication/SignUp";
import FormElement from "../pages/Form/FormElements";
import Dashboard from "../pages/Dashboard/ECommerce";
import FileUploadComponent from "../pages/Form/FileUpload";
import Landing from "../pages/Landing";
import { Toaster } from 'react-hot-toast';
import SentencePages from "../pages/SentencePages";
import Profile from "../pages/Profile";
import Groups from "../pages/Groups";
import FileList from "../pages/FileList";
import Home from "../pages/Home";
import Home2 from "../pages/Home2";
import CheckoutPage from "../pages/CheckoutPage";
import AboutPage from "../pages/AboutPage";
import PricingPage from "../pages/PricingPage";
import ForgotPassword from "../pages/Authentication/ForgotPassword";
import Dashboard2 from "../pages/Dashboard";

const DefaultLayout = lazy(() => import('../layout/DefaultLayout'));
import { createHashRouter } from "react-router-dom";
import LandingV3 from '../pages/v3/landing';

console.log = () => { }

const Routes = () => {


  useEffect(() => {
    if (localStorage.getItem('isDarkMode') === 'true') {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, []);
  const { token } = useAuth();

  // Define public routes accessible to all users
  const routesForPublic = [
    {
      path: "/v2",
      element: <Home />,
    },
    {
      path: "/",
      element: <LandingV3 />,
    },
    {
      path: "/home",
      element: <Home />,
    },
    {
      path: "/home2",
      element: <Home2 />,
    },
    {
      path: "/pricing",
      element: <PricingPage />,
    },
    {
      path: "/about-us",
      element: <AboutPage />,
    },
  ];

  // Define routes accessible only to authenticated users
  const routesForAuthenticatedOnly = [
    {
      path: "/",
      element: <ProtectedRoute element={<DefaultLayout />} />, // Wrap the component in ProtectedRoute
      children: [
        {
          path: "/landing",
          element: <Landing />,
        },
        {
          path: "/sentence",
          element: <SentencePages />,
        },
        {
          path: "/upload",
          element: <FileUploadComponent />,
        },
        {
          path: "/upload/:group_id",
          element: <FileUploadComponent />,
        },
        {
          path: "/dashboard/:group_id/files",
          element: <FileList />,
        },
        {
          path: "/groups",
          element: <Groups />,
        },
        {
          path: "/group/:group_id/files",
          element: <Dashboard2 />,
        },
        {
          path: "/profile",
          element: <Profile />,
        },
        {
          path: "/logout",
          element: <Logout />,
        },
        {
          path: "/checkout/:package_name",
          element: <CheckoutPage />,
        },
      ],
    },
  ];

  // Define routes accessible only to non-authenticated users
  const routesForNotAuthenticatedOnly = [
    {
      path: "/login",
      element: <SignIn />,
    },
    {
      path: "/register",
      element: <Signup />,
    },
    {
      path: "/forgot",
      element: <ForgotPassword />
    }
  ];

  // Combine and conditionally include routes based on authentication status
  const router = createBrowserRouter([
    ...routesForPublic,
    ...(!token ? routesForNotAuthenticatedOnly : []),
    ...routesForAuthenticatedOnly,
  ]);

  // Provide the router configuration using RouterProvider
  return <RouterProvider router={router} />;
};

export default Routes;
