# Render Deployment Guide for UniHub Backend

This guide explains how to deploy your **Backend (Server)** to Render properly, ensuring the Email Service works with Brevo.

## 1. Create a New Web Service

1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository (`unihubb`).

## 2. Configure Service Settings

Use these settings exactly:

| Setting            | Value                                         |
| :----------------- | :-------------------------------------------- |
| **Name**           | `unihub-server` (or your choice)              |
| **Region**         | (Choose closest to you)                       |
| **Branch**         | `main` (or your working branch)               |
| **Root Directory** | `server` (IMPORTANT: Do not leave this empty) |
| **Runtime**        | `Node`                                        |
| **Build Command**  | `npm install`                                 |
| **Start Command**  | `node index.js`                               |
| **Plan**           | Free (or your choice)                         |

## 3. Environment Variables (Critical)

You **MUST** add these Environment Variables in the "Environment" tab on Render.
If you miss these, the Email Service will fail with "Connection Timeout" or "502 Bad Gateway".

### Email Service (Brevo)

| Key               | Value                                            |
| :---------------- | :----------------------------------------------- |
| `SMTP_HOST`       | `smtp-relay.brevo.com`                           |
| `SMTP_PORT`       | `587`                                            |
| `SMTP_USER`       | _Your Brevo Login Email_                         |
| `SMTP_PASS`       | _Your Brevo SMTP Master Key_                     |
| `SMTP_SECURE`     | `false`                                          |
| `SMTP_FROM_EMAIL` | `no-reply@unihubb.com` (Or your verified sender) |

### Backward Compatibility

| Key                | Value                                                        |
| :----------------- | :----------------------------------------------------------- |
| `NODE_MAILER_USER` | `no-reply@unihubb.com` (Set this to same as SMTP_FROM_EMAIL) |

### Database & Security

| Key               | Value                                             |
| :---------------- | :------------------------------------------------ |
| `MONGO_ATLAS_URI` | _Your MongoDB Connection String_                  |
| `JWT_SECRET`      | _Your Secret Key_                                 |
| `PORT`            | `10000` (Render sets this auto, but good to have) |

### Other Services (Copy from your .env)

- `STRIPE_KEY`
- `FLW_SECRET_KEY`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_ACCOUNT_SID`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `MAILTO`

## 4. Deploy

1. Click **Create Web Service**.
2. Wait for the build to finish.
3. Watch the logs. You should see:
   ```
   Email Service Configured with User: you***
   Server running on port 10000
   MongoDB connected
   ```

## 5. Troubleshooting "502 Bad Gateway"

If you still see 502 errors when signing up:

1. Check the **Logs** tab in Render.
2. Look for "OTP Error" or "Transporter Config".
3. If it says "Connection timeout", check if `SMTP_HOST` is set to `smtp-relay.brevo.com` and NOT `smtp.gmail.com`.
4. Ensure you are **not** using Google App Password anymore.

<!-- 1. ".main-container {
  font-family: "Trebuchet MS", sans-serif;
  position: relative;
  height: 203px;
  aspect-ratio: 1.579;
  border-radius: 1em;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 300ms ease-in;
}
.main-container:hover {
  transform: rotateZ(1deg) rotateY(10deg) scale(1.1);
  box-shadow: 0 5em 2em #111;
}

.border {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1em;
  background: linear-gradient(
    115deg,
    rgba(0, 0, 0, 0.33) 12%,
    rgba(255, 255, 255, 0.33) 27%,
    rgba(255, 255, 255, 0.33) 31%,
    rgba(0, 0, 0, 0.33) 52%
  );
}

.border:hover:after {
  position: absolute;
  content: " ";
  height: 50em;
  aspect-ratio: 1.58;
  border-radius: 1em;
  background: linear-gradient(
    115deg,
    rgba(0, 0, 0, 1) 42%,
    rgba(255, 255, 255, 1) 47%,
    rgba(255, 255, 255, 1) 51%,
    rgba(0, 0, 0, 1) 52%
  );
  animation: rotate 4s linear infinite;
  z-index: 1;
  opacity: 0.05;
}

.card {
  height: 12.5em;
  aspect-ratio: 1.586;
  border-radius: 1em;
  background-color: #999;
  opacity: 0.8;
  background-image: linear-gradient(to right, #777, #777 2px, #999 2px, #999);
  background-size: 4px 100%;
}

.shadow {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 0.85em;
  border: 1px solid #bbb;
  background:
    radial-gradient(
        circle at 100% 100%,
        #ffffff 0,
        #ffffff 8px,
        transparent 8px
      )
      0% 0%/13px 13px no-repeat,
    radial-gradient(circle at 0 100%, #ffffff 0, #ffffff 8px, transparent 8px)
      100% 0%/13px 13px no-repeat,
    radial-gradient(circle at 100% 0, #ffffff 0, #ffffff 8px, transparent 8px)
      0% 100%/13px 13px no-repeat,
    radial-gradient(circle at 0 0, #ffffff 0, #ffffff 8px, transparent 8px) 100%
      100%/13px 13px no-repeat,
    linear-gradient(#ffffff, #ffffff) 50% 50% / calc(100% - 10px)
      calc(100% - 26px) no-repeat,
    linear-gradient(#ffffff, #ffffff) 50% 50% / calc(100% - 26px)
      calc(100% - 10px) no-repeat,
    linear-gradient(
      135deg,
      rgba(3, 3, 3, 0.5) 0%,
      transparent 22%,
      transparent 47%,
      transparent 73%,
      rgba(0, 0, 0, 0.5) 100%
    );
  box-sizing: border-box;
}

.content {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 0.6em;
  border: 1px solid #aaa;
  box-shadow: -1px -1px 0 #ddd;
  transform: translate(-50%, -50%);
  height: 12em;
  aspect-ratio: 1.604;
  background-image: linear-gradient(to right, #777, #555 2px, #aaa 2px, #aaa);
  background-size: 4px 100%;
}

.rev {
  top: 0.5em;
  left: 0.75em;
  color: #ffffff9f;
  font-size: 1.25em;
}

.master {
  position: absolute;
  bottom: 1.25em;
  right: 0.5em;
  background: linear-gradient(
    90deg,
    rgba(75, 75, 75, 0.25) 0%,
    rgba(121, 121, 121, 1) 100%
  );
  color: #fff;
  height: 2.5em;
  width: 2.5em;
  border: 1px solid #bbb;
  border-radius: 50%;
}

.master.one {
  right: 2em;
}

.master-text {
  bottom: 0.25em;
  right: 0.8em;
  font-size: 0.75em;
}

.ultra-text {
  top: -4px;
  right: 1.75em;
  font-size: 0.5em;
  color: rgba(255, 255, 255, 0.66);
}

.ultra-text,
.master-text,
.rev {
  position: absolute;
  text-shadow: -1px -1px #333;
  color: #fff;
  opacity: 0.75;
}

.chip {
  position: absolute;
  top: 27.5%;
  left: 8.25%;
}

@keyframes rotate {
  0% {
    transform: translate(-25em, -15em);
  }
  20% {
    transform: translate(25em, 15em);
  }
  100% {
    transform: translate(25em, 15em);
  }
}
" use this as inspiration for buidling how the wallet card will look
2. revamp how event crads work using the card and pattern preset in ui-inspo.md as inspiration
3. make the followers section of the user profile show how many followers they have and a full list of their followers
4. the admin in his dahboard should have the ability to make an event premium and take it away anytime, with a premium events page listing all premium events
5. the price slider in filter in all the pages should have a max proce of 20,000,000 naira and should feel smooth when sliding -->
