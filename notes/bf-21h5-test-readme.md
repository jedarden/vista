# BF-21h5 DOM Reordering Verification - Quick Start Guide

## 🎯 Objective
Verify that platform cards reorder correctly when platform preferences change based on page type.

## ✅ Server Status
- **VISTA Server**: Running on `http://localhost:3000` ✅
- **Test Interface**: `test-bf-21h5-verify-reordering.html` ✅
- **Test Configurations**: 3 test cases ready ✅

## 🚀 Quick Start (3 Methods)

### Method 1: Interactive Test Interface (Recommended)
```bash
# Open the test HTML file in your browser
firefox test-bf-21h5-verify-reordering.html
# or
chrome test-bf-21h5-verify-reordering.html
```

### Method 2: Manual Console Testing
1. Open `http://localhost:3000`
2. Enter test URL: `https://blog.example.com/2024/07/my-article`
3. Click "Inspect"
4. Open DevTools Console (F12)
5. Run:
   ```javascript
   const platforms = Array.from(document.querySelectorAll('.platform-card'))
     .map(card => card.dataset.platform || card.querySelector('.platform-name')?.textContent?.trim().toLowerCase())
     .filter(p => p);
   console.log('Platform order:', platforms);
   ```
6. Verify output matches: `['twitter', 'facebook', 'linkedin', 'reddit', 'bluesky', 'threads', 'mastodon']`

### Method 3: Shell Instructions
```bash
bash test-bf-21h5-simple.sh
```

## 📋 Test Configurations

### Test 1: Article Page Type
- **URL**: `https://blog.example.com/2024/07/my-article`
- **Expected**: `['twitter', 'facebook', 'linkedin', 'reddit', 'bluesky', 'threads', 'mastodon']`

### Test 2: Product Page Type
- **URL**: `https://shop.example.com/products/awesome-product`
- **Expected**: `['pinterest', 'facebook', 'instagram', 'twitter', 'linkedin']`

### Test 3: General Website
- **URL**: `https://example.com`
- **Expected**: `['google', 'facebook', 'twitter', 'linkedin', 'slack', 'discord']`

## 📝 Test Results Template
Use `test-results/bf-21h5-test-results-template.md` to document your findings.

## 🛠️ Troubleshooting

### VISTA Server Not Running
```bash
npm start
```

### Platform Cards Not Loading
- Wait 2-3 seconds after clicking "Inspect"
- Check browser console for errors
- Verify URL is accessible

### Expected Order Doesn't Match
- Check if platform preferences have been modified
- Verify page type detection is working correctly
- Check browser console for any scoring errors

## 📊 What to Verify

For each test configuration, verify that:
1. ✅ Platform cards load successfully
2. ✅ DOM order matches expected platform order
3. ✅ Platform names are correctly identified
4. ✅ Reordering happens after preference changes
5. ✅ No console errors occur during reordering

## 🎓 Background

### Why These Tests Matter
- **Article pages** prioritize Twitter/Facebook for social sharing
- **Product pages** prioritize Pinterest/Instagram for visual discovery
- **Website pages** prioritize Google/Facebook for broad reach

### How DOM Reordering Works
1. VISTA detects page type from URL
2. Platform scores are calculated based on page type
3. User preferences modify the scores
4. Cards are reordered in DOM based on final scores
5. Changes are visible immediately without reload

## 📚 Additional Resources

- **Full Documentation**: `notes/bf-21h5-verification-summary.md`
- **Test Results Template**: `test-results/bf-21h5-test-results-template.md`
- **Shell Instructions**: `test-bf-21h5-simple.sh`
- **Test Interface**: `test-bf-21h5-verify-reordering.html`

## ✅ Success Criteria

The verification is successful when:
- All 3 test configurations pass
- Platform order matches expected for each page type
- DOM reordering happens without errors
- Results are documented in the test results file

---

**Ready to test? Start with Method 1 for the best experience!**
