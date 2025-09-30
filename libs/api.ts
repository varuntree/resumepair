import axios from "axios";
import { toast } from "react-hot-toast";
import config from "@/config";

// use this to interact with our own API (/app/api folder) from the front-end side
// See https://resumepair.com/docs/tutorials/api-call
const apiClient = axios.create({
  baseURL: "/api",
});

apiClient.interceptors.response.use(
  function (response) {
    return response.data;
  },
  function (error) {
    let message = "";

    if (error.response?.status === 401) {
      // User not auth, ask to re login
      toast.error("Please login");
      // Sends the user to the login page (client-side)
      if (typeof window !== "undefined") {
        window.location.assign(config.auth.loginUrl);
      }
    } else if (error.response?.status === 403) {
      // User not authorized, must subscribe/purchase/pick a plan
      message = "Pick a plan to use this feature";
    } else {
      // Prefer canonical message then structured error.message
      const data = error?.response?.data;
      const structuredMessage =
        data && typeof data.error === "object" && data.error?.message
          ? data.error.message
          : undefined;
      message = data?.message || structuredMessage || error.message || String(error);
    }

    error.message = message;

    console.error(error.message);

    // Automatically display errors to the user
    toast.error(error.message || "Something went wrong...");
    return Promise.reject(error);
  }
);

export default apiClient;
