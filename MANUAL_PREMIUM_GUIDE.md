# Manual Premium Event Guide

This guide explains how to manually mark an event as "Premium" directly in your MongoDB database.

## Prerequisites

- Access to your MongoDB database (e.g., MongoDB Compass, Atlas, or CLI).
- The `_id` of the event you want to upgrade.

## Steps

1.  **Connect to your Database**
    Open your MongoDB client and connect to your `unihubb` database.

2.  **Locate the Event**
    Find the event document in the `events` collection. You can search by the event's name or `_id`.

    ```javascript
    db.events.findOne({ name: "Your Event Name" })
    ```

3.  **Update the `isPremium` Field**
    To make the event premium, you need to set the `isPremium` field to `true`.

    **Using MongoDB Shell / CLI:**
    ```javascript
    db.events.updateOne(
      { _id: ObjectId("YOUR_EVENT_ID_HERE") },
      { $set: { isPremium: true } }
    )
    ```

    **Using MongoDB Compass:**
    1.  Navigate to the `events` collection.
    2.  Find the specific event document.
    3.  Click the **Edit Document** (pencil icon) button.
    4.  Add a new field or locate the existing `isPremium` field.
    5.  Set the value to `true` (boolean).
    6.  Click **Update**.

4.  **Verify the Change**
    Refresh your application or query the database again to ensure the field is set correctly.

    ```javascript
    db.events.findOne({ _id: ObjectId("YOUR_EVENT_ID_HERE") }, { isPremium: 1 })
    ```
    Expected output:
    ```json
    { "_id": "...", "isPremium": true }
    ```

## Reverting Changes

To remove the premium status, simply set `isPremium` back to `false`.

```javascript
db.events.updateOne(
  { _id: ObjectId("YOUR_EVENT_ID_HERE") },
  { $set: { isPremium: false } }
)
```
