# PCCheck

PCCheck is a responsive PC hardware research platform for used-PC buyers and custom builders.

## Main tools

- Used gaming PC listing assessment, text extraction, and on-device screenshot OCR.
- Build compatibility checks and a guided Build Finder.
- Weekly component price references plus optional exact-model retailer lookups.
- Searchable hardware knowledge base and buyer guides.
- Local saved reports and PCCheck Plus comparison workspace.
- My Rig: Plus-only Windows hardware inventory, with manual entries for components Windows cannot identify.
- Windows x64 desktop app, distributed through the official GitHub Releases page.

## Market price data

The market lookup uses the weekly US retail dataset published by Pricify (pricify.ai), licensed CC BY 4.0. The catalog covers selected products; prices are weekly observations rather than a live second-by-second feed. An unmatched model is left unpriced. Optional live retailer checks depend on parent/guardian-managed API.SH configuration and provider limits.

The combined part total is a **new retail replacement-cost reference**, not a used-market valuation. Used resale value depends on age, condition, warranty, location, and recent sold listings. PCCheck does not claim to verify sold prices.

## My Rig and desktop app

My Rig requests a scan only after the user presses the button. The Windows desktop app reads CPU, graphics, RAM modules, storage, motherboard, BIOS, operating system, network adapter labels, display information, and Windows Bluetooth device names/status. The snapshot is cached in local browser storage on that device. It is not uploaded to PCCheck servers or stored in Supabase. PSU, case, cooler, and peripherals can be added manually.

This is a hardware inventory snapshot, not continuous sensor monitoring. The desktop app wraps the hosted PCCheck site and requires an internet connection.

## Monetization

Google AdSense is disabled by default and only loads on the production host after a parent/guardian configures an approved publisher account and ad-unit IDs. See `MONETIZATION_SETUP.md`. The user is under 18; the AdSense account and payments must be owned and managed by a parent or guardian.

## Development

- Static front end: `index.html`, `styles.css`, `app.js`, `ui.js`
- Vercel API: `api/`
- Automated checks: `node --test tests/*.test.js`
- Windows desktop release: push a reviewed `desktop-v*` tag to build and publish the installer.

See `ACCOUNT_BETA_SETUP.md` for Preview and billing checks, and `MONETIZATION_SETUP.md` for AdSense and desktop release setup. Do not enable live billing or publish a desktop release until the parent/guardian release review is complete.
