import React from "react";
import Image from "next/image";
import { FiCalendar, FiMapPin, FiUser, FiHeart, FiShare2, FiArrowRight } from "react-icons/fi";
import { useRouter } from "next/router";

const EventCard = ({
  title = "Untitled Event",
  date,
  location = "Location TBA",
  description,
  imageSrc,
  eventId,
  organizer,
  price,
  category,
  time,
  className = "",
  isPremium = false,
  participants = 0,
}) => {
  const router = useRouter();

  const handleCardClick = () => {
    if (eventId) {
      router.push(`/event/${eventId}`);
    }
  };

  const formattedPrice = 
    price === 0 || price === "0" 
      ? "Free" 
      : `₦${parseInt(price).toLocaleString()}`;

  // Helper for capitalization
  const capitalize = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`group relative w-full flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer ${className}`}
    >
      {/* Image Section */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-gray-100">
            <FiCalendar className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
            {isPremium && (
            <span className="px-2 py-1 rounded-full text-[10px] font-black bg-amber-400 text-black shadow-sm uppercase tracking-wider flex items-center gap-1">
                Premium
            </span>
            )}
            {category && (
            <span className="px-2 py-1 rounded-full text-[10px] font-black bg-white/90 backdrop-blur-md text-gray-800 shadow-sm uppercase tracking-wider">
                {category}
            </span>
            )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-3 mb-2">
            <div className="flex-1 min-w-0">
                {/* Date with Year */}
                {date && (
                    <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                            {(() => {
                                try {
                                    const parts = date.split('/');
                                    if (parts.length >= 2 && parts[1]) {
                                        const monthIndex = parseInt(parts[1]) - 1;
                                        const monthName = new Date(2024, monthIndex).toLocaleString('default', { month: 'short' });
                                        return `${monthName} ${parts[0]}`;
                                    }
                                    return date;
                                } catch {
                                    return date;
                                }
                            })()}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400">
                            {new Date().getFullYear()}
                        </span>
                    </div>
                )}
                
                {/* Title */}
                <h3 className="font-black text-gray-900 text-lg leading-tight mb-2 uppercase tracking-tight line-clamp-2" title={title}>
                    {title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-gray-500 mb-3">
                    <FiMapPin className="text-xs shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-wide truncate">
                        {location}
                    </p>
                </div>

                {/* Organizer */}
                <div className="flex items-center gap-1.5 text-gray-400">
                    <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600 border border-gray-200">
                        {organizer ? organizer.charAt(0) : "U"}
                    </div>
                    <span className="text-[10px] font-medium truncate">
                        by {capitalize(organizer) || "Unknown"}
                    </span>
                </div>
            </div>

            {/* Price & Time (Right Side) */}
            <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    <span className="text-sm font-black text-gray-900">
                        {formattedPrice}
                    </span>
                </div>
                {time && (
                    <div className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                        <FiCalendar className="w-3 h-3" />
                        {time}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
