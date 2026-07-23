#!/bin/bash
# CLI-based theme verification test

echo "=== Platform Theme Verification Test ==="
echo ""

# Check if all platform frames exist in the CSS
platforms=("facebook" "twitter" "linkedin" "reddit" "instagram" "youtube" "tiktok" "pinterest")

echo "1. Checking CSS for platform frames..."
for platform in "${platforms[@]}"; do
  if grep -q "\.${platform}-context" src/public/style.css; then
    echo "✓ ${platform} context frame found in CSS"
  else
    echo "✗ ${platform} context frame NOT found in CSS"
  fi
done

echo ""
echo "2. Checking CSS theme variables for each platform..."
for platform in "${platforms[@]}"; do
  if grep -q "\.${platform}-context\.dark-theme" src/public/style.css; then
    echo "✓ ${platform} dark theme variables found"
  else
    echo "✗ ${platform} dark theme variables NOT found"
  fi

  if grep -q "\.${platform}-context\.light-theme" src/public/style.css; then
    echo "✓ ${platform} light theme variables found"
  else
    echo "✗ ${platform} light theme variables NOT found"
  fi
done

echo ""
echo "3. Checking verification HTML files..."
if [ -f "src/public/verify-8-platforms-complete.html" ]; then
  echo "✓ Complete verification page exists"
else
  echo "✗ Complete verification page NOT found"
fi

if [ -f "src/public/verify-7-platforms-theme.html" ]; then
  echo "✓ 7-platform verification page exists"
else
  echo "✗ 7-platform verification page NOT found"
fi

echo ""
echo "4. Checking platform-frames.js..."
if [ -f "src/public/platform-frames.js" ]; then
  echo "✓ platform-frames.js exists"
else
  echo "✗ platform-frames.js NOT found"
fi

echo ""
echo "5. Testing theme toggle button in verification pages..."
if grep -q "themeToggle" src/public/verify-8-platforms-complete.html; then
  echo "✓ Theme toggle functionality present"
else
  echo "✗ Theme toggle functionality NOT found"
fi

echo ""
echo "=== Verification Test Complete ==="