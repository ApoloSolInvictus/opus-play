const crypto = require("node:crypto");

const DEFAULT_PRICE = "1.77";
const DEFAULT_CURRENCY = "USD";

function getPaypalEnv() {
    return String(process.env.PAYPAL_ENV || "sandbox").toLowerCase() === "live" ? "live" : "sandbox";
}

function getPaypalBaseUrl() {
    return getPaypalEnv() === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";
}

function getPublicConfig() {
    const clientId = process.env.PAYPAL_CLIENT_ID || "";
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
    return {
        clientId,
        configured: Boolean(clientId && clientSecret),
        currency: process.env.PAYPAL_CURRENCY || DEFAULT_CURRENCY,
        env: getPaypalEnv(),
        price: process.env.SONG_PRICE_USD || DEFAULT_PRICE
    };
}

function sendJson(res, status, payload) {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(payload));
}

function handleOptions(req, res) {
    if (req.method !== "OPTIONS") return false;
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.end();
    return true;
}

async function readJsonBody(req) {
    if (req.body && typeof req.body === "object") return req.body;
    if (typeof req.body === "string") return JSON.parse(req.body || "{}");

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8");
    return raw ? JSON.parse(raw) : {};
}

function sanitizeText(value, maxLength = 120) {
    return String(value || "")
        .replace(/[<>]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength);
}

function normalizeTrackId(value) {
    const id = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
    return id || "";
}

async function getAccessToken() {
    const { clientId, configured } = getPublicConfig();
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";

    if (!configured) {
        const error = new Error("PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in Vercel.");
        error.statusCode = 503;
        throw error;
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(`${getPaypalBaseUrl()}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) {
        const error = new Error(data.error_description || data.error || "Could not authenticate with PayPal.");
        error.statusCode = response.status || 502;
        throw error;
    }

    return data.access_token;
}

function paypalRequestId(prefix = "aipod") {
    return `${prefix}-${Date.now()}-${crypto.randomUUID()}`;
}

module.exports = {
    getAccessToken,
    getPaypalBaseUrl,
    getPublicConfig,
    handleOptions,
    normalizeTrackId,
    paypalRequestId,
    readJsonBody,
    sanitizeText,
    sendJson
};
