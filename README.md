# Volume Booster 🔊🚀

A powerful, lightweight, and strictly privacy-focused volume booster extension for **Mozilla Firefox** and **Google Chrome**. Built natively with Manifest V3 and the Web Audio API, it allows you to amplify your browser's audio up to **1000%** with smart domain-based memory and absolute zero background resource drain.

> **[TIP]**
> **Need more advanced audio controls?** Check out **[Sound Master](https://github.com/MasterAlexS/SoundMaster)**! 
> It is an advanced extension built directly upon the highly-optimized core of **Volume Booster**, adding professional features like an Anti-Distortion Compressor, a Multi-Band Equalizer, and Audio Balance controls.

---

## ✨ Features

* **Universal Translation (56 Languages):** Full support for almost every major language worldwide. A custom-built manual language selector in the UI allows you to change the extension's language instantly on the fly, independent of your browser's language.
* **Two Boosting Modes:**
    * 🟢 **Standard Mode:** Boost up to **600%** (Safe, high-quality amplification).
    * 🔴 **Extreme Mode:** Unlock the limit up to **1000%** for those ultra-quiet videos.
* **Smart Domain Memory:** The extension remembers your volume settings for specific websites (e.g., youtube.com) rather than per-tab. If you close a tab and come back later, your volume preferences remain intact.
* **Iframe Support:** Seamlessly boosts audio for embedded video players (e.g., YouTube videos embedded on third-party blogs or news sites).
* **Smart Audio Radar (CPU Optimized):** Automatically detects new videos dynamically loaded on the page. When the boost is disabled, the radar completely shuts down to ensure **0% CPU usage**.
* **Dynamic UI:**
    * **Glow Effect:** Visual feedback through a glowing percentage indicator that changes color based on the boost level.
    * **Theme Support:** Manual toggle for **Dark Mode** (Default) and **Light Mode**, saved to your preferences.
* **Cross-Browser Native:** Fully styled and tested to look and perform identically on both Firefox and Chromium-based browsers (Chrome, Edge, Brave, ...).
* **Privacy First:** No tracking, no data collection, and no external server calls. See our [Privacy Policy](PRIVACY.md) for full details.

---

## 🛠 Installation

Because this extension is cross-browser compatible, you can install it manually on either Firefox or Chrome:

### **Mozilla Firefox**
1. Go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select the `manifest.json` file from the extracted project folder.
*(Note: For permanent Firefox installation, you must zip the files into an `.xpi` format, go to `about:config`, set `xpinstall.signatures.required` to `false`, and install it via `about:addons` > Install Add-on From File).*

### **Google Chrome / Microsoft Edge / Brave / ...**
1. Download the repository as a ZIP and extract it to a folder.
2. Open your browser and go to `chrome://extensions/` (or `edge://extensions/`).
3. Turn on **Developer mode** (usually a toggle in the top-right corner).
4. Click **Load unpacked** and select the folder you extracted in step 1.

---

## 🔒 Permissions Explained

To provide reliable audio boosting while maintaining strict privacy, this extension requires only the absolute minimum permissions:
* **`activeTab`**: To identify the specific tab you want to boost when you open the popup and read the domain name for saving preferences locally.
* **`storage`**: To remember your language, theme preference, and volume settings across sessions locally on your machine.
* **Host Permission (`<all_urls>`)**: Strictly used to inject the audio processing script into the webpage (and its iframes) so it can locate and amplify the `<video>` or `<audio>` elements.

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features or find a bug, feel free to:
1.  **Fork** the project.
2.  Create your **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3.  **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4.  **Push** to the branch (`git push origin feature/AmazingFeature`).
5.  Open a **Pull Request**.

---

## ⚠️ Disclaimer

**Protect your hearing!** Prolonged use of extreme volume levels can damage your ears and your hardware (speakers/headphones). Use the **Extreme (1000%)** mode with caution. The author is not responsible for any damage caused by the misuse of this software.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
