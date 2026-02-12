<h1 align="center">UniHub | Event Management Platform</h1>
<p align="center">Create, manage, and discover events with real-time updates and streamlined registrations.</p>

## Overview
- UniHub is a full-stack event management platform built with a Next.js frontend and an Express/MongoDB backend.
- The project is organized as a monorepo: the frontend is deployed on Vercel, and the backend is deployed on Render.

## Monorepo Layout
- `client/` – Next.js application (frontend)
- `server/` – Node.js + Express API (backend)
- `developers/` – auxiliary developer site used by product managers

## Features
- Event creation with ticket types and capacity
- User registrations and payment integration
- Real-time updates via `socket.io`
- Email notifications (OTP, welcome/login alerts)
- Admin dashboards and announcements

## Tech Stack
- Frontend: `Next.js`, `React`, `Tailwind CSS`
- Backend: `Node.js`, `Express`, `MongoDB (Mongoose)`
- Real-time: `socket.io`
- Payments: `Stripe`
- Email: `NodeMailer`

## Architecture
- Client communicates with the server via REST APIs and WebSockets.
- Authentication and emails rely on environment-configured secrets.
- Image uploads currently store to a local `server/uploads` directory.

## Deployment

### Backend (Render)
- This repo includes `render.yaml` to automate deployment.
1. Push the repository to GitHub.
2. Log in to Render and choose **New → Blueprint**.
3. Connect the repository; Render will detect and configure the `invite-server` service.
4. Set environment variables in the Render service:
   - `MONGO_ATLAS_URI` – MongoDB connection string
   - `JWT_SECRET` – secure random string
   - `NODE_MAILER_USER` – email address used for sending emails
   - `NODE_MAILER_PASS` – app password for the email account
   - `STRIPE_KEY` – Stripe Secret Key
   - `CLIENT_BASE_URL` – will be set to your Vercel URL after frontend is deployed

Note: Local file uploads on Render are ephemeral; use Cloudinary or AWS S3 for production-grade persistence.

### Frontend (Vercel)
1. Log in to Vercel and choose **Add New → Project**.
2. Import the repository and set the **Root Directory** to `client`.
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` – your Render base URL (e.g., `https://invite-server.onrender.com`)
   - `NEXT_PUBLIC_STRIPE_KEY` – Stripe Publishable Key
   - `NEXT_PUBLIC_BASE_URL` – Vercel project URL (e.g., `https://your-project.vercel.app`)
4. Deploy the project.

### Connect Frontend and Backend
- After Vercel deploys, update Render’s `CLIENT_BASE_URL` with your Vercel URL.
- This ensures email links and UI redirects point to the correct domain.

## Environment Variables

### Client (`client/.env.local`)
- `NEXT_PUBLIC_BASE_URL` – `http://localhost:3000` for local dev
- `NEXT_PUBLIC_STRIPE_KEY` – Stripe publishable key
- `NEXT_PUBLIC_API_URL` – `http://localhost:5000` or your Render URL

### Server (`server/.env`)
- `MONGO_ATLAS_URI` – MongoDB Atlas URI
- `STRIPE_KEY` – Stripe secret key
- `NODE_MAILER_USER` – sender email
- `NODE_MAILER_PASS` – app password
- `JWT_SECRET` – JWT signing secret
- `CLIENT_BASE_URL` – client base URL used in emails (e.g., Vercel URL)

## Local Development

### Install Dependencies
```bash
# from repository root
cd client && npm install
cd ../server && npm install
```

### Run Locally
```bash
# start backend
cd server
npm start
# backend on http://localhost:5000

# start frontend
cd ../client
npm run dev
# frontend on http://localhost:3000
```

## Real-time Updates
- Backend initializes `socket.io` (server/index.js:7) and emits events for user registration and event messages.
- Client connects using `socket.io-client` and listens for updates in components like `EventChat.js` and the dashboard.

## Security
- Keep all secrets in environment variables and never commit them to the repository.
- Use strong `JWT_SECRET` values; rotate periodically if needed.
- For production image storage, prefer managed services over local disk.

## Troubleshooting
- API 404/500: Verify `NEXT_PUBLIC_API_URL` points to your live backend.
- CORS issues: Ensure backend CORS is enabled (server/index.js:89).
- Emails not sending: Validate `NODE_MAILER_USER/PASS` and allow app password usage for Gmail.
- MongoDB connection failures: Double-check `MONGO_ATLAS_URI` and network access rules in Atlas.

## License
- This project is maintained under the UniHub initiative. Usage and contributions follow the repository’s license terms.
