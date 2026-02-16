# Admin Account Management

This guide explains how to securely manage admin accounts for UniHub.

## Security Features

- Admin passwords are hashed using bcrypt before storage
- No hardcoded credentials in the codebase
- JWT tokens for authentication
- Credentials stored securely in MongoDB

## Initial Setup

### Create the First Admin Account

Run this command to create the default admin account:

```bash
cd server
npm run init-admin
```

This will create an admin account with:
- Email: `admin@unihub.com`
- Password: `unihub2026`

**⚠️ Important**: Change this password after first login for security.

## Adding More Admin Accounts

To add additional admin accounts, use the interactive script:

```bash
cd server
npm run add-admin
```

You'll be prompted to enter:
- Admin email
- Admin name
- Admin password

The script will:
- Check if the email already exists
- Hash the password securely
- Create the admin account in MongoDB

## Manual Admin Creation (Alternative)

You can also create admin accounts programmatically by making a POST request to `/admin/setadmin`:

```bash
curl -X POST http://localhost:5000/admin/setadmin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@unihub.com",
    "name": "New Admin",
    "password": "securepassword123"
  }'
```

## Removing Test Credentials

The old test credentials (`invite.testing@gmail.com`) have been removed from:
- The model file (no longer auto-created)
- The frontend login page (no "Use Test Credentials" button)

## Best Practices

1. **Use Strong Passwords**: Minimum 12 characters with mix of letters, numbers, and symbols
2. **Unique Emails**: Each admin must have a unique email address
3. **Regular Rotation**: Change admin passwords periodically
4. **Limit Access**: Only create admin accounts for trusted personnel
5. **Monitor Activity**: Review admin actions through logs

## Troubleshooting

### "Admin already exists" error
- The email is already registered
- Use a different email or remove the existing admin from MongoDB

### Connection errors
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` file
- Verify network connectivity

### JWT errors
- Ensure `JWT_SECRET` is set in `.env` file
- The secret should be a long, random string

## Environment Variables Required

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```
