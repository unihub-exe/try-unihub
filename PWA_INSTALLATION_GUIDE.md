# PWA (Progressive Web App) Installation Guide

## Overview

UniHub now supports PWA installation, allowing users to install the website as an app on their devices without going through app stores. This provides:

- **Quick Access** - App icon on home screen
- **Faster Performance** - Cached resources load instantly
- **Offline Support** - Basic functionality works without internet
- **Native Feel** - Full-screen experience without browser UI
- **Push Notifications** - Direct notifications to device
- **Automatic Updates** - Always get the latest version

## What Was Added

### 1. PWA Manifest (`public/manifest.json`)
Defines how the app appears when installed:
- App name and description
- Icons for different screen sizes
- Theme colors
- Display mode (standalone = full screen)
- Start URL

### 2. Meta Tags (`src/pages/_document.js`)
Added PWA-related meta tags:
- Manifest link
- Theme color
- Mobile web app capable
- Apple touch icon

### 3. Install Button Component (`src/components/InstallAppButton.jsx`)
Smart component that:
- Detects if app is installable
- Shows only when installation is possible
- Hides if already installed
- Handles the installation prompt
- Supports multiple variants (button, banner, compact)

### 4. Integration Points

**Settings Page** (`src/pages/users/settings.jsx`)
- Added install button in Preferences tab
- Always visible when installable
- Clean, prominent design

**Dashboard** (`src/pages/users/dashboard.jsx`)
- Added floating install banner
- Appears after 3 seconds
- Can be dismissed (won't show again)
- Only shows if not already dismissed

## How It Works

### Browser Support

**Chrome/Edge (Desktop & Mobile)**
- Full support
- Shows install prompt automatically
- Can be triggered programmatically

**Safari (iOS)**
- Partial support
- Manual installation only (Add to Home Screen)
- No programmatic prompt

**Firefox**
- Limited support on mobile
- Manual installation

### Installation Flow

1. **User visits site** - Browser checks if PWA requirements are met
2. **beforeinstallprompt event** - Browser fires event if installable
3. **Component captures event** - InstallAppButton stores the prompt
4. **User clicks install** - Component triggers the stored prompt
5. **Browser shows dialog** - Native installation dialog appears
6. **User confirms** - App is installed to home screen
7. **appinstalled event** - Component updates state

### Requirements for Installation

For the browser to offer installation, the site must:
- ✅ Be served over HTTPS (or localhost)
- ✅ Have a valid manifest.json
- ✅ Have a service worker registered
- ✅ Have icons in the manifest
- ✅ Have a start_url in the manifest

## Component Variants

### 1. Button Variant (Settings Page)
```jsx
<InstallAppButton variant="button" />
```
- Full-width button with gradient
- Icon and descriptive text
- Perfect for settings/profile pages

### 2. Banner Variant (Dashboard)
```jsx
<InstallAppButton variant="banner" />
```
- Floating banner at bottom of screen
- Auto-shows after 3 seconds
- Dismissible with localStorage persistence
- Includes app benefits

### 3. Compact Variant (Navbar)
```jsx
<InstallAppButton variant="compact" />
```
- Small button for navigation bars
- Icon + text on desktop, icon only on mobile
- Minimal space usage

## User Experience

### First Visit
1. User browses the site normally
2. After 3 seconds, install banner appears (if on dashboard)
3. User can dismiss or install

### Settings Page
1. User goes to Settings > Preferences
2. Sees "Install UniHub App" button at top
3. Can install anytime

### After Installation
1. App icon appears on home screen
2. Opens in full-screen mode
3. No browser UI visible
4. Feels like native app

### iOS Users (Safari)
Since Safari doesn't support programmatic prompts:
1. User taps Share button
2. Selects "Add to Home Screen"
3. Confirms installation

## Testing

### Desktop (Chrome/Edge)
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Manifest" to verify manifest.json
4. Click "Service Workers" to verify SW
5. Look for install icon in address bar
6. Or use the install button in settings

### Mobile (Chrome/Android)
1. Visit site on mobile
2. Wait for install banner
3. Or tap menu > "Install app"
4. Or use install button in settings

### Mobile (Safari/iOS)
1. Visit site on mobile
2. Tap Share button (square with arrow)
3. Scroll and tap "Add to Home Screen"
4. Confirm

## Customization

### Change App Name
Edit `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "Short Name"
}
```

### Change Theme Color
Edit `public/manifest.json` and `src/pages/_document.js`:
```json
{
  "theme_color": "#your-color"
}
```

### Change Icons
Replace icons in `public/favicon_io/` and update manifest.json

### Modify Install Banner
Edit `src/components/InstallAppButton.jsx`:
- Change timing: `setTimeout(() => setShowBanner(true), 3000)`
- Change position: Modify CSS classes
- Change content: Update text and styling

## Troubleshooting

### Install Button Not Showing
**Possible causes:**
- Not on HTTPS (except localhost)
- Already installed
- Browser doesn't support PWA
- Service worker not registered
- Manifest.json has errors

**Solutions:**
1. Check browser console for errors
2. Verify manifest.json is accessible
3. Check service worker in DevTools
4. Try different browser
5. Clear cache and reload

### Installation Fails
**Possible causes:**
- Network error
- Invalid manifest
- Missing icons
- Service worker error

**Solutions:**
1. Check DevTools console
2. Verify all manifest URLs are correct
3. Test service worker separately
4. Check icon files exist

### Banner Doesn't Appear
**Possible causes:**
- Already dismissed (localStorage)
- Not on dashboard page
- Already installed
- Browser doesn't support

**Solutions:**
1. Clear localStorage: `localStorage.removeItem('pwa_banner_dismissed')`
2. Navigate to dashboard
3. Check if already installed
4. Try different browser

## Best Practices

### When to Show Install Prompt
- ✅ After user has engaged with site (3+ seconds)
- ✅ On pages where user spends time (dashboard)
- ✅ In settings where user expects it
- ❌ Immediately on first visit
- ❌ On every page load
- ❌ Multiple times per session

### Design Guidelines
- Make it easy to dismiss
- Explain benefits clearly
- Don't block content
- Respect user's choice
- Don't show again if dismissed

### Performance
- Lazy load install component
- Don't impact initial page load
- Cache manifest and icons
- Optimize icon sizes

## Analytics

To track installation:
```javascript
window.addEventListener('appinstalled', () => {
  // Track installation event
  console.log('PWA installed');
  // Send to analytics
});
```

## Future Enhancements

1. **Install Prompt Timing** - Show after specific user actions
2. **A/B Testing** - Test different install prompts
3. **Installation Stats** - Track install rate
4. **Custom Install Flow** - Multi-step installation guide
5. **Platform Detection** - Show iOS-specific instructions
6. **Offline Functionality** - Enhanced offline features
7. **Background Sync** - Sync data when back online
8. **Push Notifications** - Re-engagement notifications

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Manifest Generator](https://www.simicart.com/manifest-generator.html/)

## Support

If users have issues installing:
1. Check browser compatibility
2. Verify HTTPS connection
3. Clear browser cache
4. Try different browser
5. Check console for errors
6. Contact support with browser/device info
