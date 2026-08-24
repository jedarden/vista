#!/bin/bash
# Verification script for bead database connectivity and workspace configuration
# Part of bead vista-e663016d

set -euo pipefail

echo "================================"
echo "Bead Database Connectivity Test"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

# Helper functions
pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    FAIL_COUNT=$((FAIL_COUNT + 1))
}

warn() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
}

# Test 1: Verify workspace path
echo "=== Test 1: Workspace Path Verification ==="
WORKSPACE_PATH="/home/coding/vista"
if [ -d "$WORKSPACE_PATH" ]; then
    pass "Workspace directory exists: $WORKSPACE_PATH"
else
    fail "Workspace directory missing: $WORKSPACE_PATH"
fi

if [ "$(pwd)" = "$WORKSPACE_PATH" ]; then
    pass "Current working directory is correct: $(pwd)"
else
    warn "Current directory is $(pwd), not $WORKSPACE_PATH"
fi

# Test 2: Bead directory structure
echo ""
echo "=== Test 2: Bead Directory Structure ==="
BEADS_DIR="$WORKSPACE_PATH/.beads"
BEADS_DB="$BEADS_DIR/beads.db"

if [ -d "$BEADS_DIR" ]; then
    pass "Beads directory exists: $BEADS_DIR"
else
    fail "Beads directory missing: $BEADS_DIR"
fi

if [ -f "$BEADS_DB" ]; then
    pass "Bead database file exists: $BEADS_DB"
else
    fail "Bead database file missing: $BEADS_DB"
fi

# Test 3: File permissions
echo ""
echo "=== Test 3: File Permissions ==="

# Check directory permissions
DIR_PERMS=$(stat -c '%a' "$BEADS_DIR" 2>/dev/null || echo "000")
if [ "$DIR_PERMS" = "755" ]; then
    pass "Beads directory has correct permissions: 755"
else
    warn "Beads directory permissions are $DIR_PERMS (expected 755)"
fi

# Check database file permissions
DB_PERMS=$(stat -c '%a' "$BEADS_DB" 2>/dev/null || echo "000")
if [ "$DB_PERMS" = "644" ]; then
    pass "Bead database file has correct permissions: 644"
else
    warn "Bead database file permissions are $DB_PERMS (expected 644)"
fi

# Check ownership
DIR_OWNER=$(stat -c '%U:%G' "$BEADS_DIR" 2>/dev/null || echo "unknown")
DB_OWNER=$(stat -c '%U:%G' "$BEADS_DB" 2>/dev/null || echo "unknown")
if [ "$DIR_OWNER" = "coding:coding" ] && [ "$DB_OWNER" = "coding:coding" ]; then
    pass "Beads directory and database are owned by coding:coding"
else
    warn "Ownership: directory=$DIR_OWNER, database=$DB_OWNER"
fi

# Test 4: Database type and validity
echo ""
echo "=== Test 4: Database Type and Validity ==="

DB_TYPE=$(file "$BEADS_DB" 2>/dev/null || echo "unknown")
if echo "$DB_TYPE" | grep -q "SQLite 3.x database"; then
    pass "Database is valid SQLite 3.x format"
else
    fail "Database is not valid SQLite: $DB_TYPE"
fi

# Test 5: Database connectivity
echo ""
echo "=== Test 5: Database Connectivity ==="

if command -v sqlite3 >/dev/null 2>&1; then
    # Test basic connectivity
    if sqlite3 "$BEADS_DB" "PRAGMA integrity_check;" >/dev/null 2>&1; then
        INTEGRITY_RESULT=$(sqlite3 "$BEADS_DB" "PRAGMA integrity_check;" 2>&1)
        if [ "$INTEGRITY_RESULT" = "ok" ]; then
            pass "Database integrity check passed: $INTEGRITY_RESULT"
        else
            fail "Database integrity check failed: $INTEGRITY_RESULT"
        fi
    else
        fail "Cannot connect to database with sqlite3"
    fi

    # Test table accessibility
    TABLES=$(sqlite3 "$BEADS_DB" ".tables" 2>&1)
    if [ $? -eq 0 ]; then
        TABLE_COUNT=$(echo "$TABLES" | wc -w)
        pass "Database tables accessible: $TABLE_COUNT tables found"

        # Verify expected tables exist
        EXPECTED_TABLES="issues dependencies labels comments workspace"
        for table in $EXPECTED_TABLES; do
            if echo "$TABLES" | grep -q "$table"; then
                pass "Expected table '$table' exists"
            else
                fail "Expected table '$table' missing"
            fi
        done
    else
        fail "Cannot list database tables: $TABLES"
    fi

    # Test data accessibility
    ISSUE_COUNT=$(sqlite3 "$BEADS_DB" "SELECT COUNT(*) FROM issues;" 2>&1)
    if [ $? -eq 0 ]; then
        pass "Database query successful: $ISSUE_COUNT issues in database"
    else
        fail "Cannot query database: $ISSUE_COUNT"
    fi

else
    warn "sqlite3 command not available, skipping database connectivity tests"
fi

# Test 6: Pluck/NEEDLE configuration
echo ""
echo "=== Test 6: Pluck/NEEDLE Configuration ==="

GLOBAL_NEEDLE_CONFIG="/home/coding/.config/needle/config.yaml"
LOCAL_NEEDLE_CONFIG="$WORKSPACE_PATH/.needle.yaml"

if [ -f "$GLOBAL_NEEDLE_CONFIG" ]; then
    pass "Global NEEDLE config exists: $GLOBAL_NEEDLE_CONFIG"

    DEFAULT_WORKSPACE=$(grep -A1 "workspace:" "$GLOBAL_NEEDLE_CONFIG" | grep "default:" | awk '{print $2}' || echo "not found")
    if [ -n "$DEFAULT_WORKSPACE" ]; then
        echo "  → Default workspace: $DEFAULT_WORKSPACE"
        if [ "$DEFAULT_WORKSPACE" = "$WORKSPACE_PATH" ]; then
            pass "Default workspace matches current workspace"
        else
            warn "Default workspace ($DEFAULT_WORKSPACE) differs from current ($WORKSPACE_PATH)"
        fi
    fi
else
    warn "Global NEEDLE config not found: $GLOBAL_NEEDLE_CONFIG"
fi

if [ -f "$LOCAL_NEEDLE_CONFIG" ]; then
    pass "Local NEEDLE config exists: $LOCAL_NEEDLE_CONFIG"

    # Check backend configuration
    BACKEND=$(grep "backend:" "$LOCAL_NEEDLE_CONFIG" | awk '{print $2}' || echo "not found")
    if [ "$BACKEND" = "bead-rs" ]; then
        pass "Local config specifies correct backend: $BACKEND"
    else
        warn "Local config backend: $BACKEND (expected bead-rs)"
    fi
else
    warn "Local NEEDLE config not found: $LOCAL_NEEDLE_CONFIG"
fi

# Test 7: Pluck strand configuration
echo ""
echo "=== Test 7: Pluck Strand Configuration ==="

if [ -f "$GLOBAL_NEEDLE_CONFIG" ]; then
    # Check if pluck strand is configured
    if grep -q "strands:" "$GLOBAL_NEEDLE_CONFIG"; then
        pass "Pluck strand configuration exists in global config"

        # Extract pluck configuration
        if grep -A10 "pluck:" "$GLOBAL_NEEDLE_CONFIG" >/dev/null 2>&1; then
            echo "  → Pluck strand is configured"
        fi
    else
        warn "No strands configuration found in global config"
    fi
fi

# Summary
echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed${NC}"
    echo "Bead database is accessible and properly configured."
    exit 0
else
    echo -e "${RED}✗ Some checks failed - review output above${NC}"
    exit 1
fi
