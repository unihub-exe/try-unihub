import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getUserToken } from "@/utils/getUserToken";
import { API_URL } from "@/utils/config";

export default function OnboardingGuide({ visible, onDismiss }) {
  const router = useRouter();
  const [open, setOpen] = useState(visible);
  const [avatarUrl, setAvatarUrl] = useState("https://res.cloudinary.com/df3zptxqc/image/upload/v1771219687/assistant-avatar_jrvqkv.jpg");

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const userId = getUserToken();
        if (!userId) return;
        const res = await fetch(`${API_URL}/user/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_token: userId })
        });
        if (!res.ok) return;
        const user = await res.json();
        if (user && user.avatar) setAvatarUrl(user.avatar);
      } catch {}
    };
    loadAvatar();
  }, []);

  const dontShowAgain = () => {
    try { localStorage.setItem("unihub_guide_dismissed", "1"); } catch {}
    setOpen(false);
    if (onDismiss) onDismiss();
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-4 w-[20rem]">
        <div className="flex items-center gap-3">
          <Image src={avatarUrl} alt="Assistant Avatar" width={44} height={44} className="rounded-full border border-gray-200" />
          <div className="font-semibold text-gray-900">Hi! I’m your UniHub assistant</div>
        </div>
        <p className="mt-2 text-sm text-gray-600">Here are key things to try:</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => router.push("/users/dashboard")} className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm">Search Events</button>
          <button onClick={() => router.push("/users/eventform")} className="px-3 py-2 bg-[color:var(--darker-secondary-color)] hover:bg-[color:var(--secondary-color)] text-white rounded text-sm">Create Event</button>
          <button onClick={() => router.push("/users/profile")} className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm">Your Profile</button>
          <button onClick={() => router.push("/")} className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm">Explore Home</button>
        </div>
        <div className="mt-3 flex justify-between">
          <button onClick={() => setOpen(false)} className="text-sm text-gray-600">Later</button>
          <button onClick={dontShowAgain} className="text-sm text-gray-900 font-medium">Don’t show again</button>
        </div>
      </div>
    </div>
  );
}
