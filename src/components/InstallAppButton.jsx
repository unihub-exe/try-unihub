import { useEffect, useState } from "react";
import { FiDownload, FiSmartphone, FiX, FiAlertCircle } from "react-icons/fi";

export default function InstallAppButton({ variant = "button" }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [debugInfo, setDebugInfo] = useState("");

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            setIsInstalled(true);
            setDebugInfo("App is already installed");
            return;
        }

        // Debug: Log when component mounts
        console.log("InstallAppButton mounted, waiting for beforeinstallprompt...");
        setDebugInfo("Waiting for install prompt...");

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            console.log("beforeinstallprompt event fired!", e);
            
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
            setIsInstallable(true);
            setDebugInfo("Install prompt ready!");
            
            // Show banner after 3 seconds if user hasn't dismissed it
            const dismissed = localStorage.getItem('pwa_banner_dismissed');
            if (!dismissed && variant === "banner") {
                setTimeout(() => setShowBanner(true), 3000);
            }
        };

        // Listen for successful installation
        const handleAppInstalled = () => {
            console.log("App installed successfully!");
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
            setShowBanner(false);
            setDebugInfo("App installed!");
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Check if service worker is registered
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                    console.log("Service Worker is registered");
                    setDebugInfo("Service Worker active, waiting for prompt...");
                } else {
                    console.log("No Service Worker registered");
                    setDebugInfo("No Service Worker found");
                }
            });
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [variant]);

    const handleInstallClick = async () => {
        console.log("Install button clicked, deferredPrompt:", deferredPrompt);
        
        if (!deferredPrompt) {
            // Show instructions if install prompt not available
            const isAndroid = /android/i.test(navigator.userAgent);
            const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
            
            let instructions = "To install UniHub:\n\n";
            
            if (isAndroid) {
                instructions += "Chrome (Android):\n" +
                    "1. Tap the menu (⋮) in the top right\n" +
                    "2. Select 'Install app' or 'Add to Home screen'\n\n" +
                    "Note: Make sure you're using HTTPS and have visited the site before.";
            } else if (isIOS) {
                instructions += "Safari (iOS):\n" +
                    "1. Tap the Share button\n" +
                    "2. Scroll down and tap 'Add to Home Screen'\n" +
                    "3. Tap 'Add' in the top right";
            } else {
                instructions += "Chrome/Edge (Desktop):\n" +
                    "• Click the install icon in the address bar\n\n" +
                    "Chrome (Android):\n" +
                    "• Tap menu (⋮) → 'Install app'\n\n" +
                    "Safari (iOS):\n" +
                    "• Tap Share → 'Add to Home Screen'\n\n" +
                    "Firefox:\n" +
                    "• Tap menu → 'Install'";
            }
            
            alert(instructions);
            return;
        }

        try {
            // Show the install prompt
            console.log("Showing install prompt...");
            await deferredPrompt.prompt();

            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);

            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
                setDebugInfo("Installation accepted!");
            } else {
                console.log('User dismissed the install prompt');
                setDebugInfo("Installation dismissed");
            }

            // Clear the deferredPrompt
            setDeferredPrompt(null);
            setShowBanner(false);
        } catch (error) {
            console.error("Error during installation:", error);
            setDebugInfo(`Error: ${error.message}`);
        }
    };

    const dismissBanner = () => {
        setShowBanner(false);
        localStorage.setItem('pwa_banner_dismissed', 'true');
    };

    // Show "Already Installed" message if installed
    if (isInstalled && variant === "button") {
        return (
            <div className="w-full flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FiSmartphone className="text-xl text-green-600" />
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-green-900">App Already Installed</div>
                        <div className="text-xs text-green-700">UniHub is installed on your device</div>
                    </div>
                </div>
                <div className="text-2xl">✓</div>
            </div>
        );
    }

    // Don't show banner if not installable or already installed
    if ((!isInstallable || isInstalled) && variant === "banner") {
        return null;
    }

    // Banner variant (for dashboard/home page)
    if (variant === "banner" && showBanner) {
        return (
            <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-50 animate-fade-in-up">
                <div className="bg-gradient-to-r from-[color:var(--secondary-color)] to-blue-600 text-white rounded-2xl shadow-2xl p-4 md:p-5 max-w-md">
                    <button
                        onClick={dismissBanner}
                        className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <FiX className="text-lg" />
                    </button>
                    
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                            <FiSmartphone className="text-2xl" />
                        </div>
                        <div className="flex-1 pr-6">
                            <h3 className="font-bold text-lg mb-1">Install UniHub App</h3>
                            <p className="text-sm text-white/90 mb-3">
                                Get quick access to events, faster performance, and offline support
                            </p>
                            <button
                                onClick={handleInstallClick}
                                className="px-4 py-2 bg-white text-[color:var(--secondary-color)] rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                            >
                                <FiDownload /> Install Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Button variant (for settings/profile page)
    if (variant === "button") {
        // Always show the button, even if not installable yet
        const buttonDisabled = !deferredPrompt && !isInstalled;
        
        return (
            <div className="space-y-2">
                <button
                    onClick={handleInstallClick}
                    disabled={buttonDisabled && false} // Never actually disable, just show state
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${
                        isInstalled 
                            ? 'bg-green-50 border-2 border-green-200' 
                            : deferredPrompt
                            ? 'bg-gradient-to-r from-[color:var(--secondary-color)] to-blue-600 text-white hover:shadow-lg'
                            : 'bg-gray-100 border-2 border-gray-200 hover:bg-gray-200'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isInstalled 
                                ? 'bg-green-100' 
                                : deferredPrompt
                                ? 'bg-white/20'
                                : 'bg-gray-200'
                        }`}>
                            {isInstalled ? (
                                <FiSmartphone className="text-xl text-green-600" />
                            ) : deferredPrompt ? (
                                <FiSmartphone className="text-xl text-white" />
                            ) : (
                                <FiAlertCircle className="text-xl text-gray-500" />
                            )}
                        </div>
                        <div className="text-left">
                            <div className={`font-bold ${
                                isInstalled 
                                    ? 'text-green-900' 
                                    : deferredPrompt
                                    ? 'text-white'
                                    : 'text-gray-700'
                            }`}>
                                {isInstalled 
                                    ? 'App Already Installed' 
                                    : deferredPrompt
                                    ? 'Install UniHub App'
                                    : 'Install UniHub App'}
                            </div>
                            <div className={`text-xs ${
                                isInstalled 
                                    ? 'text-green-700' 
                                    : deferredPrompt
                                    ? 'text-white/80'
                                    : 'text-gray-500'
                            }`}>
                                {isInstalled 
                                    ? 'UniHub is installed on your device' 
                                    : deferredPrompt
                                    ? 'Quick access from your home screen'
                                    : 'Tap for installation instructions'}
                            </div>
                        </div>
                    </div>
                    {isInstalled ? (
                        <div className="text-2xl">✓</div>
                    ) : (
                        <FiDownload className={`text-xl transition-transform ${
                            deferredPrompt ? 'text-white group-hover:translate-y-0.5' : 'text-gray-500'
                        }`} />
                    )}
                </button>
                
                {/* Debug info - remove this in production */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                        Debug: {debugInfo}
                    </div>
                )}
            </div>
        );
    }

    // Compact button variant (for navbar)
    if (variant === "compact") {
        return (
            <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-3 py-2 bg-[color:var(--secondary-color)] text-white rounded-lg font-bold text-sm hover:bg-[color:var(--darker-secondary-color)] transition-colors"
            >
                <FiDownload className="text-base" />
                <span className="hidden sm:inline">Install App</span>
            </button>
        );
    }

    return null;
}
