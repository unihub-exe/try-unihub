# Testing Open Graph Tags with SSR - Quick Guide

## ✅ Critical Test: View Page Source

This is the MOST IMPORTANT test. If this passes, everything else will work.

### How to Test:

1. **Open event page** in browser
2. **Right-click** anywhere on page
3. **Select "View Page Source"** (NOT "Inspect Element")
4. **Press Ctrl+F** (or Cmd+F on Mac)
5. **Search for** `og:title`

### Expected Result ✅

You should see meta tags in the HTML source:

```html
<meta property="og:title" content="Your Event Name"/>
<meta property="og:description" content="Event description..."/>
<meta property="og:image" content="https://res.cloudinary.com/..."/>
<meta property="og:url" content="https://your-domain.com/event/123"/>
```

### What This Means:

- ✅ **Tags are in HTML** = Server-Side Rendering is working
- ✅ **Social media bots will see them** = Previews will work
- ✅ **SEO is good** = Google will index properly

### If Tags Are NOT in Source ❌

**Problem**: SSR is not working

**Check:**
1. Did you restart the dev server after changes?
2. Is `getServerSideProps` function present in the file?
3. Are there any errors in the server console?
4. Is the API_URL environment variable set?

## 🧪 Additional Tests

### Test 1: Facebook Debugger (2 minutes)

**URL**: https://developers.facebook.com/tools/debug/

**Steps:**
1. Paste your event URL
2. Click "Debug"
3. Check the preview

**Expected:**
- ✅ Event title as heading
- ✅ Event description
- ✅ Event image (large)
- ✅ No errors or warnings

**If Issues:**
- Click "Scrape Again" to refresh cache
- Check image URL is HTTPS
- Verify image is publicly accessible

### Test 2: Twitter Card Validator (1 minute)

**URL**: https://cards-dev.twitter.com/validator

**Steps:**
1. Paste your event URL
2. Click "Preview card"

**Expected:**
- ✅ Large image card
- ✅ Event title
- ✅ Event description
- ✅ "summary_large_image" card type

### Test 3: WhatsApp (30 seconds)

**Steps:**
1. Copy event URL
2. Paste in WhatsApp chat
3. Wait 2-3 seconds

**Expected:**
```
┌─────────────────────┐
│  [Event Image]      │
├─────────────────────┤
│ Event Name          │
│ Event description...│
│ your-domain.com     │
└─────────────────────┘
```

**If No Preview:**
- WhatsApp caches aggressively
- Try adding `?v=2` to URL
- Or wait 24-48 hours

### Test 4: LinkedIn Post Inspector (1 minute)

**URL**: https://www.linkedin.com/post-inspector/

**Steps:**
1. Paste your event URL
2. Click "Inspect"

**Expected:**
- ✅ Professional preview
- ✅ Event image
- ✅ Event title and description

## 🔍 Debugging

### Check 1: Server Logs

```bash
# Look for SSR errors
npm run dev

# Should see:
# ✅ "Fetching event data for SSR"
# ✅ No errors
```

### Check 2: Network Tab

1. Open DevTools > Network
2. Reload page
3. Check first HTML request
4. Look at Response tab
5. Search for `og:title`

**Should be in the HTML response!**

### Check 3: Environment Variables

```bash
# Check if API_URL is set
echo $NEXT_PUBLIC_API_URL
# or
echo $API_URL

# Should output your API URL
```

### Check 4: API Accessibility

```bash
# Test if server can reach API
curl -X POST http://localhost:5001/event/getevent \
  -H "Content-Type: application/json" \
  -d '{"event_id":"your-event-id"}'

# Should return event data
```

## 📊 Test Results Checklist

| Test | Status | Notes |
|------|--------|-------|
| View Page Source | ⬜ | Meta tags in HTML? |
| Facebook Debugger | ⬜ | Preview shows correctly? |
| Twitter Validator | ⬜ | Card displays? |
| WhatsApp | ⬜ | Rich preview appears? |
| LinkedIn Inspector | ⬜ | Professional preview? |

## 🚨 Common Issues

### Issue 1: "og:title" Not in Page Source

**Symptom**: Can't find meta tags in HTML source

**Cause**: SSR not working

**Fix:**
```bash
# 1. Check getServerSideProps exists
grep "getServerSideProps" src/pages/event/[eventId].jsx

# 2. Restart dev server
npm run dev

# 3. Check for errors in console
```

### Issue 2: Image Not Loading

**Symptom**: Preview shows but no image

**Cause**: Image URL issue

**Fix:**
- Verify image URL is HTTPS
- Check image is publicly accessible
- Test image URL directly in browser
- Ensure Cloudinary URL is correct

### Issue 3: Old Preview Showing

**Symptom**: Changes not reflected in preview

**Cause**: Social media cache

**Fix:**
```bash
# Facebook: Use debugger > "Scrape Again"
# WhatsApp: Add ?v=2 to URL
# LinkedIn: Use Post Inspector
# Twitter: Clear cache (may take time)
```

### Issue 4: 404 Error

**Symptom**: Event page not loading

**Cause**: Event doesn't exist or API error

**Fix:**
- Check event_id is correct
- Verify event exists in database
- Check backend server is running
- Look at server logs for errors

## ✨ Success Indicators

You'll know it's working when:

1. ✅ Meta tags visible in page source
2. ✅ Facebook Debugger shows preview
3. ✅ WhatsApp shows rich preview
4. ✅ Twitter shows large image card
5. ✅ LinkedIn shows professional preview
6. ✅ No errors in server logs

## 🎯 Quick Verification Script

```bash
# Test if meta tags are in HTML
curl -s https://your-domain.com/event/[eventId] | grep "og:title"

# Expected output:
# <meta property="og:title" content="Your Event Name"/>

# If you see this, SSR is working! ✅
```

## 📱 Mobile Testing

### iOS Safari
1. Share event link via Messages
2. Should show rich preview

### Android Chrome
1. Share event link
2. Should show preview with image

### WhatsApp Mobile
1. Share in chat
2. Rich preview should appear

## 🔄 After Making Changes

If you modify the event page:

1. **Restart dev server**
   ```bash
   npm run dev
   ```

2. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R)

3. **Clear social media cache**
   - Use Facebook Debugger > "Scrape Again"
   - Add version parameter: `?v=3`

4. **Test again**
   - View page source first
   - Then test social platforms

## 📈 Performance Check

### Page Load Time

```bash
# Should be < 2 seconds
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/event/[eventId]
```

### Server Response

```bash
# Check server response time
time curl -s https://your-domain.com/event/[eventId] > /dev/null

# Should be < 1 second
```

## 🎉 Final Verification

Before marking as complete:

- [ ] View page source shows meta tags
- [ ] Facebook Debugger shows preview
- [ ] WhatsApp shows rich preview
- [ ] Twitter Card Validator shows card
- [ ] LinkedIn Post Inspector shows preview
- [ ] No errors in server logs
- [ ] Images load correctly
- [ ] All platforms tested

**If all checked, you're done! 🚀**

## 💡 Pro Tips

1. **Always test with View Page Source first**
   - This is the source of truth
   - If tags aren't there, nothing else will work

2. **Use Facebook Debugger liberally**
   - It's the best debugging tool
   - Shows exactly what's wrong

3. **Be patient with WhatsApp**
   - It caches very aggressively
   - May take 24-48 hours to update

4. **Test on multiple events**
   - Ensure it works for all event types
   - Free, paid, premium, etc.

5. **Monitor server logs**
   - Watch for SSR errors
   - Check API response times

## 🆘 Need Help?

If tests are failing:

1. Check `OG_META_TAGS_SSR_FIX.md` for detailed docs
2. Review server logs for errors
3. Verify environment variables
4. Test API endpoint directly
5. Check if backend is accessible

**Remember**: If meta tags are in the page source, SSR is working correctly! ✅
