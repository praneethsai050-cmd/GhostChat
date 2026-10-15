<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=15,19,25,29&height=220&section=header&text=GhostChat%20%F0%9F%91%BB&fontSize=48&fontAlignY=35&animation=twinkling&fontColor=ffffff" />
</p>

<p align="center">
  <b>Serverless • Peer-to-Peer • End-to-End Encrypted • 30s Ephemeral Chat</b><br>
  <i>Zero central servers, zero logs, zero phone numbers. Pure client-side cryptographic privacy in your browser.</i>
</p>

<p align="center">
  <a href="https://ghostchat-vjvj.onrender.com">
    <img src="https://img.shields.io/badge/Live_App-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black" />
  </a>
  <a href="https://praneethsai050-cmd.github.io/GhostChat/">
    <img src="https://img.shields.io/badge/Mirror-GitHub_Pages-10B981?style=for-the-badge&logo=googlechrome&logoColor=white" />
  </a>
  <a href="https://github.com/sponsors/praneethsai050-cmd">
    <img src="https://img.shields.io/badge/Sponsor-%E2%9D%A4-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" />
  </a>
  <a href="https://praneethsai050-cmd.github.io">
    <img src="https://img.shields.io/badge/Author-A._Praneeth_Sai-8B5CF6?style=for-the-badge&logo=shield&logoColor=white" />
  </a>
  <a href="https://wa.me/918777679256?text=Hi%20Praneeth%2C%20saw%20GhostChat%20and%20wanted%20to%20connect!">
    <img src="https://img.shields.io/badge/WhatsApp-+91_87776_79256-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" />
  </a>
  <a href="https://youtube.com/@flixyte">
    <img src="https://img.shields.io/badge/YouTube-@flixyte-FF0000?style=for-the-badge&logo=youtube&logoColor=white" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Web_Crypto_API-ECDH_(P--256)-10B981?style=flat-square" />
  <img src="https://img.shields.io/badge/Cipher-AES--256--GCM-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Transport-WebRTC_P2P_DataChannel-orange?style=flat-square&logo=webrtc&logoColor=white" />
  <img src="https://img.shields.io/badge/Voice_Notes-MediaRecorder_Encrypted-purple?style=flat-square" />
  <img src="https://img.shields.io/badge/Architecture-100%25_Serverless-emerald?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

---

## 📑 Table of Contents
- [Executive Overview](#-executive-overview)
- [The Problem with Centralized Messaging](#-the-problem-with-centralized-messaging)
- [Cryptographic Pipeline & Handshake Flow](#-cryptographic-pipeline--handshake-flow)
- [Key Features & Capabilities](#-key-features--capabilities)
- [Encrypted Audio & Voice Notes](#-encrypted-audio--voice-notes)
- [Visual Safety Fingerprint (MITM Defense)](#-visual-safety-fingerprint-mitm-defense)
- [Ephemeral 30-Second Memory Purge](#-ephemeral-30-second-memory-purge)
- [Deployment & Quickstart](#-deployment--quickstart)
- [Repository Architecture](#-repository-architecture)
- [Security & Threat Model Matrix](#-security--threat-model-matrix)
- [Author Profile & Hackathons](#-author-profile--hackathons)
- [Direct Transmission Hub](#-direct-transmission-hub)

---

## ⚡ Executive Overview

**GhostChat** is an open-source, zero-knowledge, peer-to-peer ephemeral communication engine engineered to guarantee absolute anonymity and confidentiality.

Operating **100% serverlessly** directly within the web browser via GitHub Pages, GhostChat establishes direct **WebRTC P2P DataChannels** between users. All plaintext, metadata, and audio recordings never transit through a centralized backend:
- 🔒 **Ephemeral Key Agreement:** Ephemeral in-memory **ECDH (Elliptic-Curve Diffie-Hellman, Curve P-256)** key generation per session.
- 🛡️ **Military-Grade Symmetric Encryption:** Authenticated **AES-256-GCM** encryption with freshly drawn 96-bit initialization vectors (IVs) per packet.
- ⏳ **30-Second Self-Destruction:** Real-time visual progress countdown automatically purges and zeroizes messages and voice notes from volatile memory.
- 🎙️ **Encrypted Audio Notes:** In-browser microphone capture encrypted client-side prior to P2P transmission.

---

## 🎯 The Problem with Centralized Messaging

Conventional modern messaging applications introduce critical systemic vulnerabilities:
1. **Server-Side Metadata Harvesting:** Telegram, WhatsApp, and Discord record IP addresses, session timestamps, device fingerprints, and graph connection topologies.
2. **Persistent Storage Liabilities:** Messages stored on physical server disks or cloud backups remain vulnerable to subpoena, breach, or unauthorized administrative inspection.
3. **Identity Linkage:** Requirement of telephone numbers, email addresses, or account credentials inherently eliminates operational anonymity.

### 👻 The GhostChat Architectural Solution
GhostChat is architected with a **Zero-Knowledge, Zero-Server, Zero-Trace** security model:
- No user accounts, passwords, or emails.
- No central databases, log files, or persistent storage.
- Operates strictly in volatile RAM and is completely wiped upon closing the browser tab.

---

## 🔐 Cryptographic Pipeline & Handshake Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                      GHOSTCHAT CRYPTOGRAPHIC SUITE                     │
└────────────────────────────────────────────────────────────────────────┘

    PEER A (Local Browser)                            PEER B (Remote Stranger)
  ─────────────────────────                         ─────────────────────────
             │                                                  │
 1. Generate Ephemeral ECDH                        1. Generate Ephemeral ECDH
    Keypair (P-256 Curve)                             Keypair (P-256 Curve)
             │                                                  │
             ├───────── 2. WebRTC Public Key Exchange ─────────┤
             │             (Raw ArrayBuffer / Base64)           │
             │                                                  │
 3. Compute Shared Secret                          3. Compute Shared Secret
    deriveKey(PrivA, PubB)                            deriveKey(PrivB, PubA)
             │                                                  │
             ▼                                                  ▼
 ┌───────────────────────┐                          ┌───────────────────────┐
 │   AES-256-GCM KEY     │ ◄──── IDENTICAL KEY ────►│   AES-256-GCM KEY     │
 └───────────────────────┘                          └───────────────────────┘
             │                                                  │
 4. SHA-256 Fingerprint Digest                     4. SHA-256 Fingerprint Digest
    (6-Digit Code + 4 Emojis)                         (6-Digit Code + 4 Emojis)
    🛡️ ⚡ 🔑 🪐 (#482915)                             🛡️ ⚡ 🔑 🪐 (#482915)
             │                                                  │
             │                                                  │
 5. Per-Message Transmission:                      5. Receive & Decrypt:
    • 96-bit IV via crypto.getRandomValues(12)         • Parse IV & Ciphertext
    • AES-GCM 256-bit Authenticated Encryption         • AES-GCM Decrypt in Memory
    • Dispatched via WebRTC DataChannel                • Render with 30s Countdown
             │                                                  │
             └──────────────────────────────────────────────────┘
```

### 1. Mathematical Formulation
Key agreement is established using the NIST P-256 prime curve equation:

$$y^2 \equiv x^3 - 3x + b \pmod{p}$$

Given Peer A's private scalar $d_A$ and public point $Q_A = d_A \cdot G$, and Peer B's corresponding pair $(d_B, Q_B)$:

$$K = d_A \cdot Q_B = d_B \cdot Q_A = (d_A \cdot d_B) \cdot G$$

The shared affine point coordinate is digested by the browser's native `SubtleCrypto` engine into a symmetric **256-bit AES-GCM** key.

---

## 🚀 Key Features & Capabilities

- **🚀 100% Serverless GitHub Pages Deployment:** Built in pure HTML5, CSS3, Tailwind CSS, Lucide icons, and modern JavaScript via CDN. Runs without maintaining a VPS or paid backend.
- **⚡ Instant Anonymous Matchmaking:** Connect with random strangers globally in seconds, or share custom private room codes for isolated peer-to-peer discussions.
- **🛡️ Visual MITM Safety Fingerprint:** Both peers display an identical 6-digit numeric verification code (`#482915`) and a 4-emoji sequence (`🛡️ ⚡ 🔑 🪐`) derived from the SHA-256 digest of the shared AES key.
- **🎙️ End-to-End Encrypted Voice Notes:** High-fidelity audio recording via the `MediaRecorder` API, converted to raw ArrayBuffers, encrypted with AES-256-GCM, and delivered with inline waveforms.
- **⏳ 30-Second Self-Destructing Messages:** Every message, notification, and audio memo automatically expires and is evicted from browser DOM and RAM 30 seconds after delivery.
- **⌨️ Keyboard Shortcuts & Cyberpunk UI:** Quick keyboard shortcuts (`Esc` to Stop/Next, `Enter` to Send) wrapped in an ultra-sleek, responsive dark glassmorphic design.

---

## 🎙️ Encrypted Audio & Voice Notes

Voice memos are protected through the identical cryptographic envelope as text:

```
[ In-Browser Mic ] ──► [ MediaRecorder API ] ──► [ Audio Blob ] ──► [ ArrayBuffer ]
                                                                           │
                                                                           ▼
[ WebRTC P2P DataChannel ] ◄── [ Base64 Payload ] ◄── [ AES-256-GCM Encrypt + 12-byte IV ]
```

- Audio format: `audio/webm;codecs=opus` (with automatic `audio/ogg` fallback).
- Chunk size limit: Handled efficiently across WebRTC data frames up to 10MB without latency.
- Playback: HTML5 audio instance generated dynamically via ephemeral Object URLs and revoked immediately upon the 30-second self-destruct trigger.

---

## 🛡️ Visual Safety Fingerprint (MITM Defense)

To neutralize active Man-in-the-Middle (MITM) attacks by rogue signaling brokers, GhostChat hashes the derived raw AES-GCM key:

```javascript
// Fingerprint Derivation Logic
const rawKey = await window.crypto.subtle.exportKey("raw", sharedKey);
const hashBuffer = await window.crypto.subtle.digest("SHA-256", rawKey);
const hashArray = Array.from(new Uint8Array(hashBuffer));

// 6-Digit Verification Token
const code = ((hashArray[0] << 24 | hashArray[1] << 16 | hashArray[2] << 8 | hashArray[3]) >>> 0) % 1000000;

// 4-Emoji Visual Verification Set
const emojis = ["🛡️", "⚡", "🔑", "🪐", "💎", "🌟", "🔥", "🚀", "🍀", "🌊", "🦊", "🔮", "🌈", "🧩"];
```

If both peers see matching emojis and 6-digit codes, the cryptographic tunnel is mathematically proven to be unintercepted.

---

## ⏳ Ephemeral 30-Second Memory Purge

GhostChat enforces strict data hygiene:
1. When a message is decrypted, a `30000ms` window timer initiates.
2. An animated countdown progress bar provides continuous visual feedback.
3. Upon expiration:
   - The DOM node is removed.
   - Decrypted plaintext strings and audio blob URLs (`URL.revokeObjectURL`) are dereferenced for immediate garbage collection.
   - Message arrays in RAM are filtered and purged.

---

## 🛠️ Deployment & Quickstart

### Method 1: Live Web App (Direct & Instant)
Launch GhostChat directly:  
👉 **[https://ghostchat-vjvj.onrender.com](https://ghostchat-vjvj.onrender.com)**  
*(Static mirror also available on [GitHub Pages](https://praneethsai050-cmd.github.io/GhostChat/))*

---

### Method 2: 1-Click GitHub Pages Hosting on Your Own Fork
1. Fork or clone this repository:
   ```bash
   git clone https://github.com/praneethsai050-cmd/GhostChat.git
   cd GhostChat
   ```
2. Enable GitHub Pages in your repo settings:
   - Navigate to **Settings ➔ Pages**.
   - Select **Source**: `Deploy from a branch`.
   - Branch: `main` | Folder: `/ (root)`.
   - Click **Save**. Your instance is live at `https://<YOUR-USERNAME>.github.io/GhostChat/`!

---

### Method 3: Local Development (Python HTTP Server)
```bash
# Serve standalone single-page application
python -m http.server 8080
```
Open **`http://localhost:8080`** in two browser windows or private incognito tabs to test peer connection.

---

### Method 4: Modular React + Vite + Node Stack
```bash
# Run client
cd client
npm install
npm run dev

# (Optional) Run self-hosted signaling server
cd ../server
npm install
npm start
```

---

## 📂 Repository Architecture

```
GhostChat/
├── index.html                   # 100% Standalone Self-Contained App for GitHub Pages
├── docs/
│   └── index.html               # Mirror for GitHub Pages /docs deployment mode
├── .gitignore                   # Ignores dependencies, builds, and logs
├── .nojekyll                    # Bypasses Jekyll processing on GitHub Pages
├── LICENSE                      # MIT Open Source License
├── README.md                    # Comprehensive Architectural Documentation
├── client/                      # Modular React + Vite Source Code
│   ├── src/
│   │   ├── App.jsx              # Main Chat UI Component
│   │   ├── crypto.js            # Web Crypto API ECDH & AES-256-GCM Suite
│   │   ├── main.jsx             # React Virtual DOM Entry
│   │   └── index.css            # Tailwind Directives & Animations
│   ├── package.json             # Client Dependencies
│   └── vite.config.js           # Vite Bundler Configuration
└── server/                      # Optional Self-Hosted Socket.io Signaling Relay
    ├── server.js                # Anonymous Socket Matchmaker & Blind Relay
    └── package.json             # Server Dependencies
```

---

## 🔒 Security & Threat Model Matrix

| Threat Vector | Mitigation Strategy in GhostChat |
| :--- | :--- |
| **Passive Network Wiretapping** | Full payload encryption with **AES-256-GCM**; raw text is never exposed on the wire. |
| **Active Man-in-the-Middle (MITM)** | Out-of-band visual **Safety Fingerprint** (SHA-256 hash verified via 6-digit code and 4 emojis). |
| **Replay Attacks** | Every packet requires a distinct, non-repeating **96-bit random IV** via `crypto.getRandomValues(12)`. |
| **Physical Device Inspection** | **30-second ephemeral lifecycle** evicts and zeroizes messages and audio blobs from browser memory. |
| **Server Subpoena / Data Seizure** | **Zero server persistence**; the application operates serverlessly via WebRTC P2P DataChannels. |
| **Identity Correlation** | **No accounts, phone numbers, or emails** required; sessions use ephemeral identities only. |

---

## 👨‍💻 Author Profile & Hackathons

**A. Praneeth Sai**  
*1st-Year B.Tech CSE (Cyber Security) @ Jaypee University of Information Technology (JUIT), Waknaghat, Solan*

- 🛡️ **Flagship Venture:** Founder & Lead Backend Architect of **[Satyameva Aegis](https://github.com/praneethsai050-cmd/satyameva)** (Custom PoW Blockchain & Biometric Credentialing).
- 🏆 **Hackathon Track Record:**
  - Selected for **RIDEHACK'26 Grand Finals** (1st Nov 2026 @ JIIT Noida • Team ID: 10).
  - Team Leader for **Smart India Hackathon 2026** (`PS: SIH26125` • Team CYPHER-X).
  - 🏅 **Zonal 3rd Place** @ KVS Hackathon 1.0 (AI Vidyasetu).
- 🎬 **YouTube Channel:** Documenting college engineering hustle, systems building, and hackathons on **[@flixyte](https://youtube.com/@flixyte)**.
- 💖 **GitHub Sponsors:** **[github.com/sponsors/praneethsai050-cmd](https://github.com/sponsors/praneethsai050-cmd)**
- 🌐 **Interactive Portfolio:** **[praneethsai050-cmd.github.io](https://praneethsai050-cmd.github.io)**

---

## 📬 Direct Transmission Hub

<p align="center">
  <a href="https://wa.me/918777679256?text=Hi%20Praneeth%2C%20saw%20GhostChat%20and%20wanted%20to%20connect!">
    <img src="https://img.shields.io/badge/WhatsApp-+91_87776_79256-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" />
  </a>
  <a href="https://www.linkedin.com/in/a-praneeth-sai-089023289/">
    <img src="https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" />
  </a>
  <a href="https://github.com/sponsors/praneethsai050-cmd">
    <img src="https://img.shields.io/badge/Sponsor-%E2%9D%A4-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" />
  </a>
  <a href="https://youtube.com/@flixyte">
    <img src="https://img.shields.io/badge/YouTube-@flixyte-FF0000?style=for-the-badge&logo=youtube&logoColor=white" />
  </a>
  <a href="mailto:261034004@juitsolan.in">
    <img src="https://img.shields.io/badge/Academic_Email-261034004@juitsolan.in-8B5CF6?style=for-the-badge&logo=gmail&logoColor=white" />
  </a>
  <a href="mailto:praneethsai050@gmail.com">
    <img src="https://img.shields.io/badge/Personal_Email-praneethsai050@gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white" />
  </a>
</p>

<p align="center">
  <a href="https://praneethsai050-cmd.github.io">
    <img src="https://img.shields.io/badge/🌐_Visit_My_Interactive_Web_Portfolio-10B981?style=for-the-badge&logoColor=white" />
  </a>
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=15,19,25,29&height=100&section=footer" />
</p>

<p align="center">
  <b>GhostChat</b> • <i>"True privacy leaves no footprints."</i>
</p>
