import "@/styles/globals.css";
import "@/styles/Home.css";
import Head from "next/head";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <meta name="theme-color" content="#5F57F7" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <link rel="icon" type="image/png" sizes="any" href="/img/only_logo.png" />
                <link rel="apple-touch-icon" href="/img/only_logo.png" />
                <link rel="shortcut icon" href="/img/only_logo.png" />
                <link rel="manifest" href="/favicon_io/site.webmanifest" />
                <title>UniHub</title>
            </Head>
            <ServiceWorkerRegister />
            <Component {...pageProps} />
        </>
    );
}

function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(() => {});
        }
    }, []);
    return null;
}
