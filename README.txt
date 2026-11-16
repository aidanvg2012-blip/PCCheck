PCCheck 2.4 — Mobile-ready cleanup
========================================================

WHAT IS NEW IN 2.2
- Curated CPU and GPU recognition catalog with common model aliases and shorthand.
- CPU/GPU autocomplete suggestions in both checkers.
- Canonicalizes recognized CPU/GPU names before assessment.
- New listing-text extraction: copy a public product/listing title and specifications, paste them into PCCheck, and extract recognized CPU, GPU, RAM, and storage fields.
- Service worker cache version updated so deployed browsers can receive the new app shell.

IMPORTANT LIMITATIONS
- Pasting a URL only recognizes its website/source. It does not fetch or scrape the page.
- Product pages often use scripts, login walls, anti-bot systems, and cross-origin restrictions. PCCheck does not bypass these.
- Listing-text extraction uses a local, curated model catalog. It will not recognize every CPU/GPU or every typo. Always review the extracted values.
- Unrecognized components should be entered manually. No unknown model is silently guessed.
- Compatibility checks remain rule-based estimates, not a substitute for manufacturer specifications.
- Saved reports are local to the current browser/device. There is no account system, cloud sync, or real subscription/payment processing.

RUN LOCALLY
1. Extract this ZIP.
2. Open the extracted folder in a code editor.
3. For local PWA testing, run a local web server (for example, VS Code Live Server).
4. Open the local HTTPS/localhost address in a supported browser.

DEPLOY
Upload the contents of this folder to the root of the GitHub repository.
Vercel should deploy the static site automatically when the main branch changes.

INSTALL
On a supported browser, open the deployed site and use the browser's Install App / Install PCCheck option if offered.
Service worker and manifest require HTTPS or localhost.

PRIVACY
The listing text parser runs in the browser. It does not send pasted text to an external service.
Saved reports use localStorage on this device/browser.


PCCheck 2.2 additions
- Price comparison: enter the asking price and at least two prices from similar systems. PCCheck charts these values and compares the asking price to the median. This is not live market data.
- Screenshot analyzer: choose a PNG/JPG/WEBP under 8 MB, read text in-browser, review/edit OCR text, then extract hardware. OCR loads Tesseract.js from jsDelivr only when requested and requires an internet connection; the rest of PCCheck works without OCR. Images are not uploaded to PCCheck.
- Improved pasted-text recognition: handles common alternate CPU/GPU naming and RAM/storage order variations. Always verify the extracted fields before using the report.

- Fixed an app initialization issue: the old script tried to attach event handlers to saved-report buttons that were not present in the page. That stopped later features from initializing, which could make paste extraction appear broken. The buttons are now included and the handlers are guarded.


PCCheck 2.3 — UI polish and reliability
- Refined the interface with a quieter, less-glossy visual style, improved focus states, and reduced-motion support.
- Added optional synthesized interface sounds. They are off by default, can be toggled in the header, and do not require audio files.
- Added a clipboard paste button as a convenience; normal Ctrl+V still works.
- Improved common RAM and storage text patterns and added safe feedback when browser clipboard access is blocked.
- Fixed screenshot preview URL cleanup and pinned the OCR library to a specific 5.x release.
- Reworked service-worker caching so it does not cache external sites or return the app HTML for failed third-party requests; it also activates updates more reliably.
- Removed the remote Google Fonts import. The interface now uses local system font stacks for faster loading and fewer external requests.


PCCheck 2.4 — Mobile-ready cleanup
- Removed the URL-only marketplace recognition panel. It only identified a host and never extracted listing data; paste text, screenshot OCR, and manual entry remain the supported workflows.
- Removed the decorative sound toggle and guest-account modal because neither added essential functionality. Local reports remain available without implying cloud accounts.
- Improved mobile navigation, form sizing, touch targets, and safe-area spacing.
- Added a separate Capacitor scaffold in /mobile for Android/iOS device prototyping. Native projects are generated locally and are not store-ready.
- Bumped the service-worker cache to v5 so browsers fetch the updated app shell.
