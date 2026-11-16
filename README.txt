PCCheck 2.1 — Hardware Recognition & Listing Text Import
========================================================

WHAT IS NEW IN 2.1
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
