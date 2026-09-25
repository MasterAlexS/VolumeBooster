# Privacy Policy for Volume Booster

## Overview
Volume Booster ("the Extension") is built with a strict privacy-first philosophy. This Privacy Policy outlines our data handling practices. Our core principle is simple: **we do not want your data**.

## 1. Information We Do Not Collect
We firmly believe in data minimization. The Extension **does not** collect, store, transmit, or share any of the following:
- Personal information (e.g., name, email, IP address)
- Browsing history, visited URLs, or page content
- Analytics, telemetry, or usage statistics

The extension operates 100% locally on your machine and does not communicate with any external servers, APIs, or databases.

## 2. Information We Store Locally
To provide a seamless experience, the Extension stores a minimal amount of configuration data directly on your device using the browser's native `storage` API:
- **Active Tab States:** The volume level and on/off status are saved per individual tab (`tab_id`), ensuring tabs operate independently. This data is automatically deleted when you close the tab.
- **Domain Volume Settings (Passive Memory):** The last volume percentage you used on a specific website (e.g., youtube.com). This is kept in passive memory so you can easily restore it using the "Apply Last" button.
- **Global Preferences:** Your chosen theme (light/dark mode) and interface language.
- **Global State & Extreme Mode:** The last applied global volume level and whether the 1000% Extreme Mode is toggled on.

This data never leaves your computer. It is entirely under your control and can be wiped at any time by clearing your browser's local extension data.

## 3. Required Permissions Explained
The Extension requests the following minimal permissions to function:
- **`activeTab`**: Allows the Extension to temporarily interact with the current tab solely to connect to the audio stream for volume amplification, and to read the domain name for saving your volume preference locally. It does not monitor your activity across tabs.
- **`storage`**: Used exclusively to save your volume levels, theme, and language preferences locally on your hard drive.
- **Host Permission (`<all_urls>`)**: Strictly used to inject the audio processing script into the webpage (and its iframes) so it can locate and amplify the `<video>` or `<audio>` elements.

## 4. Third-Party Services
We do not integrate any third-party tracking scripts, analytics tools, or advertising networks into the Extension.

## 5. Changes to This Policy
We may update this Privacy Policy from time to time if new features require different permissions. Any changes will be reflected in this document. Since we do not collect user data, we cannot notify you directly of updates.

## 6. Contact
Volume Booster is open-source. If you have any questions, concerns, or wish to audit the code yourself, please check the official GitHub repository.
