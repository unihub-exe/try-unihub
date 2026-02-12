import React, { useState, useRef } from "react";
import { FiUpload, FiCheck, FiAlertCircle } from "react-icons/fi";

/**
 * CloudinaryImageUpload Component
 * Handles async image uploads to Cloudinary with background processing
 * 
 * @param {Object} props
 * @param {string} props.userId - User ID to associate with the upload
 * @param {string} props.uploadPreset - Cloudinary upload preset name
 * @param {string} props.currentImagePublicId - Current image public_id (for deletion)
 * @param {Function} props.onUploadStart - Callback when upload starts
 * @param {Function} props.onUploadComplete - Callback when upload completes (optional)
 */
export default function CloudinaryImageUpload({
    userId,
    uploadPreset,
    currentImagePublicId = null,
    onUploadStart = () => {},
    onUploadComplete = () => {},
}) {
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [error, setError] = useState(null);
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
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            setError("Image size must be less than 10MB");
            return;
        }

        setUploading(true);
        setError(null);
        setUploadSuccess(false);

        try {
            // Prepare form data
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", uploadPreset);
            
            // Add context data for webhook processing
            const contextData = {
                userId: userId,
            };
            
            // Include old public_id if exists (for deletion)
            if (currentImagePublicId) {
                contextData.oldPublicId = currentImagePublicId;
            }
            
            formData.append("context", `userId=${userId}|oldPublicId=${currentImagePublicId || ""}`);

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

            // Show success message
            setUploadSuccess(true);
            setUploading(false);

            // Notify parent component
            onUploadStart(data);

            // Optional: Call completion callback after a delay
            setTimeout(() => {
                onUploadComplete(data);
            }, 2000);

            // Reset success message after 5 seconds
            setTimeout(() => {
                setUploadSuccess(false);
            }, 5000);

        } catch (err) {
            console.error("Upload error:", err);
            setError(err.message || "Upload failed. Please try again.");
            setUploading(false);
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
                        <span>Upload Image</span>
                    </>
                )}
            </button>

            {/* Success message */}
            {uploadSuccess && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <FiCheck className="text-green-600 text-xl shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-green-900">
                            Success! We are processing your image in the background
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                            Your image is being converted to WebP format. You can navigate away and it will be updated automatically.
                        </p>
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <FiAlertCircle className="text-red-600 text-xl shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-900">Upload Failed</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Info text */}
            <p className="mt-3 text-xs text-gray-500 text-center">
                Supported formats: JPG, PNG, GIF. Max size: 10MB
            </p>
        </div>
    );
}
