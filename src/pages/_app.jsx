import "@/styles/globals.css";
import "@/styles/Home.css";
import Head from "next/head";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="UniHub" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@unihub" />
                <title>UniHub - University Event Platform</title>
            </Head>
            <ServiceWorkerRegister />
            <Component {...pageProps} />
        </>
    );
}

function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js")
                .then(registration => {
                    console.log("Service Worker registered successfully:", registration.scope);
                })
                .catch(error => {
                    console.error("Service Worker registration failed:", error);
                });
        }
    }, []);
    return null;
}
