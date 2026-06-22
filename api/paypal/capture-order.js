const {
    getAccessToken,
    getPaypalBaseUrl,
    handleOptions,
    readJsonBody,
    sendJson
} = require("./_paypal");

module.exports = async function handler(req, res) {
    if (handleOptions(req, res)) return;
    if (req.method !== "POST") {
        return sendJson(res, 405, { error: "Method not allowed" });
    }

    try {
        const body = await readJsonBody(req);
        const orderID = String(body.orderID || body.orderId || "").replace(/[^A-Z0-9]/gi, "");
        if (!orderID) {
            return sendJson(res, 400, { error: "Missing orderID" });
        }

        const accessToken = await getAccessToken();
        const response = await fetch(`${getPaypalBaseUrl()}/v2/checkout/orders/${orderID}/capture`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return sendJson(res, response.status, {
                error: data.message || data.name || "PayPal capture failed",
                details: data.details || []
            });
        }

        return sendJson(res, 200, {
            id: data.id,
            status: data.status,
            payer: data.payer || null,
            purchase_units: data.purchase_units || []
        });
    } catch (error) {
        return sendJson(res, error.statusCode || 500, {
            error: error.message || "Unexpected PayPal capture error"
        });
    }
};
