# 🏔️ Overlook for Premiere Pro

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Premiere Pro](https://img.shields.io/badge/Adobe-Premiere%20Pro-9999FF.svg)](https://www.adobe.com/products/premiere.html)
[![Platform](https://img.shields.io/badge/Platform-Win%20%7C%20Mac-lightgrey.svg)]()

**Overlook** is an open-source, automated asset synchronization tool for Adobe Premiere Pro.

Designed as a modern, community-driven alternative to proprietary tools like _Watchtower_, Overlook streamlines the post-production workflow by creating a live mirror between your system folders and your project bins.

> **Note:** This project is an independent open-source initiative and is not affiliated with, endorsed by, or connected to the creators of other synchronization plugins.

---

## ✨ Key Features

### 🔄 Live Folder Mirroring

Forget `Ctrl + I`. Overlook monitors your chosen system folders in real-time. As soon as you drop a file on your disk—whether it's footage, music, or graphics—it instantly appears in the corresponding Bin in Premiere Pro.

### 🧠 Intelligent Deduplication Engine

Overlook features a "Smart Regex" detection system designed to handle Premiere Pro's eccentric file naming.

- It ignores Adobe's automatic suffixes (e.g., `_1`, `_copy`).
- It prevents duplicates even if the filenames in the Bin differ slightly from the source, provided the root filename matches.

### 💾 Project-Based Persistence

Overlook remembers your workflow. Folder mappings are saved locally and linked to specific project files (`.prproj`). Switch between your Commercial project and your Documentary project, and Overlook automatically loads the correct watched folders for each.

### ☢️ Hard Delete (Destructive)

A workflow utility for power users. Select items in your Project Panel and use the "Hard Delete" function to remove them not just from the project, but permanently from your hard drive.

---

## 🛠️ Installation Guide

Overlook is built on the Adobe CEP (Common Extensibility Platform) and Node.js.

### Prerequisites

- Adobe Premiere Pro (2024/2025+)
- Node.js installed on your system.

### Step 1: Deployment

Copy the entire `Overlook` folder to the Adobe extensions directory:

- **Windows:** `C:\Users\<YourUsername>\AppData\Roaming\Adobe\CEP\extensions\`
- **macOS:** `/Library/Application Support/Adobe/CEP/extensions/`

### Step 2: Enable Debug Mode

Since this is a developer/unsigned extension, you must enable PlayerDebugMode in your registry/plist.

**Windows (PowerShell or Regedit):**
Navigate to `HKEY_CURRENT_USER\Software\Adobe\CSXS.11` (or your specific version) and add a String value named `PlayerDebugMode` with data `1`.

**macOS (Terminal):**

```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```
