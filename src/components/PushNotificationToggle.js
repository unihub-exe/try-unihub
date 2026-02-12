import React, { useState, useEffect } from "react";
import { subscribeUser } from "../utils/pushSubscription";
import { API_URL } from "@/utils/config";

const PushNotificationToggle = ({ userToken }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(userToken);

  useEffect(() => {
    if (userToken) setToken(userToken);
    else if (typeof window !== "undefined") {
      setToken(localStorage.getItem("user_token"));
    }
  }, [userToken]);

  useEffect(() => {
    // Check if user is already subscribed (this is a basic check, ideally we check with server)
    if (
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const subscription = await subscribeUser();

      // Send subscription to server
      if (!token) {
        alert("Please login to subscribe for notifications.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/notifications/subscribe`, {
        method: "POST",
        body: JSON.stringify({ subscription }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsSubscribed(true);
        alert("Successfully subscribed to notifications!");
      } else {
        throw new Error("Failed to save subscription on server");
      }
    } catch (error) {
      console.error("Subscription failed:", error);
      alert("Failed to subscribe to notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await fetch(`${API_URL}/notifications/test`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return null; // Don't show if not supported
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSubscribe}
        disabled={isSubscribed || loading}
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          isSubscribed
            ? "bg-green-100 text-green-800 cursor-default"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {loading
          ? "Subscribing..."
          : isSubscribed
          ? "Notifications Enabled"
          : "Enable Push Notifications"}
      </button>
      {isSubscribed && (
        <button
          onClick={handleTestNotification}
          className="text-xs text-blue-600 underline"
        >
          Send Test Notification
        </button>
      )}
    </div>
  );
};

export default PushNotificationToggle;
