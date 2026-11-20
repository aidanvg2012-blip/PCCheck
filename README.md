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

## New research tools

- Price Tracker: browse weekly component references, run exact-model live retailer checks for Plus accounts when API.SH is configured, and keep a local manual watchlist. Live checks are provider-credit-limited and do not promise automatic alerts.
- Hardware knowledge base: searchable explainers for CPUs, GPUs, RAM, storage, power, cooling, compatibility, laptops, and used-PC buying.
- My Rig: a Plus-only, user-triggered local Windows hardware inventory via the desktop app. Hardware scan data is not uploaded to PCCheck.
- Windows desktop installer: an Electron x64 wrapper around the hosted PCCheck site. It requires an internet connection and does not bundle a separate offline copy of the service. Releases are published through GitHub Releases.

## Development

- Static front end: `index.html`, `styles.css`, `app.js`, `ui.js`
- Vercel API: `api/market-prices.js`
- Automated checks: `node --test tests/*.test.js`

See `ACCOUNT_BETA_SETUP.md` for Preview and account/billing beta checks. See `MONETIZATION_SETUP.md` for parent-managed AdSense and desktop release setup. Stripe remains test-mode only; do not enable live payments from this branch.
