# MultiView: Clean Split Screen Extension

MultiView is a lightweight, incredibly easy-to-use Google Chrome extension that divides your browser tab into multiple split-screen frames. 

**Why is this different from other split-screen extensions?**
It gives a much **clearer and cleaner look**. We specifically designed it to be completely borderless with invisible scrollbars, making it **ready to use for dashboards, monitoring screens, or videotron displays.**

## Features
- **Ultra-Clean Look:** No clunky borders or ugly scrollbars in the way (but you can still scroll with your mouse wheel!).
- **Dashboard Ready:** Perfect for setting up multi-monitor displays, video walls, or analytics dashboards.
- **Multiple Layouts:** Choose from 2 frames, a 3-frame T-shape (one large on top, two on bottom), or a 4-frame grid.
- **Auto-Save:** It remembers the websites you set in each frame automatically.

---

## How to Install (It's super easy!)

You can get this running in just a few clicks:

1. **Download the folder:** Download this project code to your computer and extract the folder.
2. **Open Extensions:** In your browser, go to `chrome://extensions/` (or click the puzzle piece icon > Manage extensions).
3. **Turn on Developer Mode:** Toggle the "Developer mode" switch in the top right corner.
4. **Load Unpacked:** Click the **"Load unpacked"** button and select the downloaded folder.
5. **Done!** The extension is now installed and ready to use. Just like that!

---

## How to Use

1. Click the green **MultiView icon** in your extensions toolbar.
2. Select your layout (2 frames, 3 frames, or 4 frames).
3. A new clean tab will open. Hover over any black square to reveal the **"Set URL"** button.
4. Type in your website (e.g., `https://google.com`) and hit set. 
5. Enjoy your ultra-clean dashboard!

##  Technical Details

- **HTML/CSS Grid:** The core layout engine relies on modern CSS Grid (`grid-template-columns`, `grid-template-rows`) to instantly resize frames.
- **Cross-Origin Scrollbar Hiding:** Uses a dedicated `content.js` script with `all_frames: true` permissions to inject CSS into embedded iframes, ensuring third-party scrollbars are hidden without disabling scroll functionality.
- **Chrome Storage API:** Utilizes `chrome.storage.local` to independently save and retrieve URLs for index-based frames.

## 🔒 Permissions

- `storage`: Required to save the URLs you enter so they persist between sessions.
- `<all_urls>` (Host Permission): Required to inject the scrollbar-hiding CSS into the websites you load inside the split-screen frames.

## 📜 License

MIT License. Feel free to fork, modify, and use this code for your own projects!
