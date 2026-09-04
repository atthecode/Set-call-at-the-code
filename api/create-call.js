const CALLE_BASE_URL = "https://api.heycall-e.com";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const apiKey = process.env.CALLE_API_KEY;
  if (!apiKey) {
    return json(res, 503, {
      configured: false,
      error: "CALL-E NOT CONFIGURED",
      message: "Add CALLE_API_KEY as a server-side environment variable before placing real calls."
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); }
    catch { return json(res, 400, { error: "Invalid JSON" }); }
  }

  const {
    confirmed,
    phone,
    projectName,
    sceneBrief,
    venueName,
    shootDateTime,
    duration,
    crewSize,
    childrenInvolved,
    notes,
    callGoals = []
  } = body || {};

  if (confirmed !== true) {
    return json(res, 400, { error: "Explicit confirmation is required before a real call." });
  }

  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
    return json(res, 400, { error: "Use an E.164 phone number, for example +442012345678." });
  }

  if (!venueName) {
    return json(res, 400, { error: "Venue/location name is required." });
  }

  const goals = callGoals.length
    ? callGoals.join(", ")
    : "filming permission, availability, hire cost and decision-maker details";

  const task = [
    `You are calling ${venueName} on behalf of an independent filmmaker for a legitimate location-scouting enquiry.`,
    `Project: ${projectName || "Untitled production"}.`,
    `Scene brief: ${sceneBrief || "Not provided"}.`,
    `Proposed shoot: ${shootDateTime || "Date/time to be confirmed"}.`,
    `Expected duration: ${duration || "Not provided"}. Crew size: ${crewSize || "Not provided"}.`,
    `Children/minors involved: ${childrenInvolved ? "yes" : "no"}.`,
    `Ask about: ${goals}.`,
    notes ? `Additional notes: ${notes}.` : "",
    "Be transparent that you are an AI voice agent calling on behalf of a filmmaker.",
    "Do not pressure the recipient. If they decline, end politely.",
    "Do not agree to binding terms, make payments, or claim a booking is confirmed.",
    "Collect factual information and a suitable human follow-up contact."
  ].filter(Boolean).join(" ");

  const recipient_result_schema = {
    type: "object",
    properties: {
      venue_name: { type: "string" },
      availability: { type: "string" },
      estimated_cost: { type: "string" },
      filming_permission: { type: "string", enum: ["yes", "no", "conditional", "unknown"] },
      restrictions: { type: "string" },
      children_rules: { type: "string" },
      accessibility: { type: "string" },
      parking_loading: { type: "string" },
      power_wifi: { type: "string" },
      insurance_permits: { type: "string" },
      decision_maker: { type: "string" },
      follow_up: { type: "string" }
    },
    additionalProperties: false
  };

  const payload = {
    task,
    recipients: [{
      phones: [phone],
      region: "GB",
      locale: "en-GB"
    }],
    recipient_result_schema,
    metadata: {
      product: "SetCall @ THE CODE",
      project_name: projectName || "Untitled production",
      venue_name: venueName
    }
  };

  try {
    const response = await fetch(`${CALLE_BASE_URL}/v1/calls`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `setcall_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return json(res, response.status, {
        error: "CALL-E request failed",
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