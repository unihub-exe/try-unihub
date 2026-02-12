# Quick Integration Guide

## Step-by-Step Integration

### 1. Install Dependencies

```bash
npm install cloudinary
```

### 2. Configure Environment Variables

Already configured in your `.env`:
```env
CLOUDINARY_CLOUD_NAME=df3zptxqc
CLOUDINARY_API_KEY=333561749346641
CLOUDINARY_API_SECRET=uirTywUnt8m1Sq0J1-FswKXzeAo
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=df3zptxqc
```

### 3. Set Up Cloudinary Upload Preset

1. Go to: https://console.cloudinary.com/settings/upload
2. Click "Add upload preset"
3. Configure:
   ```
   Preset name: profile_images
   Signing mode: Unsigned
   Folder: user_avatars
   Format: webp
   Quality: auto
   Async upload: ✅ ENABLED
   Notification URL: https://yourdomain.com/api/webhooks/cloudinary
   ```
4. Save preset

### 4. Update Database Function

Edit `pages/api/webhooks/cloudinary.js` line 82:

```javascript
async function updateDatabase(userId, imageUrl) {
    // Replace this with your actual database code
    const User = require("@/server/models/user"); // Adjust path
    
    await User.findByIdAndUpdate(userId, { 
        avatar: imageUrl,
        updatedAt: new Date()
    });
    
    return { success: true, userId, imageUrl };
}
```

### 5. Add to Your Profile Page

```jsx
// src/pages/users/profile.jsx
import CloudinaryImageUpload from "@/components/CloudinaryImageUpload";
import { getUserToken } from "@/utils/getUserToken";

export default function ProfilePage() {
    const userId = getUserToken();
    const [userData, setUserData] = useState(null);
    
    // ... your existing code ...
    
    return (
        <div>
            {/* Your existing profile UI */}
            
            <div className="mt-6">
                <h3>Update Profile Picture</h3>
                <CloudinaryImageUpload
                    userId={userId}
                    uploadPreset="profile_images"
                    currentImagePublicId={userData?.avatarPublicId}
                    onUploadStart={(data) => {
                        // Optional: Show loading state
                        console.log("Upload started");
                    }}
                />
            </div>
        </div>
    );
}
```

### 6. Test Locally

#### Option A: Using ngrok (Recommended)

```bash
# Terminal 1: Start your dev server
npm run dev

# Terminal 2: Expose with ngrok
npx ngrok http 3000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
# Update Cloudinary webhook URL to: https://abc123.ngrok.io/api/webhooks/cloudinary
```

#### Option B: Using test script

```bash
# Start dev server
npm run dev

# In another terminal
node test-webhook.js
```

### 7. Deploy to Production

1. Deploy your Next.js app
2. Update Cloudinary webhook URL to production URL:
   ```
   https://yourdomain.com/api/webhooks/cloudinary
   ```
3. Test with a real upload

## Common Integration Points

### Profile Settings Page

```jsx
import CloudinaryImageUpload from "@/components/CloudinaryImageUpload";

<CloudinaryImageUpload
    userId={currentUserId}
    uploadPreset="profile_images"
    currentImagePublicId={user.avatarPublicId}
/>
```

### Event Cover Images

```jsx
<CloudinaryImageUpload
    userId={currentUserId}
    uploadPreset="event_covers"
    currentImagePublicId={event.coverPublicId}
    onUploadStart={(data) => {
        setEvent({ ...event, cover: data.secure_url });
    }}
/>
```

### Community Banners

```jsx
<CloudinaryImageUpload
    userId={currentUserId}
    uploadPreset="community_banners"
    currentImagePublicId={community.bannerPublicId}
/>
```

## Verification Checklist

- [ ] Dependencies installed (`cloudinary` package)
- [ ] Environment variables configured
- [ ] Upload preset created in Cloudinary
- [ ] Webhook URL configured in Cloudinary
- [ ] Database update function implemented
- [ ] Component integrated in UI
- [ ] Tested locally with ngrok or test script
- [ ] Deployed to production
- [ ] Production webhook URL updated
- [ ] End-to-end test completed

## Troubleshooting

### Upload works but webhook not called
- Check Cloudinary webhook logs in dashboard
- Verify "Async upload" is enabled in preset
- Ensure notification URL is publicly accessible
- Check webhook URL has no typos

### Signature verification fails
- Verify `CLOUDINARY_API_SECRET` is correct
- Check server time is synchronized
- Ensure raw body is used (not parsed)

### Database not updating
- Check `updateDatabase` function is implemented
- Verify userId is passed correctly
- Check database connection
- Review server logs

### Old images not deleting
- Ensure `currentImagePublicId` prop is passed
- Verify public_id format matches Cloudinary
- Check Cloudinary API credentials

## Next Steps

1. **Add error monitoring**: Integrate Sentry or similar
2. **Add rate limiting**: Prevent abuse
3. **Add image validation**: Check dimensions, file type
4. **Add progress tracking**: Show upload progress
5. **Add retry logic**: Handle failed webhooks
6. **Add analytics**: Track upload success rates

## Support

- Documentation: See `CLOUDINARY_WEBHOOK_SETUP.md`
- Test script: Run `node test-webhook.js`
- Cloudinary docs: https://cloudinary.com/documentation
