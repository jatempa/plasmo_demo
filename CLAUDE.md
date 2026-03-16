# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with hot reload (loads unpacked in Chrome)
npm run build     # Production build → build/chrome-mv3-prod/
npm run package   # Package extension for Chrome Web Store submission
```

No test runner is configured. Code formatting uses Prettier — config in `.prettierrc.mjs` (no semicolons, 2-space indent, 80 char width, import sorting).

## File Structure

```
admire-showy-owl/
├── assets/
│   └── icon.png
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx        # Bottom navigation bar (Home, Products)
│   │   ├── CircularProgress.tsx # Countdown progress indicator
│   │   └── ProfileDropdown.tsx  # User profile dropdown with logout
│   ├── pages/
│   │   ├── HomePage.tsx         # Scraped products display
│   │   └── MyProductsPage.tsx   # Saved products list
│   ├── services/
│   │   └── auth0.ts             # Auth0 PKCE flow via chrome.identity
│   ├── utils/
│   │   └── svgs.tsx             # SVG icon components
│   ├── background.ts            # Service worker
│   ├── content.tsx              # Content script (injected into pages)
│   ├── sidepanel.tsx            # Side panel UI (main interface)
│   └── style.css                # Styles for content script & side panel
├── popup.tsx              # Extension popup (minimal)
├── package.json           # Dependencies, scripts, manifest config
├── tsconfig.json          # TypeScript config (includes ~ alias)
└── .prettierrc.mjs        # Prettier formatting config
```

Build output goes to `build/chrome-mv3-dev/` (dev) and `build/chrome-mv3-prod/` (production).

## Architecture

This is a **Chrome Extension (Manifest V3)** built with the [Plasmo](https://docs.plasmo.com/) framework and React 18. Plasmo handles bundling (via Parcel), manifest generation, and hot reload.

### Extension contexts and their roles

| File | Chrome Context | Purpose |
|---|---|---|
| `src/background.ts` | Service Worker | Message router between content script and side panel |
| `src/content.tsx` | Content Script | Injected into all pages; renders floating button, scrapes products |
| `src/sidepanel.tsx` | Side Panel | Main UI — login, auto-scrape display, saved products, navigation |
| `popup.tsx` | Popup | Minimal, not actively used |

### Data flow

1. **Content script** scrapes product data (title, price, image) from the host page using generic CSS selectors and saves to `@plasmohq/storage` under key `"scraped_data"`.
2. **Side panel** reads from storage to display products, and sends `scrape_products` messages to the content script to trigger on-demand scraping.
3. **Background** maintains a `Map<windowId, port>` to route `toggle_side_panel` and `close_panel` messages between the two contexts.

### Storage

Uses `@plasmohq/storage` (wrapper around `chrome.storage`):
- `"auth_session"` — Auth0 session (access token, id token, expiry, user profile)
- `"scraped_data"` — products scraped from the current page
- `"saved_products"` — user-saved products, persisted across sessions

### Authentication

Uses Auth0 PKCE flow via `chrome.identity.launchWebAuthFlow`. Requires a `.env` file with:

```
PLASMO_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
PLASMO_PUBLIC_AUTH0_CLIENT_ID=your-client-id
PLASMO_PUBLIC_AUTH0_AUDIENCE=your-api-audience  # optional
```

The extension's redirect URI (shown in Auth0 error messages and returned by `getAuth0RedirectUri()`) must be added as an allowed callback URL in the Auth0 dashboard. Sessions are persisted in storage under `"auth_session"` and validated by expiry.

### Side panel features

- Auth0 login via `chrome.identity` (PKCE); session stored and validated on load
- Auto-scrapes every 15 seconds after login or tab navigation (circular progress indicator shows countdown)
- React Router (`MemoryRouter`) powers two pages: Home (`/`), My Products (`/my-products`)
- Tab switch and navigation resets the scrape timer

### Plasmo conventions

- Path alias `~/*` resolves to the project root (configured in `tsconfig.json`)
- CSS in `src/style.css` is injected via `cssText` in the content script
- Plasmo auto-generates `manifest.json`; permissions (`identity`, `storage`, `sidePanel`) and host permissions (`<all_urls>`) are declared in `package.json` under `"manifest"`
