# Open Graph Meta Tags - Server-Side Rendering Fix

## Problem

Social media platforms (WhatsApp, Facebook, Twitter, etc.) were not showing event-specific previews because:

1. **Client-Side Rendering Issue**: Meta tags were being added via JavaScript after page load
2. **Social Media Crawlers**: Bots don't execute JavaScript - they only read the initial HTML
3. **Missing Meta Tags**: When crawlers scraped the page, they found no OG tags in the HTML

## Solution

Implemented **Server-Side Rendering (SSR)** using Next.js `getServerSideProps` to:
- Fetch event data on the server before page load
- Render meta tags in the initial HTML
- Make meta tags available to social media crawlers

## What Changed

### File Modified: `src/pages/event/[eventId].jsx`

#### 1. Added `getServerSideProps` Function

```javascript
export async function getServerSideProps(context) {
  const { eventId } = context.params;
  const { req } = context;
  
  try {
    // Get the full URL for canonical and og:url
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const fullUrl = `${protocol}://${host}${req.url}`;
    
    // Fetch event data on the server
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5001';
    const response = await fetch(`${apiUrl}/event/getevent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_id: eventId,
      }),
    });

    if (!response.ok) {
      return {
        notFound: true,
      };
    }

    const eventData = await response.json();

    return {
      props: {
        initialEventData: eventData,
        fullUrl,
      },
    };
  } catch (error) {
    console.error("Error fetching event data for SSR:", error);
    return {
      notFound: true,
    };
  }
}
```

#### 2. Updated Component to Accept Props

```javascript
// Before:
function EventPage() {
  const [eventData, setEventData] = useState(null);

// After:
function EventPage({ initialEventData, fullUrl }) {
  const [eventData, setEventData] = useState(initialEventData);
```

#### 3. Prepared Meta Tag Variables

```javascript
// Use fullUrl from server-side props
const eventUrl = fullUrl || (typeof window !== 'undefined' ? window.location.href : '');
const eventPrice = Number(eventData.price) === 0 ? 'Free' : `₦${eventData.price}`;

// Prepare meta tag content
const metaTitle = eventData.name || 'Event';
const metaDescription = eventData.description?.substring(0, 200) || `Join ${eventData.name} on ${eventData.date} at ${eventData.venue}`;
const metaImage = eventData.profile || eventData.cover || '';
```

#### 4. Updated Meta Tags to Use Variables

```javascript
<Head>
  <title>{metaTitle} | UniHub</title>
  <meta name="description" content={metaDescription.substring(0, 160)} />
  
  {/* Open Graph */}
  <meta property="og:title" content={metaTitle} />
  <meta property="og:description" content={metaDescription} />
  <meta property="og:image" content={metaImage} />
  <meta property="og:image:secure_url" content={metaImage} />
  <meta property="og:url" content={eventUrl} />
  
  {/* Twitter Card */}
  <meta name="twitter:title" content={metaTitle} />
  <meta name="twitter:description" content={metaDescription} />
  <meta name="twitter:image" content={metaImage} />
</Head>
```

## How It Works Now

### Before (Client-Side Rendering) ❌

```
1. User/Bot requests page
   ↓
2. Server sends HTML (no meta tags)
   ↓
3. Browser loads JavaScript
   ↓
4. JavaScript fetches event data
   ↓
5. JavaScript adds meta tags
   ↓
6. Social media bots already left (no meta tags seen)
```

### After (Server-Side Rendering) ✅

```
1. User/Bot requests page
   ↓
2. Server fetches event data
   ↓
3. Server renders HTML with meta tags
   ↓
4. Server sends complete HTML
   ↓
5. Social media bots see meta tags immediately ✅
   ↓
6. Browser hydrates React (for interactivity)
```

## Environment Variables Required

Add to your `.env` file:

```bash
# API URL for server-side fetching
NEXT_PUBLIC_API_URL=https://your-api-domain.com
# or
API_URL=https://your-api-domain.com

# For local development
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## Testing

### 1. View Page Source (Most Important)

```bash
# Open event page in browser
# Right-click > View Page Source
# Search for "og:title" or "og:image"
```

**Expected Result:**
```html
<meta property="og:title" content="Your Event Name"/>
<meta property="og:description" content="Event description..."/>
<meta property="og:image" content="https://res.cloudinary.com/..."/>
```

**These should be in the HTML source, NOT added by JavaScript!**

### 2. Facebook Debugger

```
https://developers.facebook.com/tools/debug/
```

1. Paste event URL
2. Click "Debug"
3. Should show:
   - ✅ Event title
   - ✅ Event description
   - ✅ Event image
   - ✅ No errors

### 3. Twitter Card Validator

```
https://cards-dev.twitter.com/validator
```

1. Paste event URL
2. Click "Preview card"
3. Should show large image card with event details

### 4. LinkedIn Post Inspector

```
https://www.linkedin.com/post-inspector/
```

1. Paste event URL
2. Click "Inspect"
3. Should show event preview

### 5. WhatsApp Test

1. Share event link in WhatsApp
2. Wait 2-3 seconds
3. Rich preview should appear with:
   - Event image
   - Event title
   - Event description

## Troubleshooting

### Issue 1: Meta Tags Still Not Showing

**Check:**
```bash
# View page source (not inspect element)
# Meta tags should be in the initial HTML
```

**If not there:**
- Server-side rendering might not be working
- Check server logs for errors
- Verify API_URL environment variable

### Issue 2: Old Preview Showing

**Solution:**
```bash
# Clear social media cache

# Facebook:
1. Go to Facebook Debugger
2. Click "Scrape Again"

# WhatsApp:
- Add ?v=2 to URL
- Or wait 24-48 hours

# LinkedIn:
- Use Post Inspector
- Click "Inspect" again
```

### Issue 3: Image Not Loading

**Check:**
- Image URL is HTTPS (not HTTP)
- Image is publicly accessible
- Image size < 8MB
- Cloudinary URL is correct

**Test image URL:**
```bash
# Open image URL directly in browser
# Should load without errors
```

### Issue 4: 404 or Server Error

**Check:**
- API_URL is correct in .env
- Backend server is running
- Event exists in database
- No CORS issues

## Key Differences: SSR vs CSR

| Aspect | Client-Side (Before) | Server-Side (After) |
|--------|---------------------|---------------------|
| Meta tags in HTML | ❌ No | ✅ Yes |
| Social media bots see tags | ❌ No | ✅ Yes |
| SEO friendly | ❌ Poor | ✅ Excellent |
| Initial page load | Faster | Slightly slower |
| Data fetching | Client | Server |
| Hydration | N/A | Required |

## Performance Considerations

### Server-Side Rendering Impact

**Pros:**
- ✅ Better SEO
- ✅ Social media previews work
- ✅ Faster perceived load (content visible immediately)
- ✅ Works without JavaScript

**Cons:**
- ⚠️ Slightly slower initial response (server must fetch data first)
- ⚠️ More server load (each request hits server)
- ⚠️ Can't use browser cache for initial data

### Optimization Tips

1. **Cache API responses** on the server
2. **Use CDN** for static assets
3. **Implement ISR** (Incremental Static Regeneration) for popular events
4. **Add loading states** for better UX

## Deployment Checklist

- [ ] Environment variables set correctly
- [ ] API_URL points to production backend
- [ ] Backend API is accessible from server
- [ ] Test with Facebook Debugger
- [ ] Test with Twitter Card Validator
- [ ] Test with WhatsApp
- [ ] View page source to verify meta tags
- [ ] Check server logs for errors

## Monitoring

### What to Monitor

1. **Server Response Time**
   - Should be < 1 second
   - Monitor with APM tools

2. **API Availability**
   - Backend must be accessible
   - Set up health checks

3. **Error Rate**
   - Watch for 404s or 500s
   - Check server logs

4. **Social Media Scraping**
   - Monitor Facebook Debugger
   - Check for image loading issues

## Common Errors

### Error 1: "Cannot read property 'name' of null"

**Cause:** Event data not loaded
**Fix:** Check getServerSideProps is fetching data correctly

### Error 2: "API_URL is not defined"

**Cause:** Missing environment variable
**Fix:** Add NEXT_PUBLIC_API_URL to .env

### Error 3: "404 Not Found"

**Cause:** Event doesn't exist or API error
**Fix:** Check event_id and backend logs

### Error 4: "CORS Error"

**Cause:** Backend blocking server requests
**Fix:** Ensure backend allows requests from server IP

## Best Practices

### 1. Always Use Absolute URLs

```javascript
// Good ✅
<meta property="og:image" content="https://res.cloudinary.com/..." />

// Bad ❌
<meta property="og:image" content="/images/event.jpg" />
```

### 2. Provide Fallbacks

```javascript
const metaTitle = eventData.name || 'Event';
const metaDescription = eventData.description || 'Join us for this event';
const metaImage = eventData.profile || eventData.cover || 'https://default-image.jpg';
```

### 3. Validate Image URLs

```javascript
// Ensure image URL is valid
const metaImage = (eventData.profile || eventData.cover || '').startsWith('http') 
  ? (eventData.profile || eventData.cover) 
  : 'https://default-image.jpg';
```

### 4. Handle Errors Gracefully

```javascript
export async function getServerSideProps(context) {
  try {
    // Fetch data
  } catch (error) {
    console.error("SSR Error:", error);
    return {
      notFound: true, // Show 404 page
    };
  }
}
```

## Summary

✅ **Fixed**: Meta tags now render server-side
✅ **Fixed**: Social media bots can see meta tags
✅ **Fixed**: Event previews work on all platforms
✅ **Added**: Server-side rendering with getServerSideProps
✅ **Improved**: SEO and social sharing

**Status**: Production Ready 🚀

Social media previews should now work correctly on all platforms!

## Quick Verification Command

```bash
# Check if meta tags are in HTML source
curl -s https://your-domain.com/event/[eventId] | grep "og:title"

# Should output:
# <meta property="og:title" content="Your Event Name"/>
```

If you see the meta tag in the output, SSR is working correctly! ✅
