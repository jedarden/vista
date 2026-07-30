#!/bin/bash

# Manual Screenshot Instructions for Social Platforms Verification
# This script provides the browser URLs and screenshot commands needed

echo "🎯 Social Platforms Manual Screenshot Instructions"
echo "================================================"
echo ""

# Define paths
TEST_FILE="src/public/test-social-platforms-complete.html"
SCREENSHOT_DIR="screenshots"

# Create screenshot directory
mkdir -p "$SCREENSHOT_DIR"

echo "📋 Screenshots to capture:"
echo ""

# Array of screenshots to capture
declare -a SCREENSHOTS=(
  "dark:reddit:reddit-dark.png"
  "dark:twitter:twitter-dark.png"
  "dark:youtube:youtube-dark.png"
  "dark:tiktok:tiktok-dark.png"
  "light:reddit:reddit-light.png"
  "light:twitter:twitter-light.png"
  "light:youtube:youtube-light.png"
  "light:tiktok:tiktok-light.png"
)

# Display screenshot plan
for i in "${SCREENSHOTS[@]}"; do
  IFS=':' read -r THEME PLATFORM NAME <<< "$i"
  echo "  ${NAME} - ${PLATFORM} (${THEME} theme)"
done

echo ""
echo "📸 Instructions:"
echo ""
echo "1. Open the test file in your browser:"
echo "   file://$(pwd)/$TEST_FILE"
echo ""
echo "2. Use the theme toggle button to switch between dark and light modes"
echo ""
echo "3. For each platform in both themes:"
echo "   - Navigate to the platform section"
echo "   - Take a screenshot of the frame"
echo "   - Save it to: $SCREENSHOT_DIR/<filename>"
echo ""
echo "4. Required screenshots:"
for i in "${SCREENSHOTS[@]}"; do
  IFS=':' read -r THEME PLATFORM NAME <<< "$i"
  echo "   - $SCREENSHOT_DIR/${NAME}"
done
echo ""
echo "💡 Tips:"
echo "   - Use browser developer tools to ensure responsive screenshots"
echo "   - Make sure all platform elements are visible in the screenshot"
echo "   - Verify that theme switching works correctly"
echo "   - Check that engagement buttons and user info render properly"
echo ""
echo "🎯 After capturing screenshots, verify:"
echo "   ✓ All four platforms (Reddit, Twitter/X, YouTube, TikTok) are present"
echo "   ✓ Dark and light themes are properly captured"
echo "   ✓ Platform-specific styling matches brand identity"
echo "   ✓ All engagement elements are visible"
echo "   ✓ User information displays correctly"
echo "   ✓ Link cards and embedded content render properly"
echo ""
echo "✅ Verification complete!"
