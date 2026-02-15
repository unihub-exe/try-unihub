# Vercel Environment Variables Setup

## The Problem

Your upload is failing with:
```
POST https://api.cloudinary.com/v1_1/undefined/image/upload 401 (Unauthorized)
```

This means `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is **undefined** in Vercel.

---

## Solution: Add Environment Variables to Vercel

### Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Click on your project (`try-unihub`)
3. Click **Settings** tab
4. Click **Environment Variables** in the left sidebar

### Step 2: Add These Variables

Add each of these one by one:

#### Variable 1:
- **Key:** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- **Value:** `df3zptxqc`
- **Environment:** Check all (Production, Preview, Development)
- Click **Save**

#### Variable 2:
- **Key:** `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- **Value:** `unihub_preset`
- **Environment:** Check all (Production, Preview, Development)
- Click **Save**

#### Variable 3 (if not already there):
- **Key:** `NEXT_PUBLIC_API_URL`
- **Value:** `https://try-unihub.onrender.com`
- **Environment:** Check all (Production, Preview, Development)
- Click **Save**

### Step 3: Redeploy

After adding the variables:
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

---

## Verify It Works

After redeployment:

1. Go to your live site
2. Try creating an event
3. Upload an image
4. Check browser console - should NOT see "undefined" in the URL
5. Should see: `https://api.cloudinary.com/v1_1/df3zptxqc/image/upload`

---

## Quick Checklist

- [ ] Added `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` to Vercel
- [ ] Added `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` to Vercel  
- [ ] Added `NEXT_PUBLIC_API_URL` to Vercel
- [ ] Redeployed the app
- [ ] Tested image upload
- [ ] Images appear in Cloudinary Media Library

---

## Important Notes

### Why `NEXT_PUBLIC_` prefix?

Environment variables in Next.js need the `NEXT_PUBLIC_` prefix to be accessible in the browser. Without it, they're only available on the server side.

### Why it works locally but not on Vercel?

Your local `.env` file has these variables, but Vercel doesn't automatically read your `.env` file. You must manually add them in the Vercel dashboard.

### Do I need to commit .env?

**NO!** Never commit `.env` files to Git. They contain secrets. Vercel reads environment variables from its dashboard, not from your repository.

---

## Screenshot Guide

### Where to find Environment Variables in Vercel:

```
Vercel Dashboard
  └─ Your Project (try-unihub)
      └─ Settings
          └─ Environment Variables  <-- Click here
              └─ Add New Variable
```

### What it should look like:

```
Key: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
Value: df3zptxqc
Environments: ✓ Production ✓ Preview ✓ Development
```

---

## Troubleshooting

### Still seeing "undefined"?
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check Vercel deployment logs for errors
- Verify variables are saved in Vercel dashboard

### Upload still failing?
- Check if upload preset exists in Cloudinary
- Verify preset is set to "Unsigned"
- Check browser console for exact error message

### Variables not showing up?
- Make sure you clicked "Save" after adding each variable
- Redeploy after adding variables
- Check you're looking at the right project in Vercel

---

## Need Help?

If you're still stuck:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify Cloudinary upload preset exists
4. Make sure preset is "Unsigned"

