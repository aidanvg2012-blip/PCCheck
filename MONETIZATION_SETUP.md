# PCCheck monetization and desktop release

## Google AdSense — parent/guardian-managed

The PCCheck user is under 18. Google requires an AdSense publisher to be at least 18. A parent or guardian must create and own the AdSense account using their own Google Account, accept the terms, provide payment/tax information, and receive any earnings. Do not create an AdSense account in the minor's name.

Google's current requirements:
- The site needs original, useful content and must comply with AdSense program policies.
- Google reviews the whole site before ads can be served.
- A site may take several days, and sometimes 2–4 weeks, to be reviewed.
- If the site serves users in the EEA, UK, or Switzerland, review Google's certified CMP / TCF consent requirements before serving personalized ads in those regions.

### Current code behavior

- Ad code is disabled by default. No ads load until a valid publisher ID and ad-unit IDs are added to `ads-config.js`.
- Ads are restricted to the production host `pccheck.vercel.app`; Preview deployments never load AdSense.
- Ad slots are clearly labeled and placed on the homepage, Knowledge Base, Buyer Guides, and Price Tracker. No ad slot is placed beside a button or form control.
- The implementation uses manually assigned responsive ad units, not automatic placements.

### Parent setup after approval

1. Parent/guardian creates and verifies their own AdSense account.
2. Add `pccheck.vercel.app` in AdSense and complete the site's review process.
3. Create responsive display ad units for the keys `home`, `knowledge`, `guides`, and `tracker`.
4. Copy the publisher ID (`ca-pub-...`) and each ad-unit slot ID into `ads-config.js`. These are public identifiers, not secrets.
5. Copy the exact ads.txt seller record Google provides into a root-level `ads.txt` file. Do not publish the placeholder example as a real seller record.
6. Review the privacy policy, consent configuration, and actual rendered placements before enabling ads.
7. Test the production site only after approval. Never click your own ads or ask visitors to click them.

Do not estimate income from traffic alone. Revenue depends on eligible impressions, visitor geography, advertiser demand, ad viewability, and policy compliance. AdSense approval and revenue are not guaranteed.

## Windows installer publishing

- The Windows x64 app is built with Electron and the local-only `systeminformation` inventory dependency.
- The app requires an internet connection for the hosted PCCheck website.
- A release is published when a reviewed `desktop-v*` Git tag is pushed after the desktop build has been tested.
- GitHub Actions builds the NSIS x64 installer and attaches the `.exe` to a GitHub Release.
- The Download page links to the official GitHub Releases page. Do not publish an installer until the local scan, login, billing isolation, and Windows installation/uninstallation have been tested.
- The initial installer is unsigned. Windows SmartScreen may warn users. A code-signing certificate would be a separate parent-managed cost.

## My Rig privacy and Plus access

- My Rig is a Plus feature and checks membership through the server-side Plus status endpoint.
- The scan starts only after the user presses the button.
- CPU, graphics, memory, drives, motherboard, BIOS, OS, network adapter labels, and Bluetooth device names/status are read locally by the Windows desktop app.
- The scan response is sent only to the local renderer process. It is not uploaded to PCCheck APIs or stored in Supabase.
- Bluetooth device names can be identifying; users should review the list before sharing screenshots.
- Windows does not reliably expose PSU, case, CPU cooler, monitor, keyboard, or mouse models. Those can be added manually and are stored in local browser storage.
- This is a hardware inventory snapshot, not continuous temperature, fan, voltage, clock, or power monitoring.
