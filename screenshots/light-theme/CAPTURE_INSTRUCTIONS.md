# Light Theme Platform Screenshot Capture Instructions

**Bead ID:** bf-4ubla
**Task:** Generate light theme platform screenshots

## Quick Start

### Option 1: Automated Server Method (Recommended)

1. Start the local server:
   ```bash
   node manual-screenshot-server.js
   ```

2. Open http://localhost:8080 in your browser

3. Navigate to each platform and capture screenshots

### Option 2: Direct File Method

1. Open the files directly in your browser:
   ```bash
   # Open the gallery
   xdg-open screenshots/light-theme/index.html

   # Or open individual files
   xdg-open screenshots/light-theme/twitter-light.html
   xdg-open screenshots/light-theme/discord-light.html
   # ... etc for all 7 platforms
   ```

2. Capture screenshots using your system's screenshot tool

## Platform Screenshot Checklist

Capture screenshots for all 7 platforms:

### Required Screenshots (7 total)

1. **twitter-light.png** - X (Twitter) - Social
2. **discord-light.png** - Discord - Messaging
3. **instagram-light.png** - Instagram - Social
4. **telegram-light.png** - Telegram - Messaging
5. **signal-light.png** - Signal - Messaging
6. **whatsapp-light.png** - WhatsApp - Messaging
7. **mastodon-light.png** - Mastodon - Social

## Screenshot Guidelines

### Capture Area
- Focus on the platform frame container (the white box containing the rendered preview)
- Include enough context to show the platform chrome
- Avoid including browser UI elements (tabs, address bar, etc.)

### File Format
- **Format:** PNG
- **Naming:** platform-name-light.png (e.g., twitter-light.png)
- **Location:** screenshots/light-theme/

### Quality Check
- Screenshot should be clear and readable
- Platform chrome (avatars, headers, actions) should be visible
- Link preview card should be properly embedded
- No rendering artifacts or visual glitches

## Verification

After capturing all screenshots, verify:

```bash
# Check all files exist
ls -la screenshots/light-theme/*-light.png

# Should show 7 files:
# twitter-light.png
# discord-light.png
# instagram-light.png
# telegram-light.png
# signal-light.png
# whatsapp-light.png
# mastodon-light.png

# Check file sizes (all should be > 0 bytes)
du -h screenshots/light-theme/*-light.png
```

## Troubleshooting

### If HTML files don't render properly

1. Check that platform-frames.js and app.js are accessible
2. Open browser console (F12) to check for JavaScript errors
3. Verify the sample content is loading correctly

### If screenshots appear blank

1. Check browser console for rendering errors
2. Try refreshing the page
3. Verify the HTML file is not corrupted

### If platform frame doesn't appear

1. Ensure the platform ID exists in platform-frames.js
2. Check that renderPlatformWithContext function is working
3. Verify theme parameter is being passed correctly

## Acceptance Criteria

After completing the screenshot capture:

- [ ] All 7 platforms have screenshots in light theme
- [ ] All screenshots saved as PNG files with naming convention: platform-name-light.png
- [ ] All screenshot files are valid (non-zero size)
- [ ] Each screenshot clearly shows the platform frame UI
- [ ] No rendering errors or blank screenshots

## Next Steps

Once all screenshots are captured and verified:

1. Run the verification script:
   ```bash
   node verify-screenshots.js
   ```

2. Commit the screenshots:
   ```bash
   git add screenshots/light-theme/*-light.png
   git commit -m "feat(bf-4ubla): add light theme platform screenshots"
   ```

3. Close the bead:
   ```bash
   br close bf-4ubla
   ```

---

*Generated for Vista Light Theme Screenshot Capture (Bead bf-4ubla)*