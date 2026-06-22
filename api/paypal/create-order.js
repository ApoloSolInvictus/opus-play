const {
    getAccessToken,
    getPaypalBaseUrl,
    getPublicConfig,
    handleOptions,
    normalizeTrackId,
    paypalRequestId,
    readJsonBody,
    sanitizeText,
    sendJson
} = require("./_paypal");

module.exports = async function handler(req, res) {
    if (handleOptions(req, res)) return;
    if (req.method !== "POST") {
        return sendJson(res, 405, { error: "Method not allowed" });
    }

    try {
        const body = await readJsonBody(req);
        const trackId = normalizeTrackId(body.trackId);
        if (!trackId) {
            return sendJson(res, 400, { error: "Missing trackId" });
        }

        const title = sanitizeText(body.title, 80) || `aiPod track ${trackId}`;
        const artist = sanitizeText(body.artist, 80) || "Invictus Records";
        const { currency, price } = getPublicConfig();
        const accessToken = await getAccessToken();

        const orderPayload = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    reference_id: `track-${trackId}`,
                    custom_id: `aipod-track-${trackId}`,
                    description: `${title} - ${artist}`.slice(0, 127),
                    amount: {
                        currency_code: currency,
                        value: price,
                        breakdown: {
                            item_total: {
                                currency_code: currency,
                                value: price
                            }
                        }
                    },
                    items: [
                        {
                            name: title.slice(0, 127),
                            description: `Compra digital aiPod 432Hz - ${artist}`.slice(0, 127),
                            sku: `aipod-${trackId}`,
                            quantity: "1",
                            category: "DIGITAL_GOODS",
                            unit_amount: {
                                currency_code: currency,
                                value: price
                            }
                        }
                    ]
                }
            ],
            application_context: {
                brand_name: "aiPod 432Hz",
                shipping_preference: "NO_SHIPPING",
                user_action: "PAY_NOW"
            }
        };

        const response = await fetch(`${getPaypalBaseUrl()}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "PayPal-Request-Id": paypalRequestId(`track-${trackId}`)
            },
            body: JSON.stringify(orderPayload)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return sendJson(res, response.status, {
                error: data.message || data.name || "PayPal order creation failed",
                details: data.details || []
            });
        }

        return sendJson(res, 200, {
            id: data.id,
            status: data.status,
            price,
            currency
        });
    } catch (error) {
        return sendJson(res, error.statusCode || 500, {
            error: error.message || "Unexpected PayPal error"
        });
    }
};
