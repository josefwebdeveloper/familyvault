# FamilyVault Browser Extension

Autofill login forms using your unlocked FamilyVault.

## Install (Chrome / Edge / Brave)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this `extension/` folder

## How to use

1. Sign in and **unlock** FamilyVault in your browser (same browser profile)
2. Go to any login page (e.g. Bringoz)
3. Click the green **🔒 FamilyVault** button (bottom-right) or the extension icon
4. Pick your saved account → **Autofill this tab**

Credentials are sent only from the FamilyVault popup to the same tab via `postMessage` — never stored in the extension.

## Local dev

Change `APP_ORIGIN` in `content.js` and `background.js` to `http://localhost:3000`.
