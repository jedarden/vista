#!/bin/bash
# Verification script for vista.jedarden.com CNAME record
# Task: bf-34mk5 - Add Cloudflare DNS CNAME for vista.jedarden.com

set -euo pipefail

DOMAIN="vista.jedarden.com"
EXPECTED_TARGET="cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com"
MAX_ATTEMPTS=30
ATTEMPT_DELAY=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check CNAME record
check_cname() {
    local attempt=0

    while [ $attempt -lt $MAX_ATTEMPTS ]; do
        attempt=$((attempt + 1))
        echo ""
        log_info "Checking CNAME record (attempt $attempt/$MAX_ATTEMPTS)..."

        # Try to get CNAME record
        local cname_output
        if command -v host &> /dev/null; then
            cname_output=$(host -t cname "$DOMAIN" 2>&1 || true)

            if echo "$cname_output" | grep -q "is an alias for"; then
                local actual_target
                actual_target=$(echo "$cname_output" | sed 's/.*is an alias for //')

                log_info "CNAME found: $DOMAIN → $actual_target"

                if [ "$actual_target" = "$EXPECTED_TARGET." ]; then
                    log_info "✅ CNAME points to correct target!"
                    return 0
                else
                    log_error "❌ CNAME points to wrong target!"
                    log_error "   Expected: $EXPECTED_TARGET"
                    log_error "   Actual:   $actual_target"
                    return 1
                fi
            else
                log_warn "CNAME record not found yet. Output:"
                echo "$cname_output"
            fi
        else
            log_error " 'host' command not available. Trying with 'nslookup'..."

            if command -v nslookup &> /dev/null; then
                local nslookup_output
                nslookup_output=$(nslookup -query=CNAME "$DOMAIN" 2>&1 || true)

                if echo "$nslookup_output" | grep -q "canonical name ="; then
                    log_info "✅ CNAME record found!"
                    echo "$nslookup_output"

                    if echo "$nslookup_output" | grep -q "$EXPECTED_TARGET"; then
                        log_info "✅ CNAME points to correct target!"
                        return 0
                    else
                        log_error "❌ CNAME points to wrong target!"
                        log_error "   Expected substring: $EXPECTED_TARGET"
                        return 1
                    fi
                else
                    log_warn "CNAME not found in nslookup output"
                    echo "$nslookup_output"
                fi
            else
                log_error "Neither 'host' nor 'nslookup' commands available"
                log_error "Please install dnsutils package"
                return 1
            fi
        fi

        if [ $attempt -lt $MAX_ATTEMPTS ]; then
            log_warn "Waiting ${ATTEMPT_DELAY}s before retry..."
            sleep $ATTEMPT_DELAY
        fi
    done

    log_error "❌ Failed to verify CNAME after $MAX_ATTEMPTS attempts"
    return 1
}

# Function to check basic DNS resolution
check_dns_resolution() {
    log_info "Checking basic DNS resolution for $DOMAIN..."

    local resolve_output
    if command -v host &> /dev/null; then
        resolve_output=$(host "$DOMAIN" 2>&1 || true)

        if echo "$resolve_output" | grep -q "has address"; then
            log_info "✅ Domain resolves to IP addresses"
            echo "$resolve_output" | grep "has address"
        elif echo "$resolve_output" | grep -q "is an alias for"; then
            log_info "✅ Domain resolves via CNAME"
            echo "$resolve_output"
        else
            log_warn "Unexpected DNS resolution output:"
            echo "$resolve_output"
        fi
    else
        log_warn "Skipping detailed resolution check (host command unavailable)"
    fi
}

# Main execution
main() {
    echo "==================================="
    echo "Vista CNAME Verification"
    echo "Domain: $DOMAIN"
    echo "Expected Target: $EXPECTED_TARGET"
    echo "==================================="

    # Check basic resolution first
    check_dns_resolution

    # Check CNAME specifically
    if check_cname; then
        echo ""
        log_info "🎉 SUCCESS: All verification checks passed!"
        log_info "CNAME record for $DOMAIN is properly configured."
        return 0
    else
        echo ""
        log_error "❌ FAILURE: CNAME verification failed"
        log_error ""
        log_error "Troubleshooting steps:"
        log_error "1. Verify CNAME was created in Cloudflare dashboard"
        log_error "2. Check proxy status is 'DNS only' (gray cloud)"
        log_error "3. Ensure target is: $EXPECTED_TARGET"
        log_error "4. Wait for DNS propagation (can take up to 24 hours)"
        log_error "5. Run this script again to verify"
        return 1
    fi
}

main "$@"
