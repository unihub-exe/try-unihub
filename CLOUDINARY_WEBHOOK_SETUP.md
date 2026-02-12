# Cloudinary Webhook Background Image Processing

This implementation provides a complete background image processing system using Cloudinary webhooks with signature verification.

## Features

- ✅ Async image uploads with background processing
- ✅ Automatic WebP conversion
- ✅ Webhook signature verification for security
- ✅ Old image cleanup
- ✅ Database updates via webhook
- ✅ User-friendly React component
- ✅ Progress feedback and error handling

## Architecture

```
User Upload → Cloudinary → Background Processing → Webhook → Database Update
                                                           → Old Image Deletion
```

## Setup Instructions

### 1. Cloudinary Configuration

#### Create Upload Preset
1. Go to Cloudinary Dashboard → Settings → Upload
2. Click "Add upload preset"
3. Configure:
   - **Preset name**: `profile_images` (or your choice)
   - **Signing mode**: Unsigned
   - **Folder**: `user_avatars` (optional)
   - **Format**: WebP
   - **Async upload**: ✅ Enabled
   - **Notification URL**: `https://yourdomain.com/api/webhooks/cloudinary`

#### Enable Webhooks
1. Go to Settings → Webhooks
2. Add notification URL: `https://yourdomain.com/api/webhooks/cloudinary`
3. Select events: `upload`, `success`

### 2. Environment Variables

Add to your `.env` file:

```env
# Cloudinary (Server-side)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Cloudinary (Client-side)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### 3. Install Dependencies

```bash
npm install cloudinary
```

### 4. Database Integration

Update the `updateDatabase` function in `pages/api/webhooks/cloudinary.js`:

```javascript
async function updateDatabase(userId, imageUrl) {
    // Example with MongoDB/Mongoose
    const User = require("@/models/User");
    await User.findByIdAndUpdate(userId, { 
        avatar: imageUrl,
        avatarPublicId: publicId // Store for future deletion
    });
    
    return { success: true, userId, imageUrl };
}
```

## Usage

### Basic Implementation

```jsx
import CloudinaryImageUpload from "@/components/CloudinaryImageUpload";
import { getUserToken } from "@/utils/getUserToken";

function ProfilePage({ userData }) {
    const userId = getUserToken();
    
    return (
        <CloudinaryImageUpload
            userId={userId}
            uploadPreset="profile_images"
            currentImagePublicId={userData?.avatarPublicId}
            onUploadStart={(data) => {
                console.log("Upload started:", data);
                // Show temporary preview or loading state
            }}
            onUploadComplete={(data) => {
                console.log("Upload complete:", data);
                // Refresh user data or show success message
            }}
        />
    );
}
```

### Advanced Integration

See `src/components/ProfileImageUploadExample.jsx` for a complete example with:
- Image preview
- Loading states
- Error handling
- User feedback

## Security

### Signature Verification

The webhook handler verifies that requests actually come from Cloudinary using:

```javascript
SHA256(body + timestamp + api_secret)
```

This prevents:
- Unauthorized webhook calls
- Replay attacks (via timestamp)
- Data tampering

### Best Practices

1. **Never expose API secret**: Keep `CLOUDINARY_API_SECRET` server-side only
2. **Use HTTPS**: Always use HTTPS for webhook URLs in production
3. **Validate payload**: Check notification_type and required fields
4. **Rate limiting**: Consider adding rate limiting to webhook endpoint
5. **Logging**: Log all webhook events for debugging and monitoring

## Webhook Payload Structure

### Success Notification

```json
{
    "notification_type": "upload",
    "timestamp": "2024-01-15T10:30:00Z",
    "public_id": "user_avatars/abc123",
    "secure_url": "https://res.cloudinary.com/.../image.webp",
    "format": "webp",
    "resource_type": "image",
    "context": {
        "custom": {
            "userId": "user123",
            "oldPublicId": "user_avatars/old456"
        }
    }
}
```

### Headers

```
X-Cld-Timestamp: 1705315800
X-Cld-Signature: abc123def456...
Content-Type: application/json
```

## Testing

### Local Testing with ngrok

1. Install ngrok: `npm install -g ngrok`
2. Start your dev server: `npm run dev`
3. Expose localhost: `ngrok http 3000`
4. Update Cloudinary webhook URL to ngrok URL
5. Upload an image and check logs

### Manual Testing

```bash
# Test webhook endpoint (will fail signature check)
curl -X POST http://localhost:3000/api/webhooks/cloudinary \
  -H "Content-Type: application/json" \
  -H "X-Cld-Timestamp: $(date +%s)" \
  -H "X-Cld-Signature: test" \
  -d '{"notification_type":"upload","public_id":"test"}'
```

## Troubleshooting

### Webhook not receiving requests
- Check Cloudinary webhook configuration
- Verify notification URL is publicly accessible
- Check firewall/security group settings
- Review Cloudinary webhook logs in dashboard

### Signature verification failing
- Ensure `CLOUDINARY_API_SECRET` matches dashboard
- Check timestamp is recent (within 5 minutes)
- Verify raw body is used (not parsed JSON)

### Images not updating
- Check database connection
- Verify `updateDatabase` function is implemented
- Check userId is passed correctly in context
- Review server logs for errors

### Old images not deleting
- Verify `oldPublicId` is passed in context
- Check Cloudinary API credentials
- Ensure public_id format is correct
- Review deletion logs

## API Reference

### Webhook Endpoint

**URL**: `/api/webhooks/cloudinary`  
**Method**: `POST`  
**Auth**: Signature verification

**Headers**:
- `X-Cld-Timestamp`: Unix timestamp
- `X-Cld-Signature`: SHA256 signature
- `Content-Type`: application/json

**Response**:
```json
{
    "message": "Webhook processed successfully",
    "public_id": "user_avatars/abc123",
    "secure_url": "https://..."
}
```

### CloudinaryImageUpload Component

**Props**:
- `userId` (string, required): User ID for database update
- `uploadPreset` (string, required): Cloudinary upload preset name
- `currentImagePublicId` (string, optional): Current image public_id for deletion
- `onUploadStart` (function, optional): Callback when upload starts
- `onUploadComplete` (function, optional): Callback when upload completes

## Performance Considerations

- **Async processing**: Images process in background, no blocking
- **WebP format**: Smaller file sizes (25-35% reduction)
- **CDN delivery**: Cloudinary serves via global CDN
- **Automatic cleanup**: Old images deleted to save storage

## Cost Optimization

- Use unsigned upload presets (no server-side signing needed)
- Enable auto-format and auto-quality
- Set reasonable file size limits
- Implement upload quotas per user
- Monitor Cloudinary usage dashboard

## Production Checklist

- [ ] Configure upload preset with WebP conversion
- [ ] Set up webhook notification URL
- [ ] Implement database update function
- [ ] Add error monitoring (Sentry, etc.)
- [ ] Set up logging for webhook events
- [ ] Test signature verification
- [ ] Configure rate limiting
- [ ] Set up backup/rollback strategy
- [ ] Document for team
- [ ] Monitor Cloudinary usage

## Support

For issues or questions:
- Cloudinary Docs: https://cloudinary.com/documentation
- Webhook Guide: https://cloudinary.com/documentation/notifications
- Support: https://support.cloudinary.com
