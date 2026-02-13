export const API_URL = (() => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const port = window.location.port;
    if (host === "localhost") {
      // Prefer local backend during development
      return "http://localhost:5001";
    }
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "https://try-unihub.onrender.com";
})();
