const { getPublicConfig, handleOptions, sendJson } = require("./_paypal");

module.exports = async function handler(req, res) {
    if (handleOptions(req, res)) return;
    if (req.method !== "GET") {
        return sendJson(res, 405, { error: "Method not allowed" });
    }

    const config = getPublicConfig();
    return sendJson(res, 200, {
        clientId: config.clientId,
        configured: config.configured,
        currency: config.currency,
        env: config.env,
        price: config.price
    });
};
