const publicVapidKey = "BCCTxEUCaWi_PE9dw_gsv2F4unSsBZcFFtpWmOe1KTP4r7_LNtCbxplADTMAsZNa53eCHvThvQlcP0f2R_I_1fU";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUser() {
  if ("serviceWorker" in navigator) {
    try {
      const register = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      return subscription;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      throw error;
    }
  } else {
    throw new Error("Service workers are not supported in this browser");
  }
}
