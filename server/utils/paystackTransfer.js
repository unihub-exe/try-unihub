const axios = require("axios");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

/**
 * Create a transfer recipient on Paystack
 * @param {Object} details - Recipient details
 * @param {string} details.accountName - Account holder name
 * @param {string} details.accountNumber - Bank account number
 * @param {string} details.bankCode - Bank code (e.g., "058" for GTBank)
 * @returns {Promise<Object>} Recipient data with recipient_code
 */
async function createTransferRecipient(details) {
    try {
        const response = await axios.post(
            `${PAYSTACK_BASE_URL}/transferrecipient`,
            {
                type: "nuban",
                name: details.accountName,
                account_number: details.accountNumber,
                bank_code: details.bankCode,
                currency: "NGN"
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data.status) {
            return {
                success: true,
                recipientCode: response.data.data.recipient_code,
                data: response.data.data
            };
        } else {
            return {
                success: false,
                error: response.data.message
            };
        }
    } catch (error) {
        console.error("Create recipient error:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
}

/**
 * Initiate a transfer to a recipient
 * @param {Object} transferData
 * @param {string} transferData.recipientCode - Recipient code from createTransferRecipient
 * @param {number} transferData.amount - Amount in Naira (will be converted to kobo)
 * @param {string} transferData.reason - Transfer reason/description
 * @param {string} transferData.reference - Unique reference for the transfer
 * @returns {Promise<Object>} Transfer result
 */
async function initiateTransfer(transferData) {
    try {
        const response = await axios.post(
            `${PAYSTACK_BASE_URL}/transfer`,
            {
                source: "balance",
                amount: transferData.amount * 100, // Convert to kobo
                recipient: transferData.recipientCode,
                reason: transferData.reason,
                reference: transferData.reference
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data.status) {
            return {
                success: true,
                transferCode: response.data.data.transfer_code,
                reference: response.data.data.reference,
                data: response.data.data
            };
        } else {
            return {
                success: false,
                error: response.data.message
            };
        }
    } catch (error) {
        console.error("Initiate transfer error:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
}

/**
 * Verify a transfer status
 * @param {string} reference - Transfer reference
 * @returns {Promise<Object>} Transfer status
 */
async function verifyTransfer(reference) {
    try {
        const response = await axios.get(
            `${PAYSTACK_BASE_URL}/transfer/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                }
            }
        );

        if (response.data.status) {
            return {
                success: true,
                status: response.data.data.status, // 'success', 'pending', 'failed'
                data: response.data.data
            };
        } else {
            return {
                success: false,
                error: response.data.message
            };
        }
    } catch (error) {
        console.error("Verify transfer error:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
}

/**
 * Get list of banks supported by Paystack
 * @returns {Promise<Array>} List of banks with codes
 */
async function getBanks() {
    try {
        const response = await axios.get(
            `${PAYSTACK_BASE_URL}/bank`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                }
            }
        );

        if (response.data.status) {
            return {
                success: true,
                banks: response.data.data
            };
        } else {
            return {
                success: false,
                error: response.data.message
            };
        }
    } catch (error) {
        console.error("Get banks error:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
}

/**
 * Resolve account number to get account name
 * @param {string} accountNumber
 * @param {string} bankCode
 * @returns {Promise<Object>} Account details
 */
async function resolveAccountNumber(accountNumber, bankCode) {
    try {
        const response = await axios.get(
            `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                }
            }
        );

        if (response.data.status) {
            return {
                success: true,
                accountName: response.data.data.account_name,
                accountNumber: response.data.data.account_number
            };
        } else {
            return {
                success: false,
                error: response.data.message
            };
        }
    } catch (error) {
        console.error("Resolve account error:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
}

module.exports = {
    createTransferRecipient,
    initiateTransfer,
    verifyTransfer,
    getBanks,
    resolveAccountNumber
};
