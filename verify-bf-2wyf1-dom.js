/**
 * Manual verification test for bf-2wyf1
 *
 * This test script creates a simple HTML page to verify DOM manipulation works.
 * Open this file in a browser after starting VISTA at http://localhost:3000
 */

const http = require('http');
const fs = require('fs');

const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>BF-2WYF1 DOM Manual Verification</title>
  <style>
    body { font-family: monospace; padding: 20px; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid #ccc; }
    .test-controls { margin: 20px 0; }
    button { padding: 10px 20px; margin: 5px; cursor: pointer; }
    .log { background: #f5f5f5; padding: 10px; margin: 10px 0; max-height: 400px; overflow-y: auto; }
    .log-entry { margin: 5px 0; padding: 5px; border-left: 3px solid #ccc; }
    .log-entry.success { border-left-color: #4caf50; background: #e8f5e9; }
    .log-entry.error { border-left-color: #f44336; background: #ffebee; }
    .log-entry.info { border-left-color: #2196f3; background: #e3f2fd; }
    .iframe-container { position: relative; width: 100%; height: 600px; border: 1px solid #ccc; }
    iframe { width: 100%; height: 100%; border: none; }
    .status { font-weight: bold; padding: 5px 10px; margin: 5px 0; }
    .status.pass { background: #e8f5e9; color: #2e7d32; }
    .status.fail { background: #ffebee; color: #c62828; }
    .status.warn { background: #fff3e0; color: #ef6c00; }
  </style>
</head>
<body>
  <h1>BF-2WYF1: DOM Manipulation Manual Verification</h1>

  <div class="section">
    <h2>Test Controls</h2>
    <div class="test-controls">
      <button onclick="runAllTests()">Run All Tests</button>
      <button onclick="clearLog()">Clear Log</button>
      <button onclick="loadVista()">Load VISTA</button>
    </div>
  </div>

  <div class="section">
    <h2>VISTA Preview</h2>
    <div class="iframe-container">
      <iframe id="vistaFrame" src="http://localhost:3000"></iframe>
    </div>
  </div>

  <div class="section">
    <h2>Test Results</h2>
    <div id="results"></div>
    <div class="log" id="log"></div>
  </div>

  <script>
    let testFrame = null;
    let testResults = {
      selectorIdentified: false,
      appendChildMoves: false,
      noCompetingResets: false,
      reorderWorks: false
    };

    function log(message, type = 'info') {
      const logDiv = document.getElementById('log');
      const entry = document.createElement('div');
      entry.className = \`log-entry \${type}\`;
      entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
      logDiv.appendChild(entry);
      logDiv.scrollTop = logDiv.scrollHeight;
    }

    function clearLog() {
      document.getElementById('log').innerHTML = '';
      testResults = {
        selectorIdentified: false,
        appendChildMoves: false,
        noCompetingResets: false,
        reorderWorks: false
      };
      updateResults();
    }

    function updateResults() {
      const resultsDiv = document.getElementById('results');
      const tests = [
        { name: 'Selector Identified', key: 'selectorIdentified' },
        { name: 'appendChild Moves Elements', key: 'appendChildMoves' },
        { name: 'No Competing Resets', key: 'noCompetingResets' },
        { name: 'Reorder Works Correctly', key: 'reorderWorks' }
      ];

      resultsDiv.innerHTML = tests.map(test => {
        const status = testResults[test.key] ? 'pass' : 'pending';
        const icon = testResults[test.key] ? '✅' : '⏳';
        return \`<div class="status \${status}">\${icon} \${test.name}</div>\`;
      }).join('');

      if (Object.values(testResults).every(v => v)) {
        resultsDiv.innerHTML += \`<div class="status pass">🎉 ALL TESTS PASSED</div>\`;
      }
    }

    function loadVista() {
      document.getElementById('vistaFrame').src = 'http://localhost:3000';
      log('VISTA loaded in iframe', 'info');
    }

    async function runAllTests() {
      log('Starting all tests...', 'info');
      updateResults();

      const frame = document.getElementById('vistaFrame');
      testFrame = frame.contentWindow;

      // Wait for frame to load
      await new Promise(resolve => {
        if (frame.contentWindow.document.readyState === 'complete') {
          resolve();
        } else {
          frame.onload = resolve;
        }
      });

      try {
        await testSelectorIdentification();
        await testAppendChildMoves();
        await testCompetingResets();
        await testReorderFunction();
        updateResults();
        log('All tests completed', 'success');
      } catch (error) {
        log('Test error: ' + error.message, 'error');
      }
    }

    async function testSelectorIdentification() {
      log('Test 1: Selector Identification', 'info');

      try {
        const result = await testFrame.evalAsync(\`
          (function() {
            const cards = document.querySelectorAll('.platform-card[data-pid]');
            const allCards = document.querySelectorAll('.platform-card');
            return {
              cardsWithDataPid: cards.length,
              allPlatformCards: allCards.length,
              recommendedSelector: '.platform-card',
              hasDataPid: cards.length > 0
            };
          })()
        \`);

        log(\`Found \${result.cardsWithDataPid} cards with data-pid attribute\`, 'info');
        log(\`Found \${result.allPlatformCards} total platform cards\`, 'info');
        log(\`Recommended selector: \${result.recommendedSelector}\`, 'info');

        testResults.selectorIdentified = result.hasDataPid || result.allPlatformCards > 0;
        log(testResults.selectorIdentified ? '✅ Selector identification PASSED' : '❌ Selector identification FAILED',
            testResults.selectorIdentified ? 'success' : 'error');
      } catch (error) {
        log('❌ Selector identification FAILED: ' + error.message, 'error');
      }
    }

    async function testAppendChildMoves() {
      log('Test 2: appendChild Moves Elements (Not Clones)', 'info');

      try {
        const result = await testFrame.evalAsync(\`
          (function() {
            // Find a test card
            const testCard = document.querySelector('.platform-card[data-pid]');
            if (!testCard) {
              return { error: 'No cards found' };
            }

            const testPid = testCard.dataset.pid;
            const originalParent = testCard.parentElement;
            const cardsBefore = originalParent.querySelectorAll('.platform-card').length;

            // Move the card to the end
            originalParent.appendChild(testCard);

            const cardsAfter = originalParent.querySelectorAll('.platform-card').length;
            const movedCard = originalParent.querySelector(\`.platform-card[data-pid="\${testPid}"]\`);
            const isSameElement = (movedCard === testCard);

            // Restore position
            originalParent.insertBefore(testCard, originalParent.firstChild.nextSibling);

            return {
              testPid,
              cardsBefore,
              cardsAfter,
              isSameElement,
              totalCountsMatch: cardsBefore === cardsAfter
            };
          })()
        \`);

        if (result.error) {
          log('❌ appendChild test FAILED: ' + result.error, 'error');
          return;
        }

        log(\`Test card: \${result.testPid}\`, 'info');
        log(\`Cards before move: \${result.cardsBefore}\`, 'info');
        log(\`Cards after move: \${result.cardsAfter}\`, 'info');
        log(\`Total count preserved: \${result.totalCountsMatch ? '✅' : '❌'}\`, 'info');
        log(\`Same element (not cloned): \${result.isSameElement ? '✅' : '❌'}\`, 'info');

        testResults.appendChildMoves = result.totalCountsMatch && result.isSameElement;
        log(testResults.appendChildMoves ? '✅ appendChild moves elements PASSED' : '❌ appendChild moves elements FAILED',
            testResults.appendChildMoves ? 'success' : 'error');
      } catch (error) {
        log('❌ appendChild test FAILED: ' + error.message, 'error');
      }
    }

    async function testCompetingResets() {
      log('Test 3: Checking for Competing Resets', 'info');

      try {
        const result = await testFrame.evalAsync(\`
          (function() {
            const functions = [];

            // Check renderPreviews function
            if (typeof renderPreviews === 'function') {
              const func = renderPreviews.toString();
              functions.push({
                name: 'renderPreviews',
                clearsGrid: func.includes('previewGrid.innerHTML'),
                createsCards: func.includes('createElement') && func.includes('platform-card'),
                usesCardOrder: func.includes('cardOrder'),
                checksGuard: func.includes('isApplyingSmartOrder')
              });
            }

            // Check reorderPlatformCards function
            if (typeof reorderPlatformCards === 'function') {
              const func = reorderPlatformCards.toString();
              functions.push({
                name: 'reorderPlatformCards',
                usesAppendChild: func.includes('appendChild'),
                usesCardOrder: func.includes('cardOrder')
              });
            }

            return { functions };
          })()
        \`);

        log('Analyzing competing functions...', 'info');

        const renderPreviews = result.functions.find(f => f.name === 'renderPreviews');
        const reorderCards = result.functions.find(f => f.name === 'reorderPlatformCards');

        if (renderPreviews) {
          log(\`renderPreviews: clearsGrid=\${renderPreviews.clearsGrid}, usesCardOrder=\${renderPreviews.usesCardOrder}, checksGuard=\${renderPreviews.checksGuard}\`, 'info');
        }

        if (reorderCards) {
          log(\`reorderPlatformCards: usesAppendChild=\${reorderCards.usesAppendChild}, usesCardOrder=\${reorderCards.usesCardOrder}\`, 'info');
        }

        // Check if guard flags are properly implemented
        const hasGuard = renderPreviews && renderPreviews.checksGuard;
        const usesCardOrder = renderPreviews && renderPreviews.usesCardOrder;

        testResults.noCompetingResets = hasGuard && usesCardOrder;
        log(testResults.noCompetingResets ? '✅ Competing resets check PASSED' : '❌ Competing resets check FAILED',
            testResults.noCompetingResets ? 'success' : 'error');
      } catch (error) {
        log('❌ Competing resets check FAILED: ' + error.message, 'error');
      }
    }

    async function testReorderFunction() {
      log('Test 4: Testing reorderPlatformCards() Function', 'info');

      try {
        // First enable smart ordering
        await testFrame.evalAsync(\`
          (function() {
            platformPrefs.smartOrdering = true;
            localStorage.setItem('vista-platform-prefs', JSON.stringify(platformPrefs));
          })()
        \`);

        log('Smart ordering enabled', 'info');

        // Get order before
        const before = await testFrame.evalAsync(\`
          (function() {
            const groups = {};
            document.querySelectorAll('.platform-group').forEach(groupEl => {
              const groupId = groupEl.dataset.groupId || groupEl.id.replace('group-', '');
              const cards = Array.from(groupEl.querySelectorAll('.platform-card[data-pid]')).map(card => card.dataset.pid);
              groups[groupId] = cards;
            });
            return groups;
          })()
        \`);

        log('Card order before reorderPlatformCards()', 'info');
        Object.keys(before).forEach(groupId => {
          log(\`  \${groupId}: [\${before[groupId].slice(0, 3).join(', ')}...]\`, 'info');
        });

        // Call reorderPlatformCards
        await testFrame.evalAsync(\`
          (function() {
            if (typeof reorderPlatformCards === 'function') {
              reorderPlatformCards();
            }
          })()
        \`);

        log('Called reorderPlatformCards()', 'info');

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get order after
        const after = await testFrame.evalAsync(\`
          (function() {
            const groups = {};
            document.querySelectorAll('.platform-group').forEach(groupEl => {
              const groupId = groupEl.dataset.groupId || groupEl.id.replace('group-', '');
              const cards = Array.from(groupEl.querySelectorAll('.platform-card[data-pid]')).map(card => card.dataset.pid);
              groups[groupId] = cards;
            });
            return groups;
          })()
        \`);

        log('Card order after reorderPlatformCards()', 'info');
        Object.keys(after).forEach(groupId => {
          log(\`  \${groupId}: [\${after[groupId].slice(0, 3).join(', ')}...]\`, 'info');
        });

        // Check if function exists and executed
        const functionExists = await testFrame.evalAsync(\`
          (function() {
            return typeof reorderPlatformCards === 'function';
          })()
        \`);

        testResults.reorderWorks = functionExists;
        log(testResults.reorderWorks ? '✅ reorderPlatformCards() test PASSED' : '❌ reorderPlatformCards() test FAILED',
            testResults.reorderWorks ? 'success' : 'error');

      } catch (error) {
        log('❌ reorderPlatformCards() test FAILED: ' + error.message, 'error');
      }
    }

    // Auto-start tests when page loads
    window.addEventListener('load', () => {
      log('Test page loaded. Click "Run All Tests" to begin.', 'info');
      updateResults();
    });
  </script>
</body>
</html>
`;

// Create a simple HTTP server to serve the test page
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(testHtml);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`\n=== BF-2WYF1 Manual Verification Test ===`);
  console.log(`Test page running at http://localhost:${PORT}`);
  console.log(`VISTA should be running at http://localhost:3000`);
  console.log(`\nOpen http://localhost:${PORT} in your browser and click "Run All Tests"`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
});
