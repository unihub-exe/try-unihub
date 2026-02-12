import React, { useState, useEffect, useRef } from "react";
import { FiMapPin } from "react-icons/fi";

const LocationAutocomplete = ({ value, onChange, placeholder = "Enter location" }) => {
  const [query, setQuery] = useState(value || "");
  const [predictions, setPredictions] = useState([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const autoCompleteRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    // Check if Google Maps script is loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setScriptLoaded(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      console.warn("Google Maps API Key not found. Autocomplete disabled.");
      return;
    }

    if (!document.querySelector("#google-maps-script")) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    } else {
        // If script exists but not loaded yet, wait? 
        // Usually onload handles it. If it's already there, we might need to check window.google
    }
  }, []);

  useEffect(() => {
    if (scriptLoaded && inputRef.current) {
      autoCompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["(cities)"],
      });
      autoCompleteRef.current.addListener("place_changed", handlePlaceSelect);
    }
  }, [scriptLoaded]);

  const handlePlaceSelect = () => {
    const place = autoCompleteRef.current.getPlace();
    if (place && place.formatted_address) {
      setQuery(place.formatted_address);
      onChange({ target: { value: place.formatted_address } });
    }
  };

  const handleInput = (e) => {
    setQuery(e.target.value);
    onChange(e);
  };

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY && !scriptLoaded) {
      // Fallback to normal input
      return (
         <div className="relative">
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-[color:var(--primary-color)] focus:ring-2 focus:ring-[color:var(--primary-color)]/10 outline-none transition-all text-sm text-gray-800"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <FiMapPin />
            </div>
         </div>
      );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInput}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-[color:var(--primary-color)] focus:ring-2 focus:ring-[color:var(--primary-color)]/10 outline-none transition-all text-sm text-gray-800"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
        <FiMapPin />
      </div>
    </div>
  );
};

export default LocationAutocomplete;
