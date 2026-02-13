import Cookies from "universal-cookie";

const cookies = new Cookies();

export const setUserToken = (user_id) => {
    console.log("user id state value ", user_id);
    
    // Validate the token before setting
    if (!user_id || user_id === "undefined" || user_id === "null") {
        console.error("Invalid user token:", user_id);
        return;
    }
    
    // Set cookie with 30 days expiration and proper options
    cookies.set("user_token", user_id, {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        path: "/",
        sameSite: "lax",
        secure: typeof window !== "undefined" && window.location.protocol === "https:",
    });
    
    console.log("Token set successfully:", user_id);
};
