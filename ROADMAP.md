# FamilyVault Roadmap

## Phase 1 — MVP (Current)

- [x] Google Auth
- [x] Master password vault unlock
- [x] Client-side encryption (PBKDF2 + AES-GCM)
- [x] Encrypted vault with personal/family/developer/emergency vaults
- [x] Add / edit / delete encrypted items
- [x] Password generator
- [x] Security dashboard with local scoring
- [x] Password Detox wizard
- [x] Family vault simple sharing mode
- [x] Encrypted backup export/import
- [x] Auto-lock + clipboard safety
- [x] PWA manifest
- [x] Dark theme support
- [x] Settings (auto-lock, theme, change master password)

## Phase 2 — Enhanced Security & Sharing

- [ ] Passkeys / WebAuthn login and vault unlock
- [ ] Per-user encrypted vault keys (public/private key architecture)
- [ ] Argon2id KDF (replace PBKDF2 via WASM)
- [ ] Mobile PWA improvements (offline shell, install prompts)
- [ ] Browser extension for autofill
- [ ] Encrypted file upload (Firebase Storage)
- [ ] Password history (encrypted previous password fingerprints)
- [ ] Rotation reminders and scheduled notifications
- [ ] Russian / Hebrew localization
- [ ] CSV import from browser password managers (local processing only)

## Phase 3 — Advanced Features

- [ ] Native mobile apps (iOS / Android)
- [ ] Emergency access (time-delayed vault access for family)
- [ ] Shared recovery workflows
- [ ] Breach alerts (Watchtower-style, privacy-preserving)
- [ ] Passkey management dashboard
- [ ] Secure document OCR (local-only processing)
- [ ] Hardware security key support
- [ ] Professional security audit

## Family Sharing Architecture (Phase 2)

Current (MVP): Simple shared master password for family vault.

Planned:

```
Each user:
  - Personal master password → derives personal key
  - Device generates RSA/EC key pair
  - Public key stored in Firestore
  - Private key encrypted by personal master password

Each vault:
  - Random vaultKey generated
  - vaultKey encrypted separately for each member's public key
  - Member decrypts vaultKey with their private key
```

## Crypto Migration Path

```
MVP:     PBKDF2-SHA256 (310k iterations) + AES-GCM-256
Phase 2: Argon2id (via argon2-browser WASM) + AES-GCM-256
         Migration: re-encrypt vault key on next unlock
```

## Security Audit Checklist (Pre-SaaS)

- [ ] Third-party penetration test
- [ ] Code audit of crypto implementation
- [ ] XSS/CSRF review
- [ ] Firestore rules audit
- [ ] Threat modeling session
- [ ] Bug bounty program
