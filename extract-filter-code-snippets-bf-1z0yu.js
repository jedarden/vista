#!/usr/bin/env node
/**
 * Extract full code snippets for filter-related hooks
 * Task: bf-1z0yu
 */

const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'src/public/app.js');
const content = fs.readFileSync(appJsPath, 'utf8');
const lines = content.split('\n');

// Handler locations from the extraction script
const handlers = [
    // Cropper Functions
    { name: 'updateEnabledPlatforms', line: 3551, category: 'Cropper Functions' },
    { name: 'updateCropperOverlay', line: 3600, category: 'Cropper Functions' },

    // Non-Order-Reset Handlers
    { name: 'renderMetadataTable', line: 3941, category: 'Non-Order-Reset Handlers' },
    { name: 'updateBadgePreview', line: 4765, category: 'Non-Order-Reset Handlers' },
    { name: 'handleHeatmapSort', line: 6101, category: 'Non-Order-Reset Handlers' },
    { name: 'toggleFavorite', line: 7867, category: 'Non-Order-Reset Handlers' },

    // Guard System Functions
    { name: 'shouldDeferFilterOperation', line: 7891, category: 'Guard System Functions' },
    { name: 'isSmartOrdering', line: 7933, category: 'Guard System Functions' },
    { name: 'queueFilterOperation', line: 7942, category: 'Guard System Functions' },
    { name: 'processPendingFilterOperations', line: 7952, category: 'Guard System Functions' },

    // Order-Reset Handlers
    { name: 'toggleHidden', line: 7977, category: 'Order-Reset Handlers' },
    { name: 'importPreferences', line: 8057, category: 'Order-Reset Handlers' },
    { name: 'toggleWhatIfMode', line: 8121, category: 'Order-Reset Handlers' },
    { name: 'applyWhatIfChanges', line: 8241, category: 'Order-Reset Handlers' },

    // OG Generator Functions
    { name: 'handleBgTypeChange', line: 5106, category: 'OG Generator Functions' },
    { name: 'handleLogoPosChange', line: 5133, category: 'OG Generator Functions' },
    { name: 'updateOggenCanvas', line: 5156, category: 'OG Generator Functions' },

    // Additional handler
    { name: 'filterCommands', line: 9177, category: 'Non-Order-Reset Handlers' },
];

/**
 * Extract a complete function starting from the given line number
 */
function extractFunction(startLine) {
    const startIndex = startLine - 1;
    if (startIndex >= lines.length) return null;

    const firstLine = lines[startIndex];
    const startIndent = firstLine.match(/^\s*/)[0].length;
    let braceCount = 0;
    let inFunction = false;
    let endIndex = startIndex;

    // Find the opening brace
    for (let i = startIndex; i < Math.min(startIndex + 10, lines.length); i++) {
        const line = lines[i];
        if (line.includes('{')) {
            inFunction = true;
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;
            endIndex = i;
            break;
        }
    }

    if (!inFunction) return null;

    // Find the closing brace
    for (let i = endIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        endIndex = i;

        if (braceCount === 0) {
            // Found the closing brace
            break;
        }
    }

    // Extract the function lines
    const functionLines = lines.slice(startIndex, endIndex + 1);

    // Add line numbers
    return functionLines.map((line, index) => {
        const lineNum = startIndex + index + 1;
        return {
            lineNum,
            code: line
        };
    });
}

/**
 * Format a code snippet with line numbers
 */
function formatCodeSnippet(functionData) {
    if (!functionData) return '';

    const maxLineNumLength = functionData[functionData.length - 1].lineNum.toString().length;

    return functionData.map(({ lineNum, code }) => {
        const paddedLineNum = lineNum.toString().padStart(maxLineNumLength, ' ');
        return `${paddedLineNum} | ${code}`;
    }).join('\n');
}

// Extract all handlers
const results = [];
const categorizedResults = {};

handlers.forEach(handler => {
    console.log(`Extracting ${handler.name} from line ${handler.line}...`);
    const functionData = extractFunction(handler.line);

    const result = {
        name: handler.name,
        line: handler.line,
        category: handler.category,
        snippet: functionData ? formatCodeSnippet(functionData) : '',
        lines: functionData ? functionData.length : 0
    };

    results.push(result);

    if (!categorizedResults[handler.category]) {
        categorizedResults[handler.category] = [];
    }
    categorizedResults[handler.category].push(result);
});

// Generate markdown output
let markdown = '# Filter-Related Hooks Code Snippets\n\n';
markdown += `**Generated:** ${new Date().toISOString().split('T')[0]}\n`;
markdown += `**Source:** src/public/app.js\n`;
markdown += `**Task:** bf-1z0yu\n\n`;
markdown += `**Total handlers extracted:** ${results.length}\n\n`;

// Add categorized results
Object.keys(categorizedResults).sort().forEach(category => {
    markdown += `## ${category}\n\n`;

    categorizedResults[category].forEach(handler => {
        markdown += `### ${handler.name}\n\n`;
        markdown += `**Line:** ${handler.line}\n`;
        markdown += `**Lines of code:** ${handler.lines}\n\n`;
        markdown += '```javascript\n';
        markdown += handler.snippet;
        markdown += '\n```\n\n';
        markdown += '---\n\n';
    });
});

// Save to file
const outputPath = path.join(__dirname, 'notes/bf-1z0yu-filter-hooks-code-snippets.md');
fs.writeFileSync(outputPath, markdown);

console.log(`\n✅ Extracted ${results.length} filter-related hooks`);
console.log(`📝 Results saved to: ${outputPath}`);

// Print summary
console.log('\n## Extraction Summary:\n');
Object.keys(categorizedResults).forEach(category => {
    console.log(`${category}: ${categorizedResults[category].length}`);
});
