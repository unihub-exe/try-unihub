const webpush = require('web-push');
const fs = require('fs');
const vapidKeys = webpush.generateVAPIDKeys();
fs.writeFileSync('vapid.json', JSON.stringify(vapidKeys, null, 2));
