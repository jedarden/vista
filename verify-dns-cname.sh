#!/bin/bash
# Verification script for vista.jedarden.com CNAME record
# Run this after manually creating the CNAME in Cloudflare dashboard

set -e

DOMAIN="vista.jedarden.com"
TARGET="cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com"

echo "=== CNAME Verification for $DOMAIN ==="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check CNAME with host command
echo "Test 1: Checking CNAME record with 'host' command..."
if host -t CNAME "$DOMAIN" 2>/dev/null | grep -q "$TARGET"; then
    echo -e "${GREEN}✓ PASS${NC}: CNAME record found"
    host -t CNAME "$DOMAIN"
else
    echo -e "${RED}✗ FAIL${NC}: CNAME record not found or incorrect"
    echo "Current result:"
    host -t CNAME "$DOMAIN" || echo "  No CNAME record"
fi
echo ""

# Test 2: Check CNAME with dig command
echo "Test 2: Checking CNAME record with 'dig' command..."
CNAME_RESULT=$(dig +short "$DOMAIN" cname)
if [ "$CNAME_RESULT" = "$TARGET" ]; then
    echo -e "${GREEN}✓ PASS${NC}: CNAME record correct"
    echo "  $CNAME_RESULT"
else
    echo -e "${RED}✗ FAIL${NC}: CNAME record not found or incorrect"
    echo "  Expected: $TARGET"
    echo "  Got: $CNAME_RESULT"
fi
echo ""

# Test 3: Test HTTPS access
echo "Test 3: Testing HTTPS access to https://$DOMAIN..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" --max-time 10 2>/dev/null || echo "000")
if [ "$HTTP_CODE" != "000" ]; then
    echo -e "${GREEN}✓ PASS${NC}: HTTPS is accessible (HTTP $HTTP_CODE)"
    curl -I "https://$DOMAIN" 2>/dev/null | head -3
else
    echo -e "${YELLOW}⚠ WARNING${NC}: Could not connect via HTTPS (may need DNS propagation time)"
    echo "  DNS propagation can take 5-15 minutes"
fi
echo ""

# Test 4: Verify tunnel target resolves
echo "Test 4: Checking if Cloudflare tunnel target resolves..."
if dig +short "$TARGET" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}: Tunnel target resolves"
    dig +short "$TARGET" | head -3
else
    echo -e "${RED}✗ FAIL${NC}: Tunnel target does not resolve"
fi
echo ""

# Summary
echo "=== Summary ==="
echo "The CNAME record $DOMAIN → $TARGET"
echo ""
echo "If all tests pass:"
echo "  1. The DNS record is correctly configured"
echo "  2. DNS has propagated"
echo "  3. HTTPS access is working"
echo ""
echo "If tests fail:"
echo "  1. Verify the CNAME record in Cloudflare dashboard"
echo "  2. Wait 5-15 minutes for DNS propagation"
echo "  3. Re-run this script"
echo ""
