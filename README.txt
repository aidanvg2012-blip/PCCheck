PCCheck — expanded early release
=================================

WHAT IS INCLUDED
- Used gaming PC review form with missing-information checks, buyer warnings, and a specification completeness indicator.
- Listing URL recognition for Facebook Marketplace, eBay, Craigslist, OfferUp, and other HTTP/HTTPS websites. The app does NOT scrape or import listing details.
- Custom build checker: CPU / motherboard socket comparison, DDR generation, RAM capacity, motherboard / case size, user-entered power estimate, GPU length clearance, and CPU cooler height clearance.
- Explicit warnings for items that still require exact manufacturer verification (CPU / BIOS support, PSU quality and connectors, storage slot details).
- Saved reports in this browser, with view/delete, export-all JSON, single-report JSON export, and print / save-as-PDF.
- Buyer guides, compatibility checklist, FAQ, privacy / limitations information.
- PWA manifest, SVG icon, and service worker for an installable/offline app shell when hosted over HTTPS or localhost.
- Responsive layout for mobile and desktop.

RUN LOCALLY
1. Extract the ZIP.
2. Open the PCCheck folder in a code editor.
3. For PWA testing, serve the folder from localhost (for example, VS Code Live Server). Opening index.html directly still runs the core app, but service workers do not run from file://.

PUBLISHING
- Upload the folder to a static host such as GitHub Pages, Netlify, or Vercel.
- Use HTTPS. Test on desktop and phone before sharing publicly.
- A static deployment does not create secure accounts or cloud storage.

IMPORTANT LIMITATIONS
- No secure user accounts, server, cloud synchronization, analytics, payments, or subscription system.
- No automatic marketplace listing extraction. Use only approved APIs / permitted integrations if adding this later; do not bypass login, CAPTCHA, or anti-bot controls.
- No live market pricing, used-PC valuation, benchmark database, or complete hardware compatibility database.
- Power figures are user-entered planning estimates. They do not evaluate PSU quality, transient behavior, or connectors.
- Basic socket / RAM / size comparisons are not a complete compatibility guarantee. Check exact model numbers, motherboard CPU support lists, BIOS version, case / cooler / GPU dimensions, storage lane sharing, and manufacturer documentation.
- Reports are stored only in the browser's local storage. They can be lost if browser data is cleared and are not available on other devices.

NEXT REAL PRODUCT MILESTONES
1. Build and test a verified component specification catalog with exact model identifiers and sources.
2. Add a backend for accounts, secure authentication, cloud reports, and user data deletion/export.
3. Add marketplace integrations only where APIs and terms permit them.
4. Add pricing data from a documented, licensed source and show dates, region, and confidence ranges.
5. Add automated tests, accessibility review, error reporting, and privacy policy before public launch.
