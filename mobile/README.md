# PCCheck mobile prototype

This folder is a **native-app prototype scaffold**, not a finished store submission. It wraps the existing PCCheck web experience with Capacitor so the same app can be tested on Android and iOS.

## Requirements

- Node.js 22 or newer.
- Android: Android Studio and an Android SDK.
- iOS: a Mac with Xcode 26 or newer. Windows alone cannot build an iOS App Store binary.

## First setup

From this folder:

```sh
npm install
npm run add:android
# On a Mac, also run:
npm run add:ios
```

The prepare script copies the current root web app into `mobile/www`. The generated `android/` and `ios/` native projects are created locally by Capacitor and are intentionally not committed yet.

## Run and sync

```sh
npm run sync
npm run open:android
# On macOS:
npm run open:ios
```

Use Android Studio or Xcode to select a simulator/device and run the app. Test the manual forms, screenshot picker/OCR, report save/export, print/PDF behavior, keyboard resizing, safe areas, and offline behavior on real devices. Some browser behaviors (especially print and file downloads) may need native-specific handling.

## Before any store submission

- Replace the provisional app ID `com.pccheck.app` with a unique identifier you control.
- Create proper platform-sized PNG app icons and splash assets; the current SVG web icon is not a complete store asset set.
- Add native functionality and polish beyond a simple website wrapper. Apple may reject repackaged websites under App Review Guideline 4.2; Google Play also requires meaningful, stable functionality.
- Complete privacy disclosures, support/contact details, accessibility checks, device testing, store screenshots, and review notes.
- Do not add accounts, analytics, ads, or payment SDKs until their data handling and policies are properly implemented.
- Publishing requires developer accounts and agreements. Because the project owner is under 18, a parent/guardian must handle any account or legal agreement that requires an adult. Do not misstate age or ownership.

This prototype is not yet ready to upload to either store and no app-store listing or developer account has been created.
