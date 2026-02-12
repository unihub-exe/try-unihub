import { useRouter } from "next/router";
import { FiArrowLeft } from "react-icons/fi";

export default function BackButton({ className = "", onClick, fixed = true }) {
  const router = useRouter();
  return (
    <button
      onClick={onClick || (() => router.back())}
      className={`${fixed ? "fixed top-24 left-4" : ""} z-50 px-4 py-2 bg-white/80 backdrop-blur-md text-black rounded-full text-sm font-bold hover:bg-white shadow-sm border border-gray-200 transition-all flex items-center gap-2 ${className}`}
    >
      <FiArrowLeft /> Back
    </button>
  );
}
