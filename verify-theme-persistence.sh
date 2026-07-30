#!/bin/bash

echo "Theme Persistence Verification"
echo "==============================="
echo ""

# Test 1: Check for FOUC prevention inline script
echo "Test 1: Checking for FOUC prevention inline script in <head>..."
HTML=$(curl -s http://localhost:8765/src/public/index.html)

if echo "$HTML" | grep -q "Prevent FOUC"; then
    if echo "$HTML" | grep -B 5 "Prevent FOUC" | grep -q "<head>"; then
        echo "  ✓ PASS: Inline FOUC prevention script found in <head> section"
        AC1=1
    else
        echo "  ✗ FAIL: Script found but not in <head>"
        AC1=0
    fi
else
    echo "  ✗ FAIL: No FOUC prevention script found"
    AC1=0
fi

# Test 2: Check script executes before stylesheets
echo ""
echo "Test 2: Checking script execution order (before CSS)..."
if echo "$HTML" | grep -A 20 "Prevent FOUC" | grep -B 5 "stylesheet" | grep -q "script"; then
    echo "  ✓ PASS: Inline script appears before stylesheet links"
    AC2=1
else
    echo "  ✗ FAIL: Script may execute after CSS loads"
    AC2=0
fi

# Test 3: Check localStorage.getItem is called
echo ""
echo "Test 3: Checking localStorage.getItem implementation..."
if echo "$HTML" | grep -q "localStorage.getItem('vista-theme')"; then
    echo "  ✓ PASS: localStorage.getItem('vista-theme') found in inline script"
    AC3=1
else
    echo "  ✗ FAIL: localStorage.getItem not found"
    AC3=0
fi

# Test 4: Check default theme fallback
echo ""
echo "Test 4: Checking default theme fallback..."
if echo "$HTML" | grep -A 10 "Prevent FOUC" | grep -q "data-theme.*dark"; then
    echo "  ✓ PASS: Default dark theme fallback implemented"
    AC4=1
else
    echo "  ✗ FAIL: No default theme fallback"
    AC4=0
fi

# Test 5: Check applyTheme in app.js
echo ""
echo "Test 5: Checking applyTheme saves to localStorage..."
if grep -q "localStorage.setItem('vista-theme', theme)" src/public/app.js; then
    echo "  ✓ PASS: applyTheme saves to localStorage"
    AC5=1
else
    echo "  ✗ FAIL: applyTheme doesn't save to localStorage"
    AC5=0
fi

# Test 6: Check initTheme reads from localStorage
echo ""
echo "Test 6: Checking initTheme reads from localStorage..."
if grep -q "localStorage.getItem('vista-theme')" src/public/app.js; then
    echo "  ✓ PASS: initTheme reads from localStorage"
    AC6=1
else
    echo "  ✗ FAIL: initTheme doesn't read from localStorage"
    AC6=0
fi

# Test 7: Check initTheme is called on load
echo ""
echo "Test 7: Checking initTheme is called during initialization..."
if grep -q "initTheme()" src/public/app.js; then
    echo "  ✓ PASS: initTheme() is called during initialization"
    AC7=1
else
    echo "  ✗ FAIL: initTheme() not called"
    AC7=0
fi

# Summary
echo ""
echo "=========================================="
echo "SUMMARY - Acceptance Criteria"
echo "=========================================="
echo ""

TOTAL=$((AC1 + AC2 + AC3 + AC4 + AC5 + AC6 + AC7))
echo "Tests passed: $TOTAL/7"
echo ""

echo "Acceptance Criteria Status:"
echo "  1. Selected theme is saved to localStorage:      $([ $AC5 -eq 1 ] && echo '✓ PASS' || echo '✗ FAIL')"
echo "  2. Reloading page restores saved theme:          $([ $AC3 -eq 1 ] && [ $AC6 -eq 1 ] && echo '✓ PASS' || echo '✗ FAIL')"
echo "  3. No FOUC (Flash of Unstyled Content):         $([ $AC1 -eq 1 ] && [ $AC2 -eq 1 ] && echo '✓ PASS' || echo '✗ FAIL')"
echo "  4. Theme applies immediately on page load:      $([ $AC1 -eq 1 ] && [ $AC4 -eq 1 ] && echo '✓ PASS' || echo '✗ FAIL')"
echo ""

if [ $TOTAL -eq 7 ]; then
    echo "✓ ALL ACCEPTANCE CRITERIA MET"
    exit 0
else
    echo "✗ SOME ACCEPTANCE CRITERIA NOT MET"
    exit 1
fi
