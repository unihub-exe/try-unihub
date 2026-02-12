/**
 * Test script for Cloudinary webhook
 * Run with: node test-webhook.js
 */

const crypto = require("crypto");

// Configuration
const WEBHOOK_URL = "http://localhost:3000/api/webhooks/cloudinary";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "uirTywUnt8m1Sq0J1-FswKXzeAo";

/**
 * Generate valid Cloudinary signature
 */
function generateSignature(body, timestamp) {
    return crypto
        .createHash("sha256")
        .update(body + timestamp + API_SECRET)
        .digest("hex");
}

/**
 * Test webhook with valid signature
 */
async function testWebhook() {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    const payload = {
        notification_type: "upload",
        public_id: "user_avatars/test_image_123",
        secure_url: "https://res.cloudinary.com/demo/image/upload/v1234567890/user_avatars/test_image_123.webp",
        format: "webp",
        resource_type: "image",
        created_at: new Date().toISOString(),
        bytes: 125000,
        width: 800,
        height: 800,
        context: {
            custom: {
                userId: "test_user_123",
                oldPublicId: "user_avatars/old_image_456"
            }
        }
    };
    
    const body = JSON.stringify(payload);
    const signature = generateSignature(body, timestamp);
    
    console.log("Testing webhook...");
    console.log("URL:", WEBHOOK_URL);
    console.log("Timestamp:", timestamp);
    console.log("Signature:", signature);
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("\n---\n");
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Cld-Timestamp": timestamp,
                "X-Cld-Signature": signature,
            },
            body: body,
        });
        
        const responseData = await response.json();
        
        console.log("Response Status:", response.status);
        console.log("Response Data:", JSON.stringify(responseData, null, 2));
        
        if (response.ok) {
            console.log("\n✅ Webhook test PASSED");
        } else {
            console.log("\n❌ Webhook test FAILED");
        }
    } catch (error) {
        console.error("\n❌ Error testing webhook:", error.message);
    }
}

/**
 * Test webhook with invalid signature
 */
async function testInvalidSignature() {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    const payload = {
        notification_type: "upload",
        public_id: "test",
    };
    
    const body = JSON.stringify(payload);
    const invalidSignature = "invalid_signature_12345";
    
    console.log("\nTesting invalid signature...");
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Cld-Timestamp": timestamp,
                "X-Cld-Signature": invalidSignature,
            },
            body: body,
        });
        
        const responseData = await response.json();
        
        console.log("Response Status:", response.status);
        console.log("Response Data:", JSON.stringify(responseData, null, 2));
        
        if (response.status === 401) {
            console.log("\n✅ Invalid signature test PASSED (correctly rejected)");
        } else {
            console.log("\n❌ Invalid signature test FAILED (should have been rejected)");
        }
    } catch (error) {
        console.error("\n❌ Error testing invalid signature:", error.message);
    }
}

// Run tests
async function runTests() {
    console.log("=".repeat(60));
    console.log("Cloudinary Webhook Test Suite");
    console.log("=".repeat(60));
    console.log();
    
    // Test 1: Valid webhook
    await testWebhook();
    
    console.log("\n" + "=".repeat(60) + "\n");
    
    // Test 2: Invalid signature
    await testInvalidSignature();
    
    console.log("\n" + "=".repeat(60));
    console.log("Tests completed");
    console.log("=".repeat(60));
}

// Check if fetch is available (Node 18+)
if (typeof fetch === "undefined") {
    console.error("Error: This script requires Node.js 18+ with native fetch support");
    console.error("Or install node-fetch: npm install node-fetch");
    process.exit(1);
}

runTests().catch(console.error);
