#!/bin/bash
#
# Platform Frame Screenshot Capture Script (via ADB)
#
# Takes screenshots of all 7 platform frames in both dark and light modes
# using an Android phone connected via ADB.
#
# Usage:
#   bash screenshots/capture-platform-frames.sh
#   npm run screenshots:adb
#
# Requirements:
#   - Android phone connected via ADB
#   - Vista server accessible at SERVER_URL
#   - Chrome installed on the phone
#
# Platforms Covered:
#   - Twitter (X), Instagram, YouTube, TikTok, Pinterest, LinkedIn, Reddit
#
# Output:
#   Screenshots saved to ./screenshots/ with platform-identifying names:
#   - {platform}-frame-dark.png
#   - {platform}-frame-light.png

set -e  # Exit on error

SERVER_URL="http://10.0.2.2:8080"
SCREENSHOTS_DIR="/home/coding/vista/screenshots"
mkdir -p "$SCREENSHOTS_DIR"

platforms=(
  "twitter:test-twitter-frame.html"
  "instagram:test-instagram-frame.html"
  "youtube:test-youtube-frame.html"
  "tiktok:test-tiktok-frame.html"
  "pinterest:test-pinterest-frame.html"
  "linkedin:test-linkedin-frame.html"
  "reddit:test-reddit-frame.html"
)

echo "Starting platform frame screenshot capture..."
echo "=========================================="

for platform in "${platforms[@]}"; do
  name="${platform%%:*}"
  file="${platform##*:}"

  echo "Capturing $name..."

  # Open the test file in Chrome
  adb shell am start -a android.intent.action.VIEW -d "${SERVER_URL}/${file}" com.android.chrome

  # Wait for page to load
  sleep 4

  # Take dark mode screenshot
  adb shell screencap -p > "$SCREENSHOTS_DIR/${name}-frame-dark.png"
  echo "  ✓ Dark mode: ${name}-frame-dark.png"

  # Switch to light mode by clicking the theme toggle button
  # The theme toggle is at the top right of the page
  adb shell input tap 900 100
  sleep 1

  # Take light mode screenshot
  adb shell screencap -p > "$SCREENSHOTS_DIR/${name}-frame-light.png"
  echo "  ✓ Light mode: ${name}-frame-light.png"

  # Small delay before next platform
  sleep 1
done

echo ""
echo "All platform frame screenshots captured!"
echo "Screenshots saved to: $SCREENSHOTS_DIR"
echo "=========================================="

# List captured screenshots
ls -lh "$SCREENSHOTS_DIR"/*.png
