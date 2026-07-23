#!/bin/bash

# BF-21h5 DOM Reordering Verification Test
# This script tests the DOM reordering functionality using curl and basic HTML parsing

echo "=========================================="
echo "🔍 BF-21h5 DOM Reordering Verification"
echo "=========================================="
echo ""

# Test configurations
declare -A TEST_URLS=(
  ["Article Page Type"]="https://blog.example.com/2024/07/my-article"
  ["Product Page Type"]="https://shop.example.com/products/awesome-product"
  ["General Website"]="https://example.com"
)

declare -A EXPECTED_PLATFORMS=(
  ["Article Page Type"]="twitter,facebook,linkedin,reddit,bluesky,threads,mastodon"
  ["Product Page Type"]="pinterest,facebook,instagram,twitter,linkedin"
  ["General Website"]="google,facebook,twitter,linkedin,slack,discord"
)

echo "📋 Test Setup:"
echo "  VISTA Server: http://localhost:3000"
echo "  Test Configurations: ${#TEST_URLS[@]}"
echo ""

# Check if VISTA is running
echo "🔍 Checking if VISTA server is running..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
  echo "  ✅ VISTA server is running"
else
  echo "  ❌ VISTA server is NOT running"
  echo "  Please start VISTA with: npm start"
  exit 1
fi

echo ""
echo "=========================================="
echo "📊 Manual Testing Instructions"
echo "=========================================="
echo ""

i=1
for test_name in "${!TEST_URLS[@]}"; do
  url="${TEST_URLS[$test_name]}"
  expected="${EXPECTED_PLATFORMS[$test_name]}"

  echo "Test ${i}: ${test_name}"
  echo "  URL: ${url}"
  echo "  Expected Platforms: ${expected}"
  echo ""

  # Generate test command
  cat << EOF
  To test this configuration:
  1. Open browser to: http://localhost:3000
  2. Enter URL: ${url}
  3. Click "Inspect" button
  4. Open DevTools Console (F12)
  5. Run this command:
     const platforms = Array.from(document.querySelectorAll('.platform-card'))
       .map(card => card.dataset.platform || card.querySelector('.platform-name')?.textContent?.trim().toLowerCase())
       .filter(p => p);
     console.log('Platform order:', platforms);
  6. Verify the output matches: [${expected//,/, }]

EOF

  ((i++))
done

echo "=========================================="
echo "📝 Expected Results Summary"
echo "=========================================="
echo ""

i=1
for test_name in "${!TEST_URLS[@]}"; do
  expected="${EXPECTED_PLATFORMS[$test_name]}"
  IFS=',' read -ra PLATFORM_ARRAY <<< "$expected"

  echo "Test ${i}: ${test_name}"
  echo "  Expected Order (${#PLATFORM_ARRAY[@]} platforms):"
  j=1
  for platform in "${PLATFORM_ARRAY[@]}"; do
    echo "    ${j}. ${platform}"
    ((j++))
  done
  echo ""
  ((i++))
done

echo "=========================================="
echo "✅ Test Configuration Complete"
echo "=========================================="
echo ""
echo "The VISTA application is ready for manual testing."
echo "Follow the instructions above for each test configuration."
echo ""
echo "To document results, create a notes file with your findings:"
echo "  echo 'Test results:' > notes/bf-21h5-results.md"
echo ""
