const CALLE_BASE_URL = "https://api.heycall-e.com";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  const apiKey = process.env.CALLE_API_KEY;
  if (!apiKey) {
    return json(res, 503, { configured: false, error: "CALL-E NOT CONFIGURED" });
  }

  const callId = req.query?.call_id;
  if (!callId || !/^[A-Za-z0-9_-]+$/.test(callId)) {
    return json(res, 400, { error: "Valid call_id required" });
  }

  try {
    const response = await fetch(
      `${CALLE_BASE_URL}/v1/calls/${encodeURIComponent(callId)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return json(res, response.status, {
        error: "CALL-E status request failed",
        details: data
      });
    }

    return json(res, 200, { configured: true, call: data });
  } catch (error) {
    return json(res, 500, {
      error: "Unable to reach CALL-E",
      message: error.message
    });
  }
}