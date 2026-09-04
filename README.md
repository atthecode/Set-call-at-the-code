# SetCall @ THE CODE

SetCall is a CALL-E hackathon prototype for independent filmmakers and small production teams.

It turns a location-scouting brief into a real phone workflow:

**filmmaker brief → explicit human confirmation → CALL-E phone call → structured location report**

## Why it exists

Small filmmakers often spend hours making repetitive calls to potential locations just to answer basic production questions: filming permission, availability, cost, restrictions, insurance, accessibility and who can approve the shoot.

SetCall makes that phone work structured while keeping the filmmaker in control of whether a real call is placed.

## Working proof

On 4 September 2026, SetCall completed its first successful CALL-E proof-of-concept phone test from ChatGPT. The repository now contains the web workflow that connects a filmmaker brief to CALL-E and returns structured location information.

## CALL-E integration

The app calls CALL-E from server-side functions only. `CALLE_API_KEY` is never exposed to browser code.

Runtime integration:

- `POST /api/create-call.js` → `POST https://api.heycall-e.com/v1/calls`
- `GET /api/call-status.js` → `GET https://api.heycall-e.com/v1/calls/{call_id}`

The create-call endpoint requests structured location information including availability, filming permission, estimated cost, restrictions, accessibility, parking/loading, insurance/permits and decision-maker information.

## Safety and human control

- A real call cannot start until the user checks an explicit confirmation box.
- CALL-E is instructed to identify itself as an AI voice agent calling on behalf of a filmmaker.
- The agent is instructed not to pressure recipients, make payments or agree to binding terms.
- Demo results are clearly labelled as sample data.
- Without a server-side API key, the app deliberately shows **CALL-E NOT CONFIGURED** rather than pretending a call worked.

## Deploy

This prototype is designed for Vercel serverless functions.

1. Import this GitHub repository into Vercel.
2. Add `CALLE_API_KEY` as a server-side environment variable.
3. Deploy.
4. Open the app, create a location brief and explicitly approve the specific call.

A template variable name is included in `.env.example`; never commit a real API key.

## Project files

- `index.html` — mobile-first SetCall interface
- `api/create-call.js` — secure CALL-E call creation endpoint
- `api/call-status.js` — secure CALL-E result/status endpoint
- `.env.example` — environment-variable template

## Hackathon focus

SetCall is intentionally narrow: **location coordination for filmmakers**. It demonstrates a practical use of adaptive AI phone conversation where a rigid scripted bot is not enough.

Built for **CALL-E: Your Code Is Calling**.

## Licence

MIT.
