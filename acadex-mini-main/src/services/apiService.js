// apiService.js

import axios from "axios";

// const apiUrl = 'http://localhost:8000/api'; // Replace with your actual API URL
const host = window.location.hostname;
const siteUrl =
  host === "localhost"
    ? import.meta.env.VITE_API_URL
    : import.meta.env.VITE_API_URL_PROD;
const apiUrl = siteUrl + "/api";
const analysisApiUrl = import.meta.env.VITE_ANALYSIS_API_URL;

export const tAndCPdfUrl =
  host === "localhost"
    ? "http://localhost:5173/woof-tech-term-of-use.pdf"
    : `https://${host}/woof-tech-term-of-use.pdf`;

// Function to handle GET request
export const fetchTodos = async () => {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

// Function to handle POST request
export const createTodo = async (todo) => {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(todo),
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating todo:", error);
    throw error;
  }
};

// Function to handle POST request
export const loginPost = async (postData) => {
  try {
    const response = await fetch(`${apiUrl}/login-mini`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    // console.log(response);
    // if (!response.ok) {
    //     console.log(response);
    //     throw new Error('Network response was not ok');
    // }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating todo:", error);
    throw error;
  }
};

// Function to handle POST request
export const registerPost = async (postData) => {
  try {
    const response = await fetch(`${apiUrl}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    // console.log(response);
    // if (!response.ok) {
    //     console.log(response);
    //     throw new Error('Network response was not ok');
    // }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating todo:", error);
    throw error;
  }
};

// Function to handle POST request
export const requestWithoutToken = async (postData, url_segment) => {
  try {
    const response = await fetch(`${apiUrl}/${url_segment}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    // console.log(response);
    // if (!response.ok) {
    //     console.log(response);
    //     throw new Error('Network response was not ok');
    // }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating todo:", error);
    throw error;
  }
};

// Function to handle POST request
export const postReuest = async (postData = {}, url_segment, token) => {
  try {
    const response = await fetch(`${apiUrl}/${url_segment}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
    });
    // console.log(response);
    // if (!response.ok) {
    //     console.log(response);
    //     throw new Error('Network response was not ok');
    // }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in post request:", error);
    throw error;
  }
};

// Function to handle GET request
export const getReuest = async (url_segment, token) => {
  try {
    const response = await fetch(`${apiUrl}/${url_segment}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response);
    if (!response.ok) {
      console.log(response);
      throw new Error('Network response was not ok');
    }
    console.log(
      response,
      response.url.slice(response.url.length - 6),
      response.redirected
    );
    // if (
    //   response.redirected &&
    //   response.url.slice(response.url.length - 6) == "/login"
    // ) {
    //   console.log("LOG OUT");
    //   window.location.assign("/logout");
    //   return false;
    // }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in get request:", error);
    throw error;
  }
};

// Function to handle GET request
export const fetchStripePricePlansReuest = async (token) => {
  try {
    const response = await fetch(`${apiUrl}/fetch-stripe-price-plans`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log(response);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in get request:", error);
    throw error;
  }
};

// Function to handle GET request
export const fetchDocxFile = async (token, file_path) => {
  try {
    return axios.post(
      `${apiUrl}/docx/fetch`,
      { file_path },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      }
    );
  } catch (error) {
    console.error("Error in fetch docx request:", error);
    throw error;
  }
};

export const packages = [
  {
    title: "Demo",
    price: 0,
    currency: "usd",
    summary:
      "Ideal for individual users or small teams with basic grading needs.",
    features: ["Up to 20 files per month", "Up to 40 evaluations per month"],
    upload_limit: 20,
    evaluation_limit: 40,
  },
  {
    title: "Bronze",
    price: 10,
    currency: "usd",
    summary:
      "Ideal for individual users or small teams with basic grading needs.",
    features: [
      "Up to 100 files per month",
      "Up to 250 evaluations per month",
      "Personalized feedback",
      "Standard grading model",
      "Automated feedback reports",
      "Email support",
    ],
    upload_limit: 100,
    evaluation_limit: 250,
  },
  {
    title: "Silver",
    price: 15,
    currency: "usd",
    summary:
      "Suitable for small businesses and teams with moderate grading needs.",
    features: [
      "Unlimited files per month",
      "Unlimited evaluations per month",
      "Personalized feedback",
      "Standard and custom grading models",
      "Email support",
    ],
    upload_limit: 250,
    evaluation_limit: 500,
  },
  {
    title: "Gold",
    price: 20,
    currency: "usd",
    summary:
      "Perfect for enterprises and large teams with complex grading requirements.",
    features: [
      "Unlimited files per month",
      "Unlimited evaluations per month",
      "Custom grading models with advanced algorithms",
      "24 hours Customer support Phone & Email",
      "Access to Sydney+",
      "Choose between Sydney and Sydney+",
    ],
    upload_limit: 1000000000,
    evaluation_limit: 1000000000,
  },
];

// Create Ollama - handle POST request
export const postOllamaRequest = async (postData = {}, url_segment) => {
  try {
    const response = await fetch(`${analysisApiUrl}/${url_segment}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
    });
    // console.log(response);
    // if (!response.ok) {
    //     console.log(response);
    //     throw new Error('Network response was not ok');
    // }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in post request:", error);
    throw error;
  }
};
