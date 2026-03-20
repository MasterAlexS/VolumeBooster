# Volume Booster 🔊🚀

A powerful, lightweight, and privacy-focused volume booster extension for **Firefox**. Built with Manifest V3 and the Web Audio API, it allows you to amplify your browser's audio up to **1000%** with per-tab persistence.

---

## ✨ Features

* **Two Boosting Modes:**
    * 🟢 **Standard Mode:** Boost up to **600%** (Safe, high-quality amplification).
    * 🔴 **Extreme Mode:** Unlock the limit up to **1000%** for those ultra-quiet videos.
* **Per-Tab Memory:** The extension remembers your volume settings for each specific tab, even after a page refresh or navigation.
* **Dynamic UI:**
    * **Glow Effect:** Visual feedback through a glowing percentage indicator that changes color based on the boost level.
    * **Theme Support:** Manual toggle for **Dark Mode** (Default) and **Light Mode**, saved to your preferences.
* **Smart "Apply Last":** One-click button to apply the last used volume level globally.
* **Clean Architecture:** Written in vanilla JavaScript (no frameworks) using the Web Audio API for low-latency, high-fidelity sound manipulation.
* **Privacy First:** No tracking, no data collection, and no external server calls.

---

## 🛠 Installation

Since this extension is optimized for Firefox, you can install it manually:

### **Method 1: Permanent Installation** (Skip to step 4 if you downloaded the .xpi file)
1.  Download the repository as a ZIP.
2.  Extract the files and compress the contents (including `manifest.json` and the `icons` folder) into a new `.zip` file.
3.  Rename the file extension from `.zip` to `.xpi`.
4.  In Firefox, go to `about:config` and set `xpinstall.signatures.required` to `false`.
5.  Go to `about:addons`, click the gear icon ⚙️, and select **"Install Add-on From File..."**.
6.  Select your `.xpi` file.

### **Method 2: Temporary (Developer Mode)**
1.  Go to `about:debugging#/runtime/this-firefox`.
2.  Click **"Load Temporary Add-on..."**.
3.  Select the `manifest.json` file from the project folder.

---

## 🔒 Permissions Explained

To provide reliable audio boosting, this extension requires:
* **`scripting`**: To inject the audio processing engine into the webpage.
* **`<all_urls>`**: To detect and capture audio/video elements on any site you visit.
* **`storage`**: To remember your theme preference and "Apply Last" volume settings.
* **`tabs`**: To manage volume levels independently for each tab.

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
