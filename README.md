# SetCall @ THE CODE

SetCall is a CALL-E hackathon prototype for independent filmmakers and small production teams.

It turns a location-scouting brief into a real phone workflow:

**filmmaker brief → explicit human confirmation → CALL-E phone call → structured location report**

## Why it exists

Small filmmakers often spend hours making repetitive calls to potential locations just to answer basic production questions: filming permission, availability, cost, restrictions, insurance, accessibility and who can approve the shoot.

SetCall makes that phone work structured while keeping the filmmaker in control of whether a real call is placed.

## Working proof

On 4 September 2026, SetCall completed its first successful CALL-E proof-of-concept phone test from ChatGPT.

## Architecture

**Browser → Cloudflare Worker → CALL-E API**

The static app and API are served from one Cloudflare Worker project. The CALL-E key is stored only as the Worker secret `CALLE_API_KEY`.

Runtime routes:

- `POST /api/create-call` → creates a CALL-E task after explicit user confirmation
- `GET /api/call-status?call_id=...` → reads the CALL-E call result
- all other routes → static assets from `public/`

## Safety and human control

- A real call cannot start until the user checks an explicit confirmation box.
- CALL-E is instructed to identify itself as an AI voice agent calling on behalf of a filmmaker.
- The agent is instructed not to pressure recipients, make payments or agree to binding terms.
- Demo results are clearly labelled as sample data.
- Without the Worker secret, the app shows **CALL-E NOT CONFIGURED** rather than pretending a call worked.

## Cloudflare deployment

This repository is deliberately configured for Cloudflare Workers rather than a paid hosting platform.

1. In Cloudflare Workers & Pages, create/import a Worker from this GitHub repository.
2. Keep the project on the **Workers Free** plan if you do not want paid usage.
3. Set the deploy command to `npx wrangler deploy` if Cloudflare asks for one.
4. Add a Worker secret named `CALLE_API_KEY`.
5. Deploy.
6. Do not commit the real API key to GitHub.

The template variable name remains in `.env.example` for local development only.

## Project files

- `public/index.html` — mobile-first SetCall interface
- `src/worker.js` — Cloudflare Worker and secure CALL-E runtime integration
- `wrangler.toml` — Cloudflare Worker configuration
- `.env.example` — secret-name template

## Hackathon focus

SetCall is intentionally narrow: **location coordination for filmmakers**. It demonstrates a practical use of adaptive AI phone conversation where a rigid scripted bot is not enough.

Built for **CALL-E: Your Code Is Calling**.

## Licence

MIT.
