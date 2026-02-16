import { useEffect, useState } from "react";
import { FiDownload, FiSmartphone, FiX } from "react-icons/fi";

export default function InstallAppButton({ variant = "button" }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
            setIsInstallable(true);
            
            // Show banner after 3 seconds if user hasn't dismissed it
            const dismissed = localStorage.getItem('pwa_banner_dismissed');
            if (!dismissed && variant === "banner") {
                setTimeout(() => setShowBanner(true), 3000);
            }
        };

        // Listen for successful installation
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
            setShowBanner(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [variant]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            return;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // Clear the deferredPrompt
        setDeferredPrompt(null);
        setShowBanner(false);
    };

    const dismissBanner = () => {
        setShowBanner(false);
        localStorage.setItem('pwa_banner_dismissed', 'true');
    };

    // Don't show anything if not installable or already installed
    if (!isInstallable || isInstalled) {
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
        return (
            <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[color:var(--secondary-color)] to-blue-600 text-white rounded-xl hover:shadow-lg transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <FiSmartphone className="text-xl" />
                    </div>
                    <div className="text-left">
                        <div className="font-bold">Install UniHub App</div>
                        <div className="text-xs text-white/80">Quick access from your home screen</div>
                    </div>
                </div>
                <FiDownload className="text-xl group-hover:translate-y-0.5 transition-transform" />
            </button>
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
