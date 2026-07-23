#!/usr/bin/bash
#
# Run the DOM reordering test with proper NixOS dependencies
#

nix-shell -p chromium nodejs nodePackages.nodejs --run "node verify-dom-reordering-playwright.js"
