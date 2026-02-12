# Email Service Migration Guide

You are currently experiencing "502 Bad Gateway" errors because standard Gmail SMTP (`smtp.gmail.com`) is blocked or rate-limited in cloud environments like Render.

To fix this, you need to switch to a transactional email provider.

**We recommend Brevo (formerly Sendinblue)** because:
1. It is **Free forever** (300 emails/day).
2. It is reliable and works with Render.
3. No credit card is required to start.

---

## Step 1: Create a Brevo Account

1. Go to [https://www.brevo.com/](https://www.brevo.com/) and Sign Up for free.
2. Complete the setup wizard (you may need to verify your domain or email address).
3. Once logged in, click your name in the top-right corner -> **SMTP & API**.
4. Click on the **SMTP** tab.
5. Click **Generate a new SMTP key**.
6. Name it "UniHub Render" and copy the **Password** shown. (You won't see it again!).

## Step 2: Get Your Credentials

You will need these 4 values from the Brevo SMTP page:

- **SMTP Server**: `smtp-relay.brevo.com`
- **Port**: `587`
- **Login**: (Your Brevo login email, e.g., `you@gmail.com`)
- **Password**: (The long key you just generated)

## Step 3: Update Render Environment Variables

1. Go to your **Render Dashboard** -> **Services** -> **unihubb-server**.
2. Click **Environment**.
3. **Add (or Update)** the following variables:

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | *Your Brevo Login Email* |
| `SMTP_PASS` | *Your Brevo SMTP Key* |
| `SMTP_SECURE` | `false` |
| `SMTP_FROM_EMAIL` | *Your Verified Sender Email* (e.g. `no-reply@unihubb.com` or your login email) |

> **Note:** You can delete or ignore `NODE_MAILER_USER` and `NODE_MAILER_PASS` if you set the `SMTP_*` variables above. The code prioritizes `SMTP_*`.

## Step 4: Verify

1. Trigger a redeploy in Render (Manual Deploy -> Deploy latest commit).
2. Try to Sign Up / Sign In again.
3. The 502 error should be gone!

---

## Alternative: SendGrid

If you prefer SendGrid (100 emails/day free):

1. Sign up at SendGrid.com.
2. Create an API Key with "Full Access" or "Mail Send" permissions.
3. Use these settings in Render:
   - `SMTP_HOST`: `smtp.sendgrid.net`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: `apikey` (Literally the string "apikey")
   - `SMTP_PASS`: *Your SendGrid API Key (starts with SG...)*
