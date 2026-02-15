import { useState } from "react";
import { FiUpload, FiX, FiImage } from "react-icons/fi";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB in bytes

export default function SimpleImageUpload({ value, onChange, label = "Upload Image" }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError("");

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            setError(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
            return;
        }

        setUploading(true);

        try {
            // Create FormData
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
            formData.append("folder", "unihub");

            // Upload to Cloudinary
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const data = await response.json();
            
            // Return the secure URL
            onChange(data.secure_url);
        } catch (err) {
            console.error("Upload error:", err);
            setError("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        onChange("");
        setError("");
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">{label}</label>
            
            {value ? (
                <div className="relative group">
                    <img
                        src={value}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                        <FiX />
                    </button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[color:var(--secondary-color)] hover:bg-gray-50 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                            <>
                                <div className="w-10 h-10 border-4 border-[color:var(--secondary-color)] border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-sm font-bold text-gray-500">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <FiImage className="w-10 h-10 mb-3 text-gray-400" />
                                <p className="mb-2 text-sm font-bold text-gray-700">
                                    <span className="text-[color:var(--secondary-color)]">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 3MB</p>
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={uploading}
                    />
                </label>
            )}

            {error && (
                <p className="text-sm text-red-600 font-medium">{error}</p>
            )}
        </div>
    );
}
