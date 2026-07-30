#!/bin/bash
#
# Automated Screenshot Capture for Platform Frames (via ADB)
#
# This script captures screenshots of all 7 platform context frame test pages
# using an Android phone connected via ADB over Tailscale.
#
# Usage:
#   ./screenshots-capture.sh
#
# Requirements:
#   - Android phone connected via ADB over Tailscale
#   - Vista server accessible at Tailscale URL
#   - Chrome installed on the phone
#
# Output:
#   Screenshots are saved to ./screenshots/ directory with platform-identifying names:
#   - twitter-frame.png
#   - instagram-frame.png
#   - youtube-frame.png
#   - tiktok-frame.png
#   - pinterest-frame.png
#   - linkedin-frame.png
#   - reddit-frame.png
#
# Platforms covered: Twitter (X), Instagram, YouTube, TikTok, Pinterest, LinkedIn, Reddit

set -e  # Exit on error

echo "🧪 Starting platform frame screenshot capture via ADB..."

BASE_URL="http://100.81.129.38:3000"  # Using Tailscale network
SCREENSHOT_DIR="/home/coding/vista/screenshots"

mkdir -p "$SCREENSHOT_DIR"

# Open Chrome on the phone
adb shell am start -a android.intent.action.VIEW -d 'about:blank' com.android.chrome
sleep 2

platforms=(
  "Twitter:/test-twitter-frame.html"
  "Instagram:/test-instagram-frame.html"
  "YouTube:/test-youtube-frame.html"
  "TikTok:/test-tiktok-frame.html"
  "Pinterest:/test-pinterest-frame.html"
  "LinkedIn:/test-linkedin-frame.html"
  "Reddit:/test-reddit-frame.html"
)

for platform in "${platforms[@]}"; do
  name="${platform%%:*}"
  path="${platform##*:}"

  echo ""
  echo "📸 Capturing $name..."

  # Navigate to the platform frame page
  adb shell am start -a android.intent.action.VIEW -d "${BASE_URL}${path}" com.android.chrome
  sleep 3

  # Take screenshot
  adb shell screencap -p > "$SCREENSHOT_DIR/${name,,}-frame.png"
  echo "   ✅ Saved to ${SCREENSHOT_DIR}/${name,,}-frame.png"

  # Small pause before next
  sleep 1
done

echo ""
echo "✅ All screenshots captured!"
echo ""
echo "Screenshots saved to: $SCREENSHOT_DIR"
ls -la "$SCREENSHOT_DIR"