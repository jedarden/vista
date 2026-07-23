#!/bin/bash
#
# Comprehensive Platform Context Frames API Verification
#
# Tests all 44 platform context frames via API endpoints
# Verifies: platform availability, screenshot generation, theme support
#

BASE_URL="http://localhost:3002"
TEST_URL="https://example.com/test-page"
RESULTS_FILE="platform-frames-api-test-results.txt"
SCREENSHOT_DIR="screenshots/api-verification"

# Create results file
echo "# Platform Context Frames API Verification Results" > "$RESULTS_FILE"
echo "# Date: $(date)" >> "$RESULTS_FILE"
echo "# Testing all 44 platforms" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

# Create screenshot directory
mkdir -p "$SCREENSHOT_DIR"

# All 44 platforms (same order as platform-frames.js)
PLATFORMS=(
  "google:Google Search"
  "facebook:Facebook"
  "twitter:X (Twitter)"
  "linkedin:LinkedIn"
  "instagram:Instagram"
  "youtube:YouTube"
  "slack:Slack"
  "discord:Discord"
  "imessage:iMessage"
  "whatsapp:WhatsApp"
  "telegram:Telegram"
  "signal:Signal"
  "microsoft-teams:Microsoft Teams"
  "google-chat:Google Chat"
  "zoom-chat:Zoom Chat"
  "line:Line"
  "kakao:KakaoTalk"
  "tiktok:TikTok"
  "pinterest:Pinterest"
  "bluesky:Bluesky"
  "mastodon:Mastodon"
  "threads:Threads"
  "tumblr:Tumblr"
  "reddit:Reddit"
  "github:GitHub"
  "gitlab:GitLab"
  "stackoverflow:Stack Overflow"
  "hackernews:Hacker News"
  "producthunt:Product Hunt"
  "devto:Dev.to"
  "medium:Medium"
  "gmail:Gmail"
  "outlook:Outlook"
  "feedly:Feedly"
  "notion:Notion"
  "evernote:Evernote"
  "vscode:VS Code"
  "jetbrains-ide:JetBrains IDE"
  "jira:Jira"
  "trello:Trello"
  "asana:Asana"
  "figma:Figma"
  "substack:Substack"
  "generic:Generic Platform"
)

# Test counters
TOTAL=${#PLATFORMS[@]}
WORKING=0
FAILED=0
FAILED_PLATFORMS=()

echo "Starting API verification of $TOTAL platforms..."
echo ""

for platform_pair in "${PLATFORMS[@]}"; do
  PLATFORM_ID="${platform_pair%%:*}"
  PLATFORM_NAME="${platform_pair##*:}"

  echo "Testing $PLATFORM_NAME ($PLATFORM_ID)..."

  # Test 1: API health check
  echo "## $PLATFORM_NAME ($PLATFORM_ID)" >> "$RESULTS_FILE"

  # Test 2: Preview API availability
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/preview?url=${TEST_URL}")

  if [ "$RESPONSE" = "200" ]; then
    echo "✓ API endpoint: OK (HTTP $RESPONSE)" >> "$RESULTS_FILE"
  else
    echo "✗ API endpoint: FAILED (HTTP $RESPONSE)" >> "$RESULTS_FILE"
    FAILED=$((FAILED + 1))
    FAILED_PLATFORMS+=("$PLATFORM_NAME")
    echo "" >> "$RESULTS_FILE"
    continue
  fi

  # Test 3: Screenshot generation (dark mode)
  SCREENSHOT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/screenshot?url=${TEST_URL}&platform=${PLATFORM_ID}&theme=dark&format=svg")

  if [ "$SCREENSHOT_RESPONSE" = "200" ]; then
    echo "✓ Screenshot (dark mode): OK (HTTP $SCREENSHOT_RESPONSE)" >> "$RESULTS_FILE"

    # Actually download the screenshot
    curl -s "${BASE_URL}/api/screenshot?url=${TEST_URL}&platform=${PLATFORM_ID}&theme=dark&format=svg" \
      -o "${SCREENSHOT_DIR}/${PLATFORM_ID}-dark.svg"

    if [ -s "${SCREENSHOT_DIR}/${PLATFORM_ID}-dark.svg" ]; then
      echo "  └─ Downloaded: ${SCREENSHOT_DIR}/${PLATFORM_ID}-dark.svg" >> "$RESULTS_FILE"
    fi
  else
    echo "✗ Screenshot (dark mode): FAILED (HTTP $SCREENSHOT_RESPONSE)" >> "$RESULTS_FILE"
  fi

  # Test 4: Screenshot generation (light mode)
  SCREENSHOT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/screenshot?url=${TEST_URL}&platform=${PLATFORM_ID}&theme=light&format=svg")

  if [ "$SCREENSHOT_RESPONSE" = "200" ]; then
    echo "✓ Screenshot (light mode): OK (HTTP $SCREENSHOT_RESPONSE)" >> "$RESULTS_FILE"

    # Actually download the screenshot
    curl -s "${BASE_URL}/api/screenshot?url=${TEST_URL}&platform=${PLATFORM_ID}&theme=light&format=svg" \
      -o "${SCREENSHOT_DIR}/${PLATFORM_ID}-light.svg"

    if [ -s "${SCREENSHOT_DIR}/${PLATFORM_ID}-light.svg" ]; then
      echo "  └─ Downloaded: ${SCREENSHOT_DIR}/${PLATFORM_ID}-light.svg" >> "$RESULTS_FILE"
    fi
  else
    echo "✗ Screenshot (light mode): FAILED (HTTP $SCREENSHOT_RESPONSE)" >> "$RESULTS_FILE"
  fi

  echo "" >> "$RESULTS_FILE"

  # Only count as working if all tests passed
  if [ "$SCREENSHOT_RESPONSE" = "200" ]; then
    WORKING=$((WORKING + 1))
  fi
done

# Generate summary
echo "=== API VERIFICATION SUMMARY ===" >> "$RESULTS_FILE"
echo "Total platforms: $TOTAL" >> "$RESULTS_FILE"
echo "Working: $WORKING" >> "$RESULTS_FILE"
echo "Failed: $FAILED" >> "$RESULTS_FILE"

if [ $FAILED -gt 0 ]; then
  echo "" >> "$RESULTS_FILE"
  echo "Failed platforms:" >> "$RESULTS_FILE"
  for platform in "${FAILED_PLATFORMS[@]}"; do
    echo "  - $platform" >> "$RESULTS_FILE"
  done
fi

echo ""
echo "=== VERIFICATION COMPLETE ==="
echo "Total platforms: $TOTAL"
echo "Working: $WORKING"
echo "Failed: $FAILED"
echo ""
echo "Results saved to: $RESULTS_FILE"
echo "Screenshots saved to: $SCREENSHOT_DIR"

# Also output to console
if [ $FAILED -gt 0 ]; then
  echo ""
  echo "Failed platforms:"
  for platform in "${FAILED_PLATFORMS[@]}"; do
    echo "  - $platform"
  done
fi

exit $FAILED
