const CALLE_BASE_URL = "https://api.heycall-e.com";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });

async function createCall(request, env) {
  if (!env.CALLE_API_KEY) {
    return json({
      configured: false,
      error: "CALL-E NOT CONFIGURED",
      message: "Add CALLE_API_KEY as a Cloudflare Worker secret before placing real calls."
    }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
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
    return json({ error: "Explicit confirmation is required before a real call." }, 400);
  }

  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
    return json({ error: "Use an E.164 phone number, for example +442012345678." }, 400);
  }

  if (!venueName) {
    return json({ error: "Venue/location name is required." }, 400);
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
        authorization: `Bearer ${env.CALLE_API_KEY}`,
        "content-type": "application/json",
        "idempotency-key": `setcall_${crypto.randomUUID()}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return json({
        error: "CALL-E request failed",
        status: response.status,
        details: data
      }, response.status);
    }

    return json({ configured: true, call: data });
  } catch (error) {
    return json({
      error: "Unable to reach CALL-E",
      message: error?.message || "Unknown error"
    }, 500);
  }
}

async function callStatus(request, env) {
  if (!env.CALLE_API_KEY) {
    return json({ configured: false, error: "CALL-E NOT CONFIGURED" }, 503);
  }

  const url = new URL(request.url);
  const callId = url.searchParams.get("call_id");

  if (!callId || !/^[A-Za-z0-9_-]+$/.test(callId)) {
    return json({ error: "Valid call_id required" }, 400);
  }

  try {
    const response = await fetch(
      `${CALLE_BASE_URL}/v1/calls/${encodeURIComponent(callId)}`,
      {
        headers: {
          authorization: `Bearer ${env.CALLE_API_KEY}`
        }
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return json({
        error: "CALL-E status request failed",
        status: response.status,
        details: data
      }, response.status);
    }

    return json({ configured: true, call: data });
  } catch (error) {
    return json({
      error: "Unable to reach CALL-E",
      message: error?.message || "Unknown error"
    }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/create-call") {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      return createCall(request, env);
    }

    if (url.pathname === "/api/call-status") {
      if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
      return callStatus(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
