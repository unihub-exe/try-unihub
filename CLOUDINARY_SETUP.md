# Cloudinary Setup - Fix Image Upload

## The Problem

Your images were being uploaded to the **server's local filesystem** (`/uploads` folder), not Cloudinary. When Render restarts or redeploys, this folder is wiped clean (ephemeral storage), causing all images to disappear.

## The Solution

I've updated the code to upload **directly to Cloudinary** with a 3MB file size limit. Now you just need to create an upload preset.

---

## Step 1: Create Cloudinary Upload Preset

1. Go to https://cloudinary.com/console
2. Log in with your account
3. Click **Settings** (gear icon) → **Upload** tab
4. Scroll down to **Upload presets**
5. Click **Add upload preset**

### Configure the preset:

**Preset name:** `unihub_preset`

**Signing Mode:** `Unsigned` ✅ (IMPORTANT!)

**Folder:** `unihub`

**Use filename:** Yes (optional)

**Unique filename:** Yes (recommended)

**Access mode:** `Public` ✅

**Resource type:** `Image`

**Type:** `Upload`

Leave everything else as default.

6. Click **Save**

---

## Step 2: Update Environment Variables

### Frontend (.env) - Already Updated ✅
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=df3zptxqc
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=unihub_preset
```

### Vercel Environment Variables
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these if not already there:
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = `df3zptxqc`
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` = `unihub_preset`
4. Click **Save**
5. Redeploy your app

---

## Step 3: Test Upload

1. Create a new event
2. Upload an image (max 3MB)
3. Check Cloudinary Media Library:
   - Go to https://cloudinary.com/console/media_library
   - Look for `unihub` folder
   - Your image should be there!
4. Copy the image URL
5. Open it in incognito window - should work
6. Open it on different device - should work
7. Wait 1 hour - should still work

---

## What Changed

### Before (❌ Broken):
```
User uploads image → Server saves to /uploads folder → Returns local URL
Problem: /uploads folder is wiped on restart
```

### After (✅ Fixed):
```
User uploads image → Direct upload to Cloudinary → Returns permanent Cloudinary URL
Benefit: Images persist forever, no server storage needed
```

---

## File Size Limits

- **Maximum:** 3MB per image
- **Recommended:** 1-2MB for best performance
- **Formats:** JPG, PNG, GIF, WebP

To compress images before upload:
- Use https://tinypng.com
- Or https://squoosh.app

---

## Troubleshooting

### "Upload failed" error
- Check if upload preset name is exactly `unihub_preset`
- Verify preset is set to "Unsigned"
- Check browser console for detailed error

### Images still not showing
- Clear browser cache
- Check Cloudinary Media Library - are images there?
- Verify image URLs start with `https://res.cloudinary.com/df3zptxqc/`

### "Preset not found" error
- Double-check preset name in Cloudinary dashboard
- Make sure it's saved
- Try creating a new preset with a different name

---

## Benefits of This Approach

✅ **Permanent storage** - Images never disappear  
✅ **No server storage** - Saves server resources  
✅ **CDN delivery** - Fast image loading worldwide  
✅ **Automatic optimization** - Cloudinary optimizes images  
✅ **3MB limit** - Prevents huge uploads  
✅ **Simple & reliable** - Direct upload, no middleware  

---

## Next Steps

1. Create the upload preset in Cloudinary (5 minutes)
2. Redeploy on Vercel with new env variables
3. Test by creating an event with images
4. Verify images appear in Cloudinary Media Library
5. Done! 🎉

