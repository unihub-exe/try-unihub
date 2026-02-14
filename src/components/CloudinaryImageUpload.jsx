import React, { useState, useRef } from "react";
import { FiUpload, FiCheck, FiAlertCircle } from "react-icons/fi";

/**
 * CloudinaryImageUpload Component
 * Handles async image uploads to Cloudinary with immediate preview and background WebP optimization
 * 
 * @param {Object} props
 * @param {string} props.eventId - Event ID to associate with the upload
 * @param {string} props.imageType - Type of image: 'cover' or 'profile'
 * @param {string} props.uploadPreset - Cloudinary upload preset name
 * @param {string} props.currentImageUrl - Current image URL (for preview)
 * @param {Function} props.onUploadComplete - Callback when immediate URL is available
 */
export default function CloudinaryImageUpload({
    eventId,
    imageType, // 'cover' or 'profile'
    uploadPreset,
    currentImageUrl = null,
    onUploadComplete = () => {},
}) {
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
    const fileInputRef = useRef(null);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "df3zptxqc";

    /**
     * Handle file selection and upload
     */
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            setError("Image size must be less than 10MB");
            return;
        }

        setUploading(true);
        setError(null);
        setUploadSuccess(false);

        // Show local preview immediately
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);

        try {
            // Prepare form data
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", uploadPreset);
            
            // Add context for webhook processing
            formData.append("context", `eventId=${eventId}|imageType=${imageType}`);
            
            // Configure eager transformation for WebP conversion
            // This tells Cloudinary to create a WebP version in the background
            formData.append("eager", "f_webp,q_auto:good");
            formData.append("notification_url", "https://try-unihub.vercel.app/api/webhooks/cloudinary");

            // Upload to Cloudinary
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const data = await response.json();

            // Use the immediate secure_url (original format - JPG/PNG)
            const immediateUrl = data.secure_url;
            
            setPreviewUrl(immediateUrl);
            setUploadSuccess(true);
            setUploading(false);

            // Notify parent component with immediate URL
            // User can save the event with this URL
            // WebP version will be swapped in background via webhook
            onUploadComplete({
                url: immediateUrl,
                publicId: data.public_id,
                imageType: imageType,
            });

            // Reset success message after 5 seconds
            setTimeout(() => {
                setUploadSuccess(false);
            }, 5000);

        } catch (err) {
            console.error("Upload error:", err);
            setError(err.message || "Upload failed. Please try again.");
            setUploading(false);
            setPreviewUrl(currentImageUrl); // Revert to original
        }
    };

    /**
     * Trigger file input click
     */
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full">
            {/* Image Preview */}
            {previewUrl && (
                <div className="mb-4 relative rounded-xl overflow-hidden border-2 border-gray-200">
                    <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-48 object-cover"
                    />
                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
                        </div>
                    )}
                </div>
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
            />

            {/* Upload button */}
            <button
                onClick={handleButtonClick}
                disabled={uploading}
                className={`
                    w-full flex items-center justify-center gap-3 px-6 py-3 
                    rounded-xl font-semibold transition-all duration-200
                    ${uploading 
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                        : "bg-[color:var(--secondary-color)] text-white hover:opacity-90 hover:shadow-lg"
                    }
                `}
            >
                {uploading ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        <span>Uploading...</span>
                    </>
                ) : (
                    <>
                        <FiUpload className="text-xl" />
                        <span>{previewUrl ? 'Change Image' : 'Upload Image'}</span>
                    </>
                )}
            </button>

            {/* Success message */}
            {uploadSuccess && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <FiCheck className="text-green-600 text-xl shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-green-900">
                            Image uploaded! You can save now.
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                            We're optimizing your image to WebP format in the background. It will be automatically updated.
                        </p>
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in-from-top-2">
                    <FiAlertCircle className="text-red-600 text-xl shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-900">Upload Failed</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Info text */}
            <p className="mt-3 text-xs text-gray-500 text-center">
                Supported: JPG, PNG, GIF • Max: 10MB • Auto-optimized to WebP
            </p>
        </div>
    );
}
