# NJ Oil Tank Removal — Programmatic SEO Site

## Overview
A complete programmatic SEO site targeting oil tank removal searches across all 21 New Jersey counties and 561 municipalities. Built with Astro + Cloudflare Pages for zero hosting cost and maximum performance.

## Site Structure
- **587 total pages** built at compile time
- **1 homepage** — statewide targeting
- **21 county pages** — e.g., `/counties/bergen-county/`
- **561 town pages** — e.g., `/counties/bergen-county/hackensack/`
- **Cost guide** — `/cost/` (targets "how much does oil tank removal cost NJ")
- **Process page** — `/process/` (HowTo schema)
- **Regulations page** — `/regulations/` (E-E-A-T authority builder)
- **Counties index** — `/counties/`

## SEO Features
- Unique title, meta description, H1, and canonical URL per page
- LocalBusiness schema on every page
- FAQPage schema on every page (5 unique FAQs per town)
- HowTo schema on process page
- Localized cost ranges by county (Bergen/Hudson/Essex at +15-20%)
- Localized permit notes per county
- Varied intro copy by town tier (large/medium/small) to avoid duplication

## Deployment (Cloudflare Pages)
1. Push this repo to GitHub
2. Connect to Cloudflare Pages
3. Build command: `npm run build`
4. Output directory: `dist`
5. Node version: 18+

**Cost: $0/month** (Cloudflare free tier handles 500k requests/month)

## Call Routing Server
See `/call-routing/` directory.

### Setup
```bash
cd call-routing
npm install
cp .env.example .env
# Fill in your Twilio credentials and contractor number
node server.js
```

### Deploy
Deploy to Railway.app or Render.com (both have free tiers sufficient for this volume).
Set the `BASE_URL` env variable to your deployed URL, then update your Twilio phone number webhook to `https://your-url.com/incoming`.

### Monthly Billing
```bash
curl -H "X-Api-Key: your_key" https://your-url.com/report/month/2026-05
```
Returns total calls, connected calls, and duration for the month.

## Twilio Setup
1. Buy a local NJ number at twilio.com (~$1.15/month)
2. Set the number's "A call comes in" webhook to: `https://your-call-server.com/incoming`
3. Set method to POST
4. Update `CONTRACTOR_NUMBER` in `.env` to the contractor's real number

## Next Steps
1. Register `oiltankremovalnj.com` (~$12/year)
2. Deploy site to Cloudflare Pages (free)
3. Deploy call routing server to Railway (free tier)
4. Buy Twilio NJ tracking number ($1.15/month)
5. Find 1-2 NJDEP-certified contractors in NJ willing to pay per qualified call
6. Submit sitemap to Google Search Console
7. Build 10-15 backlinks from NJ real estate and environmental blogs
8. Add GEO layer (Speakable schema, HowTo schema, AggregateRating schema)

## Total Monthly Cost
| Item | Cost |
|------|------|
| Domain | $1/month (~$12/year) |
| Cloudflare Pages hosting | $0 |
| Call routing server (Railway) | $0 (free tier) |
| Twilio number | $1.15/month |
| Twilio per-minute charges | ~$0.02/min (paid by call volume) |
| **Total fixed cost** | **~$2.15/month** |

