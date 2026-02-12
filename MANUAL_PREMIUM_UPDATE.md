# Manual Premium Event Update Guide

This guide explains how to manually update an event to "Premium" status directly in the MongoDB database.

## Prerequisites

- Access to your MongoDB database (e.g., via MongoDB Compass, Atlas UI, or CLI).
- The `event_id` of the event you want to upgrade.

## Steps

1.  **Find the Event ID**
    - Go to the event page on your website (e.g., `https://unihubb.com/event/12345`).
    - The `event_id` is the last part of the URL (e.g., `12345`).

2.  **Connect to Database**
    - Open your MongoDB client.
    - Connect to the `unihubb` database (or whatever your DB name is).

3.  **Locate the Event**
    - Go to the `events` collection.
    - Filter by `event_id`:
      ```json
      { "event_id": "YOUR_EVENT_ID" }
      ```

4.  **Update the Field**
    - Once you find the document, update (or add) the `isPremium` field.
    - Set the value to `true` (boolean).

    **Using MongoDB Shell / CLI:**
    ```javascript
    db.events.updateOne(
      { "event_id": "YOUR_EVENT_ID" },
      { $set: { "isPremium": true } }
    );
    ```

5.  **Verify**
    - Go back to the website.
    - The event should now be displayed as a Premium event (e.g., with a badge or in premium sections).


<!-- 
1. 06:01:10.411 Running build in Portland, USA (West) – pdx1
06:01:10.411 Build machine configuration: 2 cores, 8 GB
06:01:10.518 Cloning github.com/unihub-exe/try-unihub (Branch: main, Commit: 1e201eb)
06:01:11.460 Cloning completed: 941.000ms
06:01:11.545 Restored build cache from previous deployment (7XFojDshbyhbaBqSaSSAwDwxoGdD)
06:01:11.807 Running "vercel build"
06:01:12.318 Vercel CLI 50.15.1
06:01:12.595 Running "install" command: `npm install`...
06:01:16.786 
06:01:16.791 up to date, audited 730 packages in 4s
06:01:16.793 
06:01:16.796 187 packages are looking for funding
06:01:16.796   run `npm fund` for details
06:01:16.796 
06:01:16.796 2 low severity vulnerabilities
06:01:16.796 
06:01:16.796 To address all issues (including breaking changes), run:
06:01:16.796   npm audit fix --force
06:01:16.797 
06:01:16.797 Run `npm audit` for details.
06:01:16.832 Detected Next.js version: 16.1.6
06:01:16.834 Running "npm run build"
06:01:16.936 
06:01:16.936 > client@0.1.0 build
06:01:16.936 > next build
06:01:16.937 
06:01:17.591 ⚠ `images.domains` is deprecated in favor of `images.remotePatterns`. Please update next.config.js to protect your application from malicious users.
06:01:17.658 ▲ Next.js 16.1.6 (Turbopack)
06:01:17.659 
06:01:17.684   Running TypeScript ...
06:01:17.743   Creating an optimized production build ...
06:01:25.565 
06:01:25.566 > Build error occurred
06:01:25.569 Error: Turbopack build failed with 5 errors:
06:01:25.570 ./src/components/CreateEventForm.js:287:17
06:01:25.570 Parsing ecmascript source code failed
06:01:25.570 [0m [90m 285 |[39m                 height [33m=[39m { windowSize[33m.[39mheight }
06:01:25.570  [90m 286 |[39m                 [33m/[39m[33m>[39m [33m<[39m
06:01:25.570 [31m[1m>[22m[39m[90m 287 |[39m                 [33m/[39mdiv[33m>[39m
06:01:25.570  [90m     |[39m                 [31m[1m^[22m[39m
06:01:25.570  [90m 288 |[39m             )
06:01:25.570  [90m 289 |[39m         }
06:01:25.570  [90m 290 |[39m[0m
06:01:25.570 
06:01:25.571 Expression expected
06:01:25.571 
06:01:25.571 Import traces:
06:01:25.571   Browser:
06:01:25.571     ./src/components/CreateEventForm.js
06:01:25.572     ./src/pages/users/eventform.jsx
06:01:25.572 
06:01:25.572   SSR:
06:01:25.573     ./src/components/CreateEventForm.js
06:01:25.573     ./src/pages/users/eventform.jsx
06:01:25.573 
06:01:25.573 
06:01:25.573 ./src/components/UserDropdown.js:68:17
06:01:25.573 Parsing ecmascript source code failed
06:01:25.573 [0m [90m 66 |[39m             ) [33m:[39m ( [33m<[39m
06:01:25.574  [90m 67 |[39m                 div className [33m=[39m [32m"h-full w-full flex items-center justify-center text-white font-bold text-sm"[39m [33m>[39m { userInitials } [33m<[39m
06:01:25.574 [31m[1m>[22m[39m[90m 68 |[39m                 [33m/[39mdiv[33m>[39m
06:01:25.574  [90m    |[39m                 [31m[1m^[22m[39m
06:01:25.574  [90m 69 |[39m             )
06:01:25.574  [90m 70 |[39m         } [33m<[39m
06:01:25.574  [90m 71 |[39m         [33m/[39mdiv[33m>[39m [33m<[39m[0m
06:01:25.574 
06:01:25.574 Expression expected
06:01:25.574 
06:01:25.575 Import traces:
06:01:25.575   Browser:
06:01:25.575     ./src/components/UserDropdown.js
06:01:25.575     ./src/components/UserNavBar.js
06:01:25.575     ./src/pages/users/dashboard.jsx
06:01:25.575 
06:01:25.575   SSR:
06:01:25.576     ./src/components/UserDropdown.js
06:01:25.576     ./src/components/UserNavBar.js
06:01:25.576     ./src/pages/users/dashboard.jsx
06:01:25.576 
06:01:25.576 
06:01:25.576 ./src/pages/_app.js:66:54
06:01:25.576 Parsing ecmascript source code failed
06:01:25.577 [0m [90m 64 |[39m         href [33m=[39m { process[33m.[39menv[33m.[39m[33mNEXT_PUBLIC_API_URL[39m [33m||[39m [32m"http://localhost:5000"[39m }
06:01:25.577  [90m 65 |[39m         [33m/[39m[33m>[39m [33m<[39m
06:01:25.577 [31m[1m>[22m[39m[90m 66 |[39m         title [33m>[39m [33mUniHub[39m [33m-[39m [33mUniversity[39m [33mEvent[39m [33mPlatform[39m [33m<[39m [33m/[39mtitle[33m>[39m [33m<[39m
06:01:25.577  [90m    |[39m                                                      [31m[1m^[22m[39m
06:01:25.577  [90m 67 |[39m         [33m/[39m[33mHead[39m[33m>[39m [33m<[39m
06:01:25.577  [90m 68 |[39m         [33mServiceWorkerRegister[39m [33m/[39m [33m>[39m
06:01:25.577  [90m 69 |[39m         [33m<[39m[0m
06:01:25.578 
06:01:25.578 Expression expected
06:01:25.578 
06:01:25.578 
06:01:25.578 ./src/pages/_app.js:66:62
06:01:25.578 Parsing ecmascript source code failed
06:01:25.578 [0m [90m 64 |[39m         href [33m=[39m { process[33m.[39menv[33m.[39m[33mNEXT_PUBLIC_API_URL[39m [33m||[39m [32m"http://localhost:5000"[39m }
06:01:25.578  [90m 65 |[39m         [33m/[39m[33m>[39m [33m<[39m
06:01:25.579 [31m[1m>[22m[39m[90m 66 |[39m         title [33m>[39m [33mUniHub[39m [33m-[39m [33mUniversity[39m [33mEvent[39m [33mPlatform[39m [33m<[39m [33m/[39mtitle[33m>[39m [33m<[39m
06:01:25.579  [90m    |[39m                                                              [31m[1m^[22m[39m
06:01:25.579  [90m 67 |[39m         [33m/[39m[33mHead[39m[33m>[39m [33m<[39m
06:01:25.579  [90m 68 |[39m         [33mServiceWorkerRegister[39m [33m/[39m [33m>[39m
06:01:25.579  [90m 69 |[39m         [33m<[39m[0m
06:01:25.579 
06:01:25.580 Expression expected
06:01:25.580 
06:01:25.580 
06:01:25.580 ./src/pages/_app.js:67:9
06:01:25.580 Parsing ecmascript source code failed
06:01:25.580 [0m [90m 65 |[39m         [33m/[39m[33m>[39m [33m<[39m
06:01:25.580  [90m 66 |[39m         title [33m>[39m [33mUniHub[39m [33m-[39m [33mUniversity[39m [33mEvent[39m [33mPlatform[39m [33m<[39m [33m/[39mtitle[33m>[39m [33m<[39m
06:01:25.581 [31m[1m>[22m[39m[90m 67 |[39m         [33m/[39m[33mHead[39m[33m>[39m [33m<[39m
06:01:25.581  [90m    |[39m         [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
06:01:25.581  [90m 68 |[39m         [33mServiceWorkerRegister[39m [33m/[39m [33m>[39m
06:01:25.581  [90m 69 |[39m         [33m<[39m
06:01:25.581  [90m 70 |[39m         [33mComponent[39m {[33m...[39mpageProps }[0m
06:01:25.581 
06:01:25.581 Unterminated regexp literal
06:01:25.581 
06:01:25.581 
06:01:25.582     at <unknown> (./src/components/CreateEventForm.js:287:17)
06:01:25.582     at <unknown> (./src/components/UserDropdown.js:68:17)
06:01:25.582     at <unknown> (./src/pages/_app.js:66:54)
06:01:25.582     at <unknown> (./src/pages/_app.js:66:62)
06:01:25.582     at <unknown> (./src/pages/_app.js:67:9)
06:01:25.643 Error: Command "npm run build" exited with 1

2. Task: Implement a Next.js background image processing system using Cloudinary Webhooks.

Context: > I have configured a Cloudinary Upload Preset with "Async upload" enabled and a "Notification URL" pointing to /api/webhooks/cloudinary. The preset is set to convert all incoming files to WebP.

Requirements:

Webhook Handler: Create a Next.js App Router route (app/api/webhooks/cloudinary/route.ts).

Security: Implement signature verification using the cloudinary SDK and my CLOUDINARY_API_SECRET to ensure the request is actually from Cloudinary.

Logic: > - When the webhook receives a success notification, extract the secure_url (the new WebP) and the public_id.

Database Update: Create a placeholder function await updateDatabase(userId, imageUrl) where I can update my user's profile image in my database.

Cleanup: Since I want to replace the old file, add logic to delete the original version using cloudinary.v2.uploader.destroy only if a previous version existed.

Frontend: Provide a simple React component using a standard HTML file input that uploads to Cloudinary. It should show a "Success! We are processing your image in the background" message as soon as the initial upload starts, allowing the user to navigate away.

implement "Signature Verification." -->
