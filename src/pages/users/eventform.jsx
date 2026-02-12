import UserNavBar from "@/components/UserNavBar";
import BackButton from "@/components/BackButton";
import CreateEventForm from "@/components/CreateEventForm";
import Head from "next/head";

export default function EventForm() {
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
