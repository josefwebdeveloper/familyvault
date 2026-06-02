# FamilyVault

**FamilyVault** is a private/family password manager that helps you stop reusing the same password everywhere. It guides you step by step toward unique, strong passwords — with all secrets encrypted on your device before anything is saved to the cloud.

## What is FamilyVault?

FamilyVault is not just password storage. Its core value is the **Password Detox wizard**: a guided flow that prioritizes your most critical accounts (email, banking, cloud, developer tools) and walks you through replacing weak or reused passwords one at a time.

Features:

- **Client-side encryption** — passwords, notes, backup codes encrypted in your browser
- **Google Auth** — sign in with Google; master vault password for encryption
- **Personal, Family, Developer, Emergency vaults**
- **Security dashboard** — score, reuse detection, 2FA/passkey checklist
- **Password generator** — configurable strong passwords
- **Encrypted backup** — export/import encrypted JSON
- **Auto-lock** — clears decrypted data from memory after inactivity

## Why Client-Side Encryption?

The server (Firebase/Firestore) **never sees plaintext secrets**. Your master password derives a key locally (PBKDF2 + SHA-256). A random vault key encrypts all item payloads (AES-GCM 256-bit). Only encrypted blobs and non-secret metadata are stored remotely.

```
Master Password → PBKDF2 → Derived Key → decrypts → Vault Key
Vault Key → AES-GCM → encrypts → { password, notes, backupCodes, ... }
```

## Setup

### Prerequisites

- Node.js 20+
- Firebase project with Google Auth and Firestore enabled

### 1. Clone and install

```bash
git clone <repo-url>
cd familyvault
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Firebase config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### 3. Firebase setup

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication → Google** sign-in provider
3. Create a **Firestore** database (production mode)
4. Add your app (Web) and copy config values to `.env.local`
5. Add `localhost` to authorized domains for local dev

### 4. Deploy Firestore rules

```bash
npm install -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```

Rules file: `firestore.rules`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Run tests

```bash
npm test
```

## Vercel Deployment

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables
4. Deploy
5. Add your Vercel domain to Firebase Auth authorized domains

## Security Architecture

| Layer | Implementation |
|-------|---------------|
| Auth | Firebase Google Auth |
| Key derivation | PBKDF2-SHA256, 310,000 iterations |
| Encryption | AES-GCM 256-bit, 96-bit IV |
| Vault key | Random 256-bit key, encrypted by derived key |
| Storage | Firestore (encrypted payloads + metadata) |
| Memory | Decrypted data only in React state; cleared on lock |
| Clipboard | Auto-clear after 30 seconds (best effort) |
| Auto-lock | Configurable 1–30 minutes inactivity |

**Future:** Argon2id can replace PBKDF2. WebAuthn/passkeys planned for Phase 2.

## MVP Limitations

- **Master password cannot be recovered.** If forgotten, encrypted data is permanently inaccessible.
- **Metadata is not encrypted.** Titles, categories, URLs, usernames may be visible in Firestore.
- **Browser security matters.** XSS in the browser could expose decrypted data in memory.
- **Simple family sharing.** Both members share the family vault password (Phase 2: per-user encrypted keys).
- **Not audited.** This is a private/family MVP, not enterprise-grade security software.
- **Plaintext export disabled.** Only encrypted backup is supported.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for full details.

## Known Risks

1. Forgetting the master password → total data loss
2. Firebase account compromise → attacker gets encrypted blobs (still need master password)
3. XSS on the web app → potential memory exposure while vault is unlocked
4. Metadata leakage → account titles/categories visible to Firebase admins
5. No breach monitoring (Watchtower-style) in MVP

## Project Structure

```
src/
├── app/                  # Next.js pages
├── components/           # UI components
├── lib/
│   ├── crypto/           # Web Crypto (PBKDF2, AES-GCM)
│   ├── firebase/         # Auth + Firestore
│   ├── security/         # Scoring, reuse detection
│   ├── validation/       # Zod schemas
│   └── vault/            # Encrypt/decrypt service
├── stores/               # Zustand state
└── types/                # TypeScript types
```

## License

Private use. Not for production SaaS without professional security audit.
