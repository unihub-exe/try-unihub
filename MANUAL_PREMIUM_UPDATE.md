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


<!--  -->