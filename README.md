# 🚀 SKLauncher Ultra (v4.0.55-Ultra)

<p align="center">
  <img src="resources/icon.png" width="128" height="128" alt="SKLauncher Ultra Logo" />
</p>

<p align="center">
  <b>The modern, high-performance, and feature-packed Minecraft launcher.</b><br />
  Enhanced with a universal P2P Friends Network (Cracked & Premium), Hardware Acceleration Startup Guard, AI-powered Crash Analyzer, 1-Click Instance Sharing, and Disk Optimization.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.55--Ultra-blue.svg" alt="Version 4.0.55-Ultra" />
  <img src="https://img.shields.io/badge/platform-Windows-0078D6.svg?logo=windows" alt="Windows" />
  <img src="https://img.shields.io/badge/runtime-Electron-47848F.svg?logo=electron" alt="Electron" />
  <img src="https://img.shields.io/badge/frontend-Svelte-FF3E00.svg?logo=svelte" alt="Svelte" />
  <img src="https://img.shields.io/badge/license-GPLv3-green.svg" alt="License" />
</p>

---

## 🌟 Why SKLauncher Ultra?

While official launchers often suffer from GPU shader crashes, infinite updater loops, or lock social features behind official Microsoft accounts, **SKLauncher Ultra** fixes all critical hardware bugs and introduces a suite of cutting-edge features for both **Offline (Cracked)** and **Official (Microsoft)** players.

### 📊 Feature Comparison

| Feature | Official SKLauncher 4.0 | SKLauncher Ultra |
| :--- | :---: | :---: |
| **Microsoft Accounts (OAuth2)** | ✅ Yes | ✅ Yes |
| **Offline / Cracked Accounts** | ✅ Yes | ✅ Yes |
| **Friends System on Cracked Accounts** | ❌ Blocked (`403 Forbidden`) | 🚀 **Universal P2P Network** |
| **Friend Code System (`SK-XXXX-XXXX`)** | ❌ No | 🚀 **Yes (Instant 1-Click Add)** |
| **Real-time Server Presence & 1-Click Join** | ❌ No | 🚀 **Yes ("Join Server" Button)** |
| **Minecraft Skin Head Avatars for Friends** | ❌ No | 🚀 **Yes (Crisp Pixel-Art Heads)** |
| **GPU / DirectX Shader Crash Guard** | ❌ Crashes on start | 🚀 **Automatic Self-Healing** |
| **Infinite Auto-Updater Loop on Launch** | ❌ Common Bug | 🚀 **Completely Resolved** |
| **Smart AI / Heuristic Crash Analyzer** | ❌ Generic 500-line log | 🚀 **In English + 1-Click Fix** |
| **Instant Instance Sharing (Short Codes)** | ⚠️ Manual file exports only | 🚀 **Yes (`SKP1_...` / `sk://`)** |
| **Disk Cleaner & Old Logs Purge** | ❌ No | 🚀 **Yes (Frees 5 GB - 20 GB)** |
| **Pre-Launch Mod Conflict Scanner** | ❌ Waits for game crash | 🚀 **Yes (Scans `.jar` metadata)** |
| **1-Click Discord Screenshot Copy** | ❌ Must open file manager | 🚀 **Native Clipboard (`Ctrl+V`)** |

---

## ✨ Key Features & Innovations

### 1. 👥 Universal P2P Friends Network
- **Works for Everyone**: Connect with friends regardless of whether you or they use official Microsoft or offline/cracked accounts.
- **Unique Friend Codes**: Each user receives a clean, memorable friend code (e.g. `SK-7K9A-4M2P`). Copy your code and share it anywhere.
- **Presence & Live Server Joining**:
  - See what your friends are doing: *In Launcher*, *Playing Solo*, or *Playing Multiplayer*.
  - When a friend is playing on a server (e.g. `mc.hypixel.net`), their card displays a live server badge and an instant **"Join Server"** button.
- **Pixel-Art Head Avatars**: Automatically renders the authentic skin head of every player.

### 2. 🛡️ Startup Guard & Hardware Acceleration Fix
- **No More Startup Crashes**: Automatically detects if a previous launch crashed due to corrupted GPU DirectX/Vulkan shader caches (`GPUCache`, `DawnCache`).
- **Graceful Fallback**: Automatically purges damaged shader caches and falls back to clean rendering without requiring uninstalls or system restarts.
- **CLI Flags**: Supports `--disable-gpu`, `--no-gpu`, and `--safe-mode`.

### 3. 🧠 Smart AI / Heuristic Crash Analyzer (in English)
- **Plain-English Explanations**: Instantly explains why Minecraft crashed without forcing you to decipher hundreds of lines of stack traces.
- **Recognized Issues & 1-Click Fixes**:
  - *OptiFine vs Sodium/Iris/Embeddium Conflict* -> **"Disable OptiFine (Recommended)"**.
  - *Out of Memory (OOM)* -> **"Configure Instance RAM to 6 GB"**.
  - *Java Version Mismatch (e.g., class version 61/65)* -> **"Switch to Java 17/21"**.
  - *Missing Mod Dependencies (e.g., Fabric API)* -> **Identifies exact missing mod**.
  - *Duplicate Mod Versions* -> **Highlights duplicates for 1-click cleanup**.

### 4. 🔗 1-Click Instance Sharing (Short Codes & Deep Links)
- Export your entire instance configuration, modloaders, and mod set into a compact, compressed code: `SKP1_<data>` or a deep link `sk://import?data=<data>`.
- Friends can simply paste the code to recreate the exact same setup in seconds.

### 5. 🧹 Built-in Disk Cleaner
- Minecraft instances silently accumulate gigabytes of compressed `.log.gz` files, crash dumps, and stale web caches.
- The Disk Cleaner scans your installations and reclaims **5 GB to 20 GB of disk space** in a single click.

### 6. 📸 Enhanced Screenshot Tools
- Direct native Windows clipboard integration: click *"Copy Screenshot"* and immediately press `Ctrl+V` inside Discord, WhatsApp, or Twitter.

---

## 📥 Installation & Download

| Package | Download Link | Description |
| :--- | :--- | :--- |
| **Windows Installer** | **[SKLauncher-Ultra-Setup.exe](https://github.com/Vagabond404/SKLauncher-Ultra/releases/latest)** | **Recommended**: Complete setup wizard, creates Desktop & Start Menu shortcuts. |
| **Portable Version** | **[SKLauncher-Portable.zip](https://github.com/Vagabond404/SKLauncher-Ultra/releases/latest)** | Zero installation required. Unzip anywhere and launch `sklauncher.exe`. |

---

## 🛠️ Development & Building from Source

### Prerequisites
- [Node.js](https://nodejs.org/) v20+ or v24+
- [pnpm](https://pnpm.io/) or [npm](https://npmjs.com/)
- Windows 10/11 x64

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/Vagabond404/SKLauncher-Ultra.git
cd SKLauncher-Ultra

# 2. Run in development mode
scripts\run-dev.bat
# or
npx electron .

# 3. Compile the production ASAR archive (takes ~5 seconds)
node scripts/pack-asar.js
```

---

## 📁 Repository Structure

```
SKLauncher-Ultra/
├── features/               # Modular enhancements
│   ├── p2p-friends.js      # Universal P2P Friends network & presence engine
│   ├── startup-guard.js    # GPU crash self-healing & shader cache cleaner
│   ├── crash-analyzer.js   # Heuristic AI crash analyzer & 1-click fixes
│   ├── disk-cleaner.js     # Minecraft log/cache disk cleanup engine
│   ├── instance-sharing.js # Short code & deep link instance pack generator
│   ├── mod-conflict-scanner.js # Pre-launch JAR dependency scanner
│   ├── screenshot-tools.js # Native clipboard Discord integration
│   └── updater-guard.js    # Loop prevention for auto-updater
├── out/
│   ├── main/               # Electron backend process
│   ├── preload/            # ContextBridge secure APIs
│   └── renderer/           # Svelte 5 frontend (including friends.html)
├── resources/              # App icons, elevate.exe, updater configs
├── scripts/
│   ├── pack-asar.js        # Ultra-fast ASAR compiler
│   ├── unpack-asar.js      # ASAR extractor
│   └── run-dev.bat         # Direct Windows developer launcher
└── package.json            # Configuration and lifecycle scripts
```

---

## 🤝 Contributing

Contributions, feature requests, and bug reports are welcome! Feel free to open an issue or submit a pull request.

---

## 📜 Credits & License

- Built on the core architecture of **SKLauncher 4.0** by [skmedix](https://skmedix.pl).
- Enhanced, optimized, and maintained by the community.
- Distributed under the **GPL-3.0 License**.
