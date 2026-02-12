# Cloudinary Webhook Implementation Checklist

Use this checklist to track your implementation progress.

## 📋 Pre-Implementation

- [x] JSX syntax errors fixed
- [x] Webhook handler created
- [x] Upload component created
- [x] Documentation written
- [ ] Dependencies installed
- [ ] Environment variables verified

## 🔧 Setup Phase

### 1. Dependencies
- [ ] Run `npm install cloudinary`
- [ ] Verify installation: `npm list cloudinary`

### 2. Environment Variables
- [ ] Verify `.env` has all required variables:
  - [ ] `CLOUDINARY_CLOUD_NAME`
  - [ ] `CLOUDINARY_API_SECRET`
  - [ ] `CLOUDINARY_API_KEY`
  - [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

### 3. Cloudinary Dashboard Configuration
- [ ] Log in to Cloudinary Console
- [ ] Navigate to Settings → Upload
- [ ] Create new upload preset:
  - [ ] Name: `profile_images`
  - [ ] Signing mode: Unsigned
  - [ ] Folder: `user_avatars`
  - [ ] Format: WebP
  - [ ] Quality: Auto
  - [ ] **Async upload: ✅ ENABLED** (Critical!)
  - [ ] Notification URL: `https://yourdomain.com/api/webhooks/cloudinary`
- [ ] Save preset
- [ ] Copy preset name for use in code

### 4. Database Integration
- [ ] Open `pages/api/webhooks/cloudinary.js`
- [ ] Locate `updateDatabase()` function (line 82)
- [ ] Replace placeholder with actual database code:
  ```javascript
  async function updateDatabase(userId, imageUrl) {
      const User = require("@/server/models/user");
      await User.findByIdAndUpdate(userId, { 
          avatar: imageUrl,
          avatarPublicId: extractPublicId(imageUrl),
          updatedAt: new Date()
      });
      return { success: true, userId, imageUrl };
  }
  ```
- [ ] Test database connection
- [ ] Verify User model has `avatar` and `avatarPublicId` fields

## 🧪 Testing Phase

### Local Testing

- [ ] Start development server: `npm run dev`
- [ ] Run webhook test: `npm run test:webhook`
- [ ] Verify test results:
  - [ ] Valid signature test passes
  - [ ] Invalid signature test fails (correctly)
  - [ ] Webhook logs show activity

### ngrok Testing (Recommended)

- [ ] Install ngrok: `npm install -g ngrok` or `npx ngrok`
- [ ] Start dev server: `npm run dev`
- [ ] In new terminal: `npx ngrok http 3000`
- [ ] Copy ngrok URL (e.g., `https://abc123.ngrok.io`)
- [ ] Update Cloudinary webhook URL to: `https://abc123.ngrok.io/api/webhooks/cloudinary`
- [ ] Test real upload:
  - [ ] Navigate to profile page
  - [ ] Upload an image
  - [ ] Check ngrok terminal for webhook request
  - [ ] Verify database was updated
  - [ ] Confirm old image was deleted (if applicable)
- [ ] Check webhook logs: `http://localhost:3000/api/webhooks/cloudinary-logs`

### Component Integration Testing

- [ ] Add component to a test page
- [ ] Test file validation:
  - [ ] Try uploading non-image file (should fail)
  - [ ] Try uploading file > 10MB (should fail)
  - [ ] Upload valid image (should succeed)
- [ ] Verify UI feedback:
  - [ ] Loading state shows during upload
  - [ ] Success message appears
  - [ ] Error messages display correctly
- [ ] Test navigation:
  - [ ] Upload image
  - [ ] Navigate away immediately
  - [ ] Return later to verify image updated

## 🚀 Deployment Phase

### Pre-Deployment

- [ ] Review all code changes
- [ ] Ensure no console.logs with sensitive data
- [ ] Verify error handling is comprehensive
- [ ] Check that API secret is not exposed to frontend

### Deployment

- [ ] Deploy to production (Vercel/Render/etc.)
- [ ] Verify deployment successful
- [ ] Note production URL: `https://_______________`

### Post-Deployment Configuration

- [ ] Update Cloudinary webhook URL to production:
  - [ ] Go to Cloudinary Console → Settings → Upload
  - [ ] Edit `profile_images` preset
  - [ ] Update Notification URL to: `https://yourdomain.com/api/webhooks/cloudinary`
  - [ ] Save changes
- [ ] Verify webhook URL is accessible:
  - [ ] Try accessing: `https://yourdomain.com/api/webhooks/cloudinary`
  - [ ] Should return 405 Method Not Allowed (correct for GET request)

### Production Testing

- [ ] Upload test image in production
- [ ] Monitor webhook activity:
  - [ ] Check Cloudinary webhook logs in dashboard
  - [ ] Check your application logs
  - [ ] Verify database updated
  - [ ] Confirm old image deleted
- [ ] Test from different devices:
  - [ ] Desktop browser
  - [ ] Mobile browser
  - [ ] Different networks

## 📊 Monitoring Setup

- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Configure webhook logging
- [ ] Set up alerts for failed webhooks
- [ ] Create dashboard for upload metrics
- [ ] Document monitoring procedures

## 🔒 Security Review

- [ ] Verify signature verification is working
- [ ] Confirm API secret is server-side only
- [ ] Check HTTPS is enforced in production
- [ ] Review error messages don't expose sensitive data
- [ ] Verify rate limiting (if implemented)
- [ ] Test with invalid signatures (should reject)
- [ ] Test with old timestamps (should reject if > 5 min)

## 📝 Documentation

- [ ] Update team documentation
- [ ] Document upload preset configuration
- [ ] Document database schema changes
- [ ] Create runbook for common issues
- [ ] Document monitoring procedures
- [ ] Share with team members

## 🎯 Integration Points

### Profile Page
- [ ] Add upload component to profile settings
- [ ] Test profile image upload
- [ ] Verify image displays correctly
- [ ] Test image replacement

### Event Creation
- [ ] Add upload component for event covers (if needed)
- [ ] Test event cover upload
- [ ] Verify cover displays correctly

### Community Settings
- [ ] Add upload component for community banners (if needed)
- [ ] Test banner upload
- [ ] Verify banner displays correctly

## ✅ Final Verification

- [ ] All tests passing
- [ ] Production deployment successful
- [ ] Webhook receiving requests
- [ ] Database updating correctly
- [ ] Old images being deleted
- [ ] Error handling working
- [ ] Monitoring in place
- [ ] Documentation complete
- [ ] Team trained
- [ ] Backup plan documented

## 🐛 Known Issues

Document any issues encountered:

1. Issue: _______________
   - Status: [ ] Open / [ ] Resolved
   - Solution: _______________

2. Issue: _______________
   - Status: [ ] Open / [ ] Resolved
   - Solution: _______________

## 📞 Support Contacts

- Cloudinary Support: https://support.cloudinary.com
- Team Lead: _______________
- DevOps: _______________

## 📅 Timeline

- [ ] Setup completed: ___/___/___
- [ ] Testing completed: ___/___/___
- [ ] Deployed to production: ___/___/___
- [ ] Monitoring configured: ___/___/___
- [ ] Documentation complete: ___/___/___
- [ ] Team training complete: ___/___/___

## 🎉 Success Criteria

- [ ] Users can upload images successfully
- [ ] Images convert to WebP automatically
- [ ] Database updates within 30 seconds
- [ ] Old images deleted automatically
- [ ] No security vulnerabilities
- [ ] Error rate < 1%
- [ ] User feedback is positive
- [ ] Team is trained and confident

---

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Overall Progress**: ____%

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________
