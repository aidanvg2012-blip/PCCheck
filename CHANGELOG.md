# PCCheck 2.2.0

- Added a comparable-price chart and transparent recommendation using the asking price and 2–3 similar PC prices entered by the user. Uses the median to reduce the impact of one unusual comparison. It is not a live price feed.
- Added screenshot upload, preview, and in-browser OCR using Tesseract.js. OCR text can be reviewed/edited before hardware extraction. Images are processed in the browser and are not uploaded to PCCheck. OCR loads the external Tesseract.js library only when requested, so the rest of PCCheck works if OCR is unavailable.
- Fixed a startup-breaking issue caused by missing saved-report export/clear controls; the missing controls are now present and their handlers are optional-safe. This was preventing later app setup, including the paste parser, from initializing.
- Improved copy/paste parser for Intel/Ryzen CPUs, NVIDIA/AMD GPUs, RAM whether DDR type appears before or after capacity, and storage whether size appears before or after SSD/NVMe.
- Bumped service-worker cache to prevent older scripts from remaining cached.

## Limits
Price comparisons are only as good as the comparable prices the user enters. Use similar complete PCs and preferably recent sold prices where available. Hardware extraction is best-effort and should always be reviewed.


## 2.3.0 — Interface polish and reliability
- Refined typography, spacing, contrast, focus states, and restrained accent treatment.
- Added opt-in synthesized UI sounds, off by default, with a persistent header toggle.
- Added clipboard paste helper with permission-aware fallback messaging.
- Improved RAM/storage extraction variants and screenshot preview memory cleanup.
- Pinned Tesseract.js to 5.1.1 and hardened service-worker cache scope/update behavior.
- Removed external Google Fonts dependency; system fonts are used.
- Corrected report label and local workspace wording.
