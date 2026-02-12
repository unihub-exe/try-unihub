import React, { useState } from "react";
import Image from "next/image";
import CloudinaryImageUpload from "./CloudinaryImageUpload";
import { getUserToken } from "@/utils/getUserToken";

/**
 * Example component showing how to use CloudinaryImageUpload
 * This can be integrated into your profile settings page
 */
export default function ProfileImageUploadExample({ userData }) {
    const [currentImage, setCurrentImage] = useState(userData?.avatar || null);
    const [currentPublicId, setCurrentPublicId] = useState(userData?.avatarPublicId || null);
    const userId = getUserToken();

    /**
     * Called when upload starts (before webhook processing)
     */
    const handleUploadStart = (uploadData) => {
        console.log("Upload started:", uploadData);
        
        // Optionally show a temporary preview
        // Note: This is the original image, not the WebP version
        // The WebP version will be updated via webhook
        setCurrentImage(uploadData.secure_url);
        setCurrentPublicId(uploadData.public_id);
    };

    /**
     * Optional: Called after upload completes
     */
    const handleUploadComplete = (uploadData) => {
        console.log("Upload complete:", uploadData);
        
        // You could refresh user data here or show additional UI feedback
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Profile Picture
            </h2>

            {/* Current image preview */}
            <div className="mb-6">
                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200">
                    {currentImage ? (
                        <Image
                            src={currentImage}
                            alt="Profile"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                            {userData?.username?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                    )}
                </div>
            </div>

            {/* Upload component */}
            <CloudinaryImageUpload
                userId={userId}
                uploadPreset="your_upload_preset_name" // Replace with your actual preset
                currentImagePublicId={currentPublicId}
                onUploadStart={handleUploadStart}
                onUploadComplete={handleUploadComplete}
            />

            {/* Additional info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-900">
                    <strong>How it works:</strong>
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                    <li>Upload starts immediately</li>
                    <li>Image is converted to WebP in the background</li>
                    <li>Your profile updates automatically</li>
                    <li>Old image is deleted to save space</li>
                </ul>
            </div>
        </div>
    );
}
