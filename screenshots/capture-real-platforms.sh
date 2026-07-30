#!/bin/bash

# Real Platform Screenshot Capture Script
# Takes screenshots of real platform interfaces for comparison

SCREENSHOTS_DIR="/home/coding/vista/screenshots"
mkdir -p "$SCREENSHOTS_DIR"

echo "Starting real platform screenshot capture..."
echo "============================================"

# Function to take screenshot with filename
take_screenshot() {
  local name=$1
  adb shell screencap -p > "$SCREENSHOTS_DIR/${name}-real.png"
  echo "  ✓ Captured: ${name}-real.png"
}

# Navigate to Twitter/X
echo "Capturing Twitter/X real interface..."
adb shell am start -a android.intent.action.VIEW -d 'https://x.com' com.android.chrome
sleep 5
take_screenshot "twitter"

# Navigate to Instagram
echo "Capturing Instagram real interface..."
adb shell am start -a android.intent.action.VIEW -d 'https://instagram.com' com.android.chrome
sleep 5
take_screenshot "instagram"

# Navigate to YouTube
echo "Capturing YouTube real interface..."
adb shell am start -a android.intent.action.VIEW -d 'https://youtube.com' com.android.chrome
sleep 5
take_screenshot "youtube"

# Navigate to TikTok
echo "Capturing TikTok real interface..."
adb shell am start -a android.intent.action.VIEW -d 'https://tiktok.com' com.android.chrome
sleep 5
take_screenshot "tiktok"

# Navigate to Pinterest
echo "Capturing Pinterest real interface..."
adb shell am start -a android.intent.action.VIEW -d 'https://pinterest.com' com.android.chrome
sleep 5
take_screenshot "pinterest"

# Navigate to LinkedIn
echo "Capturing LinkedIn real interface..."
adb shell am start -a android.intent.action.VIEW -d 'https://linkedin.com' com.android.chrome
sleep 5
take_screenshot "linkedin"

# Navigate to Reddit
echo "Capturing Reddit real interface..."
adb shell am start -a android.intent.action.VIEW -d 'https://reddit.com' com.android.chrome
sleep 5
take_screenshot "reddit"

echo ""
echo "All real platform screenshots captured!"
echo "Screenshots saved to: $SCREENSHOTS_DIR"
echo "============================================"

# List captured screenshots
ls -lh "$SCREENSHOTS_DIR"/*-real.png
