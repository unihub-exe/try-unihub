/**
 * Cloudinary Utility Functions
 * Helper functions for Cloudinary operations
 */

/**
 * Get Cloudinary upload URL
 * @param {string} cloudName - Cloudinary cloud name
 * @returns {string} Upload URL
 */
export function getUploadUrl(cloudName) {
    return `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
}

/**
 * Build context string for Cloudinary upload
 * @param {Object} context - Context data
 * @returns {string} Context string
 */
export function buildContext(context) {
    return Object.entries(context)
        .map(([key, value]) => `${key}=${value || ""}`)
        .join("|");
}

/**
 * Extract public_id from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} Public ID
 */
export function extractPublicId(url) {
    if (!url) return null;
    
    try {
        // Match pattern: /upload/v{version}/{public_id}.{format}
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
        return match ? match[1] : null;
    } catch (error) {
        console.error("Failed to extract public_id:", error);
        return null;
    }
}

/**
 * Generate Cloudinary transformation URL
 * @param {string} url - Original Cloudinary URL
 * @param {Object} transformations - Transformation options
 * @returns {string} Transformed URL
 */
export function getTransformedUrl(url, transformations = {}) {
    if (!url) return "";
    
    const {
        width,
        height,
        crop = "fill",
        quality = "auto",
        format = "webp",
        gravity = "auto",
    } = transformations;
    
    // Build transformation string
    const transforms = [];
    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (crop) transforms.push(`c_${crop}`);
    if (quality) transforms.push(`q_${quality}`);
    if (format) transforms.push(`f_${format}`);
    if (gravity) transforms.push(`g_${gravity}`);
    
    const transformString = transforms.join(",");
    
    // Insert transformation into URL
    return url.replace("/upload/", `/upload/${transformString}/`);
}

/**
 * Validate image file
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateImageFile(file, options = {}) {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB default
        allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
    } = options;
    
    // Check if file exists
    if (!file) {
        return { valid: false, error: "No file selected" };
    }
    
    // Check file type
    if (!allowedTypes.includes(file.type)) {
        return { 
            valid: false, 
            error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}` 
        };
    }
    
    // Check file size
    if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        return { 
            valid: false, 
            error: `File too large. Maximum size: ${maxSizeMB}MB` 
        };
    }
    
    return { valid: true };
}

/**
 * Get optimized image URL for different use cases
 * @param {string} url - Original Cloudinary URL
 * @param {string} size - Size preset (thumbnail, small, medium, large, original)
 * @returns {string} Optimized URL
 */
export function getOptimizedImageUrl(url, size = "medium") {
    if (!url) return "";
    
    const presets = {
        thumbnail: { width: 150, height: 150, crop: "thumb" },
        small: { width: 300, height: 300, crop: "fill" },
        medium: { width: 600, height: 600, crop: "fill" },
        large: { width: 1200, height: 1200, crop: "limit" },
        original: {},
    };
    
    const preset = presets[size] || presets.medium;
    return getTransformedUrl(url, preset);
}

/**
 * Create upload widget configuration
 * @param {Object} options - Widget options
 * @returns {Object} Widget configuration
 */
export function createUploadWidgetConfig(options = {}) {
    const {
        cloudName,
        uploadPreset,
        folder = "user_uploads",
        maxFileSize = 10485760, // 10MB
        maxFiles = 1,
        sources = ["local", "camera"],
        context = {},
    } = options;
    
    return {
        cloudName,
        uploadPreset,
        folder,
        maxFileSize,
        maxFiles,
        sources,
        context,
        clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
        cropping: true,
        croppingAspectRatio: 1,
        croppingShowDimensions: true,
        showSkipCropButton: false,
        styles: {
            palette: {
                window: "#FFFFFF",
                windowBorder: "#E5E7EB",
                tabIcon: "#5F57F7",
                menuIcons: "#5F57F7",
                textDark: "#1F2937",
                textLight: "#FFFFFF",
                link: "#5F57F7",
                action: "#5F57F7",
                inactiveTabIcon: "#9CA3AF",
                error: "#EF4444",
                inProgress: "#5F57F7",
                complete: "#10B981",
                sourceBg: "#F9FAFB",
            },
        },
    };
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}
