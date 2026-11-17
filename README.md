# PCCheck

PCCheck is a responsive, tabbed PC buying and build-checking workspace.

## Main tools

- Used gaming PC assessment with listing text extraction and on-device screenshot OCR.
- Current new-retail component price references for exact CPU, GPU, RAM, storage, motherboard, PSU, and case models.
- Custom build compatibility checks.
- Local saved reports, export, print, and Plus comparison workspace.

## Market price data

The market lookup uses the weekly US retail dataset published by Pricify (pricify.ai), licensed CC BY 4.0. PCCheck credits the source in its report and links to the matched product record. The dataset tracks selected popular products, not every component, and prices are weekly observations rather than a live second-by-second feed. An unmatched model is left unpriced.

The combined part total is a **new retail replacement-cost reference**, not a used-market valuation. Used resale value depends on age, condition, warranty, location, and recent sold listings. PCCheck does not claim to verify sold prices.

## Development

- Static front end: `index.html`, `styles.css`, `app.js`, `ui.js`
- Vercel API: `api/market-prices.js`
- Automated checks: `node --test tests/*.test.js`

See `ACCOUNT_BETA_SETUP.md` for Preview and account/billing beta checks. Stripe remains test-mode only; do not enable live payments from this branch.
