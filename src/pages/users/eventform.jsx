import UserNavBar from "@/components/UserNavBar";
import BackButton from "@/components/BackButton";
import CreateEventForm from "@/components/CreateEventForm";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getUserToken } from "@/utils/getUserToken";
import { getAdminToken } from "@/utils/getAdminToken";

export default function EventForm() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userToken = getUserToken();
        const adminToken = getAdminToken();
        
        if (!userToken && !adminToken) {
            // Not authenticated, redirect to signin
            router.push("/users/signin");
        } else {
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans">
            <Head>
                <title>Create Event | UniHub</title>
            </Head>
            <UserNavBar />
            <main className="pt-20 pb-12 container mx-auto px-4 max-w-4xl">
                <div className="mb-8">
                    <BackButton />
                </div>
                <CreateEventForm />
            </main>
        </div>
    );
}
