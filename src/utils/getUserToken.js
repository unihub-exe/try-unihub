import Cookies from "universal-cookie";

const cookies = new Cookies();

export const getUserToken = () => {
    const token = cookies.get("user_token");
    if (token === "undefined" || token === "null" || token === undefined || token === null) {
        return null;
    }
    return token;
};
