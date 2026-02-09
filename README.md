# Tab Numbering + Site Blocker (Vibe Coded)

A powerful Chrome/Brave/Edge browser extension that adds automatic tab numbering and provides comprehensive website blocking functionality, including a specialized YouTube Shorts blocker.

## ✨ Features

### 🔢 Tab Numbering

- **Automatic Numbering**: All tabs are automatically numbered in the title (e.g., "1. Google", "2. GitHub")
- **Real-time Updates**: Tab numbers update dynamically as you open, close, or rearrange tabs
- **Optimized Performance**: Uses debouncing (100ms) to prevent excessive executions
- **Smart Detection**: Works with regular websites while avoiding browser-specific pages (chrome://, brave://, edge://)

### 🚫 YouTube Shorts Blocker

- **Hide Shorts**: Removes YouTube Shorts from homepage, feed, and navigation
- **Redirect URLs**: Automatically converts Shorts URLs to regular video format
- **Toggle Control**: Easy on/off switch via popup interface
- **Section-Specific Pause**: Independently pause Shorts blocking in Home, Subscriptions, or Search
- **CSS Injection**: Uses optimized CSS selectors for efficient blocking
- **SPA Support**: Handles YouTube's single-page application navigation

### 🌐 Custom Website Blocker

- **Block Any Site**: Add any website domain to your block list
- **Instant Blocking**: Automatically closes tabs when blocked sites are accessed
- **Pause Functionality**: Temporarily pause blocking without removing sites from your list
- **Domain Matching**: Smart domain detection (works with or without www)
- **Easy Management**: Add and remove blocked sites through a clean interface
- **Persistent Storage**: Your blocked sites list is saved and synced

## 📦 Installation

### From Source (Developer Mode)

1. **Clone or Download** this repository:

   ```bash
   git clone <repository-url>
   cd TabNoExtention
   ```

2. **Open Extension Management**:
   - **Chrome**: Navigate to `chrome://extensions/`
   - **Brave**: Navigate to `brave://extensions/`
   - **Edge**: Navigate to `edge://extensions/`

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load Extension**:
   - Click "Load unpacked"
   - Select the `TabNoExtention` folder

5. **Pin Extension** (Optional):
   - Click the puzzle icon in the toolbar
   - Pin the extension for easy access

## 🚀 Usage

### Access the Extension

Click the extension icon in your browser toolbar to open the control panel.

### YouTube Shorts Blocking

1. Open the extension popup
2. In the "YouTube Shorts" section, click the toggle button to enable blocking
3. The status will show whether blocking is enabled or disabled
4. **Section-Specific Pause Controls**:
   - Click 🏠 **Home** button to pause/unpause Shorts on the home page
   - Click 📺 **Subscriptions** button to pause/unpause Shorts in subscriptions feed
   - Click 🔍 **Search** button to pause/unpause Shorts in search results
   - ⏸️ = Active (blocking Shorts in that section)
   - ▶️ = Paused (showing Shorts in that section)
5. Each section can be paused independently
6. Refresh YouTube pages to apply changes

**What Gets Blocked:**

- Shorts shelf on the homepage
- Shorts tab in navigation
- Individual Shorts in feeds
- Direct Shorts URLs (automatically redirected to regular video format)

### Custom Website Blocking

1. Open the extension popup
2. In the "Block Websites" section, enter a domain name
   - Example: `facebook.com`, `twitter.com`, `reddit.com`
   - Do not include `http://`, `https://`, or `www`
3. Click the "Add" button
4. The site will appear in your blocked sites list
5. **To pause all blocking**: Click the "⏸️ Pause Blocking" button (appears when you have blocked sites)
6. **To resume blocking**: Click the "▶️ Resume Blocking" button
7. To unblock a specific site, click the "×" button next to the site name

**How It Works:**

- When you try to visit a blocked site, the tab will automatically close
- Blocking works for navigation and URL updates
- Domain matching includes subdomains (e.g., blocking `youtube.com` also blocks `m.youtube.com`)

### Tab Numbering

Tab numbering works automatically! No configuration needed.

- Numbers appear at the start of each tab title
- Updates happen when you:
  - Open new tabs
  - Close tabs
  - Switch tabs
  - Move/rearrange tabs

## 🛠️ Technical Details

### Project Structure

```
TabNoExtention/
├── manifest.json       # Extension configuration and permissions
├── background.js       # Service worker for tab numbering and site blocking
├── content.js          # Content script for YouTube Shorts blocking
├── popup.html          # Extension popup interface
├── popup.js            # Popup logic and event handlers
├── popup.css           # Popup styling
├── blocked.html        # Blocked site notification page
└── README.md           # This file
```

### Permissions

This extension requires the following permissions:

- **`tabs`**: Access tab information for numbering
- **`scripting`**: Inject scripts to update tab titles
- **`storage`**: Save user preferences and blocked sites
- **`webNavigation`**: Detect navigation to blocked sites
- **`<all_urls>`**: Monitor and block any website

### Technologies Used

- **Manifest V3**: Latest Chrome extension API
- **Chrome Storage API**: Persistent data storage
- **Chrome Scripting API**: Dynamic script injection
- **Mutation Observer**: Detect YouTube SPA navigation
- **Debouncing**: Performance optimization for tab numbering

### Performance Optimizations

1. **Debounced Tab Numbering**: 100ms delay prevents excessive updates
2. **Efficient CSS Selectors**: Optimized for YouTube's DOM structure
3. **Silent Failures**: Gracefully handles protected pages
4. **Memory Management**: Cleanup on page unload to prevent leaks
5. **Targeted Observation**: MutationObserver only monitors necessary DOM changes

## 🐛 Troubleshooting

### Tab numbers not appearing

- Make sure you're not on a browser-specific page (chrome://, brave://, edge://)
- Try refreshing the page
- Check if the extension is enabled

### YouTube Shorts still visible

- Toggle the blocking off and on again
- Refresh the YouTube page after enabling
- Clear browser cache if issues persist

### Blocked sites not closing

- Verify the domain is correctly entered (without http:// or www)
- Check the extension has proper permissions
- Review the blocked sites list in the popup

### Extension not working

- Disable and re-enable the extension
- Reload the extension in `chrome://extensions/`
- Check browser console for errors (F12 → Console)

### Pause buttons not visible

- YouTube Shorts: Pause buttons only appear when blocking is enabled
- Site Blocker: Pause button only appears when you have sites in your blocked list

### Section pause not working

- Make sure blocking is enabled first (master toggle)
- Try refreshing the YouTube page
- Check that you're on the correct section (Home/Subscriptions/Search)
- Verify the button shows the correct state (⏸️ or ▶️)

## 📝 Development

### Making Changes

1. Edit the source files as needed
2. Go to the extension management page
3. Click the refresh icon on the extension card
4. Test your changes

### Debugging

- **Background Script**: `chrome://extensions/` → Click "service worker" link
- **Content Script**: Open DevTools on YouTube (F12) → Console
- **Popup**: Right-click extension icon → Inspect popup

### Key Files to Modify

- **Tab Numbering Logic**: `background.js` (lines 1-44)
- **Site Blocking Logic**: `background.js` (lines 46-135)
- **YouTube Shorts Blocking**: `content.js`
- **UI/Styling**: `popup.html` and `popup.css`
- **Popup Functionality**: `popup.js`

## 🔒 Privacy

This extension:

- ✅ Stores data locally on your device
- ✅ Does not collect or transmit any personal information
- ✅ Does not track browsing history
- ✅ Only accesses web pages to perform blocking and numbering functions

## 📄 License

This project is open source and available for personal and educational use.

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📧 Support

If you encounter issues or have questions, please:

1. Check the troubleshooting section
2. Review browser console logs
3. Open an issue on the project repository

## 🎯 Roadmap

Potential future enhancements:

- [ ] Import/export blocked sites list
- [ ] Whitelist functionality
- [ ] Time-based blocking schedules
- [ ] Block statistics and analytics
- [ ] Custom tab numbering formats
- [ ] Keyboard shortcuts
- [ ] Dark mode for popup
- [ ] Additional YouTube section controls (Trending, etc.)

---

**Version**: 2.2  
**Manifest Version**: 3  
**Compatible Browsers**: Chrome, Brave, Edge, and other Chromium-based browsers
