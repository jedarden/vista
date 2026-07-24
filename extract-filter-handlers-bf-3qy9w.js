#!/usr/bin/env node
/**
 * Extract filter change handler names and line numbers from app.js
 * Task: bf-3qy9w
 */

const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'src/public/app.js');
const content = fs.readFileSync(appJsPath, 'utf8');
const lines = content.split('\n');

// Handler patterns to search for
const handlerPatterns = [
    // Primary filter change handlers
    { name: 'toggleFavorite', pattern: /function toggleFavorite\(/, type: 'method' },
    { name: 'toggleHidden', pattern: /function toggleHidden\(/, type: 'method' },
    { name: 'importPreferences', pattern: /function importPreferences\(/, type: 'method' },
    { name: 'toggleWhatIfMode', pattern: /function toggleWhatIfMode\(/, type: 'method' },
    { name: 'applyWhatIfChanges', pattern: /function applyWhatIfChanges\(/, type: 'method' },
    { name: 'renderMetadataTable', pattern: /function renderMetadataTable\(/, type: 'method' },
    { name: 'filterCommands', pattern: /function filterCommands\(/, type: 'method' },
    { name: 'handleHeatmapSort', pattern: /function handleHeatmapSort\(/, type: 'method' },
    { name: 'updateBadgePreview', pattern: /function updateBadgePreview\(/, type: 'method' },

    // Guard system functions
    { name: 'shouldDeferFilterOperation', pattern: /function shouldDeferFilterOperation\(/, type: 'method' },
    { name: 'isSmartOrdering', pattern: /function isSmartOrdering\(/, type: 'method' },
    { name: 'queueFilterOperation', pattern: /function queueFilterOperation\(/, type: 'method' },
    { name: 'processPendingFilterOperations', pattern: /function processPendingFilterOperations\(/, type: 'method' },

    // OG Generator functions
    { name: 'handleBgTypeChange', pattern: /function handleBgTypeChange\(/, type: 'event-listener' },
    { name: 'handleLogoPosChange', pattern: /function handleLogoPosChange\(/, type: 'event-listener' },
    { name: 'updateOggenCanvas', pattern: /function updateOggenCanvas\(/, type: 'method' },

    // Cropper functions
    { name: 'updateEnabledPlatforms', pattern: /function updateEnabledPlatforms\(/, type: 'method' },
    { name: 'updateCropperOverlay', pattern: /function updateCropperOverlay\(/, type: 'method' },
];

// Find handlers
const foundHandlers = [];

lines.forEach((line, index) => {
    const lineNumber = index + 1;

    handlerPatterns.forEach(handler => {
        if (handler.pattern.test(line) && !foundHandlers.find(h => h.name === handler.name)) {
            foundHandlers.push({
                name: handler.name,
                line: lineNumber,
                type: handler.type,
                definition: line.trim()
            });
        }
    });
});

// Sort by line number
foundHandlers.sort((a, b) => a.line - b.line);

// Categorize handlers
const orderResetHandlers = foundHandlers.filter(h =>
    ['toggleHidden', 'importPreferences', 'toggleWhatIfMode', 'applyWhatIfChanges'].includes(h.name)
);

const nonOrderResetHandlers = foundHandlers.filter(h =>
    ['toggleFavorite', 'renderMetadataTable', 'filterCommands', 'handleHeatmapSort', 'updateBadgePreview'].includes(h.name)
);

const guardSystemHandlers = foundHandlers.filter(h =>
    ['shouldDeferFilterOperation', 'isSmartOrdering', 'queueFilterOperation', 'processPendingFilterOperations'].includes(h.name)
);

const auxiliaryHandlers = foundHandlers.filter(h =>
    ['handleBgTypeChange', 'handleLogoPosChange', 'updateOggenCanvas', 'updateEnabledPlatforms', 'updateCropperOverlay'].includes(h.name)
);

// Generate output
console.log('# Filter Change Handler Names and Line Numbers');
console.log('# Extracted from /home/coding/vista/src/public/app.js');
console.log('# Generated:', new Date().toISOString().split('T')[0]);
console.log('# Task: bf-3qy9w');
console.log('');

console.log('## PRIMARY FILTER CHANGE HANDLERS');
console.log('');

console.log('### Order-Reset Handlers (set isFilterOperation guard flag)');
orderResetHandlers.forEach(handler => {
    console.log(`${handler.name} - Line ${handler.line} (${handler.type})`);
});
console.log('');

console.log('### Non-Order-Reset Handlers (no guard flag)');
nonOrderResetHandlers.forEach(handler => {
    console.log(`${handler.name} - Line ${handler.line} (${handler.type})`);
});
console.log('');

console.log('### Guard System Functions');
guardSystemHandlers.forEach(handler => {
    console.log(`${handler.name} - Line ${handler.line} (${handler.type})`);
});
console.log('');

console.log('## AUXILIARY FILTER-RELATED FUNCTIONS');
console.log('');

console.log('### OG Generator Functions');
auxiliaryHandlers.filter(h => ['handleBgTypeChange', 'handleLogoPosChange', 'updateOggenCanvas'].includes(h.name))
    .forEach(handler => {
        console.log(`${handler.name} - Line ${handler.line} (${handler.type})`);
    });
console.log('');

console.log('### Cropper Functions');
auxiliaryHandlers.filter(h => ['updateEnabledPlatforms', 'updateCropperOverlay'].includes(h.name))
    .forEach(handler => {
        console.log(`${handler.name} - Line ${handler.line} (${handler.type})`);
    });
console.log('');

console.log('## COMPREHENSIVE SUMMARY');
console.log('');
console.log(`**Total handlers found: ${foundHandlers.length}**`);
console.log(`- Order-reset handlers: ${orderResetHandlers.length}`);
console.log(`- Non-order-reset handlers: ${nonOrderResetHandlers.length}`);
console.log(`- Guard system handlers: ${guardSystemHandlers.length}`);
console.log(`- Auxiliary handlers: ${auxiliaryHandlers.length}`);
console.log('');

console.log('## HANDLER TYPES');
console.log('');
const typeCounts = {};
foundHandlers.forEach(handler => {
    typeCounts[handler.type] = (typeCounts[handler.type] || 0) + 1;
});
Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`- ${type}: ${count}`);
});
console.log('');

console.log('## DETAILED HANDLER LIST');
console.log('');
foundHandlers.forEach(handler => {
    console.log(`\`${handler.name}\` - Line ${handler.line}`);
    console.log(`  Type: ${handler.type}`);
    console.log(`  Definition: ${handler.definition.substring(0, 80)}...`);
    console.log('');
});

// Save to file
const outputPath = path.join(__dirname, 'notes/bf-3qy9w-filter-handlers-extracted.md');
fs.writeFileSync(outputPath, `# Filter Change Handler Extraction - bf-3qy9w

Generated: ${new Date().toISOString().split('T')[0]}
Source: src/public/app.js (${lines.length} lines)

## Summary
Total handlers found: ${foundHandlers.length}

## Complete Handler List

${foundHandlers.map(h => `### ${h.name}
- **Line:** ${h.line}
- **Type:** ${h.type}
- **Definition:** \`${h.definition.substring(0, 100)}\`
`).join('\n')}
`);

console.log(`✅ Results saved to: ${outputPath}`);
