#!/bin/bash
# Multi-Pattern Regex Search for Filter Change Handlers
# Part of Method 3: Multi-Pattern Regex Search

echo "# Pattern 1: Basic event listeners (click, change, input)"
echo "===================================================================="
grep -nE "\.addEventListener\(['\"]click|change|input['\"]," /home/coding/vista/src/public/app.js

echo ""
echo "# Pattern 2: Guard flag + renderPreviews (multi-line)"
echo "===================================================================="
grep -Pzo "isFilterOperation\s*=\s*true[^}]*renderPreviews\(" /home/coding/vista/src/public/app.js | tr '\0' '\n' | grep -n "."

echo ""
echo "# Pattern 3: Filter state modifications"
echo "===================================================================="
grep -nE "(platformPrefs\.(hidden|favorites)\.(add|delete|clear)|disabledTags\.(add|delete|clear))" /home/coding/vista/src/public/app.js

echo ""
echo "# Pattern 4: Optional chaining event listeners"
echo "===================================================================="
grep -nE "\?\.addEventListener\(['\"]click|change|input['\"]," /home/coding/vista/src/public/app.js

echo ""
echo "# Pattern 5: forEach event listener registration"
echo "===================================================================="
grep -Pzo "forEach[^}]*addEventListener" /home/coding/vista/src/public/app.js | tr '\0' '\n' | grep -n "."
