#!/usr/bin/env bash
set -e

# Verification script for vista.jedarden.com CNAME record
# Usage: ./scripts/verify-dns-cname.sh

DOMAIN="vista.jedarden.com"
TARGET="cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com"
COLOR_PASS="\033[0;32m"
COLOR_FAIL="\033[0;31m"
COLOR_INFO="\033[0;36m"
COLOR_RESET="\033[0m"

pass_count=0
fail_count=0

check_pass() {
    echo -e "${COLOR_PASS}✓ PASS${COLOR_RESET}: $1"
    ((pass_count++))
}

check_fail() {
    echo -e "${COLOR_FAIL}✗ FAIL${COLOR_RESET}: $1"
    ((fail_count++))
}

check_info() {
    echo -e "${COLOR_INFO}ℹ INFO${COLOR_RESET}: $1"
}

echo "=========================================="
echo "DNS CNAME Verification for ${DOMAIN}"
echo "=========================================="
echo ""

# Check 1: CNAME record exists
check_info "Checking for CNAME record..."
if host -t CNAME "${DOMAIN}" 2>/dev/null | grep -q "is an alias for"; then
    check_pass "CNAME record exists"
else
    check_fail "CNAME record does not exist (output: $(host -t CNAME ${DOMAIN} 2>&1))"
fi

# Check 2: CNAME points to correct target
check_info "Checking CNAME target..."
CNAME_TARGET=$(host -t CNAME "${DOMAIN}" 2>/dev/null | grep "is an alias for" | sed 's/.*is an alias for //')
if [[ "${CNAME_TARGET}" == "${TARGET}." ]]; then
    check_pass "CNAME points to ${TARGET}"
elif [[ -n "${CNAME_TARGET}" ]]; then
    check_fail "CNAME points to wrong target: ${CNAME_TARGET} (expected: ${TARGET})"
else
    check_fail "CNAME target not found"
fi

# Check 3: DNS resolution works
check_info "Checking DNS resolution..."
if dig +short "${DOMAIN}" >/dev/null 2>&1; then
    check_pass "DNS resolution successful"
else
    check_fail "DNS resolution failed"
fi

# Check 4: HTTPS access (basic check)
check_info "Checking HTTPS accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}" --connect-timeout 5 2>/dev/null || echo "000")
if [[ "${HTTP_STATUS}" != "000" ]]; then
    check_pass "HTTPS accessible (HTTP ${HTTP_STATUS})"
else
    check_fail "HTTPS not accessible (timeout or connection error)"
fi

# Summary
echo ""
echo "=========================================="
echo "Summary: ${pass_count} passed, ${fail_count} failed"
echo "=========================================="

if [[ ${fail_count} -eq 0 ]]; then
    echo -e "${COLOR_PASS}All checks passed!${COLOR_RESET}"
    exit 0
else
    echo -e "${COLOR_FAIL}Some checks failed${COLOR_RESET}"
    exit 1
fi
