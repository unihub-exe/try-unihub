# Cloudinary Webhook Quick Reference

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install cloudinary

# 2. Configure Cloudinary preset (in dashboard)
# - Name: profile_images
# - Async upload: ✅ Enabled
# - Webhook URL: https://yourdomain.com/api/webhooks/cloudinary

# 3. Update database function
# Edit: pages/api/webhooks/cloudinary.js (line 82)

# 4. Test locally
npm run dev
npm run test:webhook

# 5. Deploy
# Update webhook URL to production
```

## 📝 Component Usage

```jsx
import CloudinaryImageUpload from "@/components/CloudinaryImageUpload";

<CloudinaryImageUpload
    userId={currentUserId}
    uploadPreset="profile_images"
    currentImagePublicId={user?.avatarPublicId}
    onUploadStart={(data) => console.log("Started", data)}
/>
```

## 🔐 Signature Verification

```javascript
// Cloudinary sends:
X-Cld-Timestamp: 1705315800
X-Cld-Signature: abc123...

// We verify:
SHA256(body + timestamp + api_secret) === signature
```

## 📂 Key Files

| File | Purpose |
|------|---------|
| `pages/api/webhooks/cloudinary.js` | Webhook handler |
| `src/components/CloudinaryImageUpload.jsx` | Upload component |
| `src/utils/cloudinary.js` | Utility functions |
| `test-webhook.js` | Test script |

## 🔧 Environment Variables

```env
CLOUDINARY_CLOUD_NAME=df3zptxqc
CLOUDINARY_API_SECRET=uirTywUnt8m1Sq0J1-FswKXzeAo
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=df3zptxqc
```

## 🧪 Testing Commands

```bash
# Test webhook locally
npm run test:webhook

# Test with ngrok
npx ngrok http 3000

# View webhook logs
curl http://localhost:3000/api/webhooks/cloudinary-logs
```

## 📊 Webhook Flow

```
Upload → Cloudinary → WebP Conversion → Webhook → DB Update → Old Image Delete
```

## ⚡ Common Tasks

### Update User Avatar
```javascript
async function updateDatabase(userId, imageUrl) {
    const User = require("@/server/models/user");
    await User.findByIdAndUpdate(userId, { avatar: imageUrl });
}
```

### Get Optimized URL
```javascript
import { getOptimizedImageUrl } from "@/utils/cloudinary";

const thumbnail = getOptimizedImageUrl(url, "thumbnail"); // 150x150
const small = getOptimizedImageUrl(url, "small");         // 300x300
const medium = getOptimizedImageUrl(url, "medium");       // 600x600
```

### Validate File
```javascript
import { validateImageFile } from "@/utils/cloudinary";

const result = validateImageFile(file, {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png"]
});

if (!result.valid) {
    console.error(result.error);
}
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not called | Check Cloudinary logs, verify async upload enabled |
| Signature fails | Verify API secret, check raw body parsing |
| DB not updating | Implement updateDatabase(), check connection |
| Old image not deleted | Pass currentImagePublicId prop |

## 📞 Support Links

- [Setup Guide](./CLOUDINARY_WEBHOOK_SETUP.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Cloudinary Docs](https://cloudinary.com/documentation)

## ✅ Deployment Checklist

- [ ] Dependencies installed
- [ ] Upload preset created
- [ ] Webhook URL configured
- [ ] Database function implemented
- [ ] Tested locally
- [ ] Deployed to production
- [ ] Production webhook URL updated
- [ ] End-to-end test passed

## 🎯 Key Features

- ✅ Signature verification (SHA256)
- ✅ Background processing
- ✅ Automatic WebP conversion
- ✅ Old image cleanup
- ✅ Immediate user feedback
- ✅ Error handling
- ✅ Webhook logging
