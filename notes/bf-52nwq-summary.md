# Race Conditions Identified - Quick Reference

**Bead:** bf-52nwq  
**Date:** 2026-07-23

## Race Conditions (5 total)

| ID | Name | Status | Severity | Priority | Location |
|----|------|--------|----------|----------|----------|
| RC-001 | Guard Flag Cleared Too Early | ✅ FIXED | CRITICAL | - | applySmartOrderingSafe() |
| RC-002 | Drag-and-Drop During Smart Ordering | ❌ OPEN | HIGH | 1 | handleDrop() |
| RC-003 | Concurrent Smart Ordering | 🔶 MITIGATED | MEDIUM | 2 | applySmartOrderingSafe() |
| RC-004 | localStorage Write Race | ❌ OPEN | MEDIUM | 3 | applySmartOrdering(), handleDrop() |
| RC-005 | Queued Render Stale Data | 🔶 MITIGATED | LOW | 4 | applySmartOrderingSafe() finally |

## Order Reset Scenarios (3 total)

| ID | Name | Status | Severity | Priority | Location |
|----|------|--------|----------|----------|----------|
| RS-001 | Smart Ordering Overwrites Manual Reorder | ❌ OPEN | HIGH | 2 | applySmartOrdering() |
| RS-002 | Multi-Tab localStorage Overwrite | ❌ OPEN | MEDIUM | 3 | All localStorage writes |
| RS-003 | Rapid Render Clears Custom Order | ⚠️ EDGE CASE | LOW | 4 | renderPreviews() |

## Fix Priority Roadmap

### Phase 1 (Critical)
- **RC-002**: Add guard flag check to handleDrop()

### Phase 2 (High)
- **RC-003**: Pass page type context through queue
- **RS-001**: Implement merge semantics for smart ordering

### Phase 3 (Medium)
- **RC-004**: Implement localStorage write serialization
- **RS-002**: Add storage event listener for multi-tab sync

### Phase 4 (Low - Optional)
- **RC-005**: Implement render queue if intermediate states needed
- **RS-003**: Monitor for edge case regressions

## Key Findings

1. **RC-002 is the highest priority**: Drag-and-drop lacks guard flag check that all other render paths have
2. **RS-001 affects UX**: Users lose manual customizations when smart ordering runs
3. **Multi-tab issues**: No cross-tab synchronization exists

## Reproduction Examples

### RC-002 (Drag-Drop Race)
```javascript
// 1. Enable smart ordering
platformPrefs.smartOrdering = true;

// 2. Trigger smart ordering
inspectUrl('https://example.com/article');

// 3. During operation, drag a card
// → handleDrop() calls renderPreviews() without checking isApplyingSmartOrder
// → DOM corruption occurs
```

### RS-001 (Manual Order Lost)
```javascript
// 1. User manually orders cards
dragCard('twitter', position 0);
// cardOrder = { social: ['twitter', 'facebook', 'linkedin'] }

// 2. Inspect URL
inspectUrl('https://example.com/product');
// → applySmartOrdering() overwrites cardOrder
// → User's custom order lost
```

## Code Locations

- **applySmartOrderingSafe()**: Line 8571
- **handleDrop()**: Line 9142
- **renderPreviews()**: Line 1583
- **savePlatformPrefs()**: Line 7638
- **reorderPlatformCards()**: Line 8337

## Related Beads

- bf-266gv: Original race condition investigation (RC-001 fix)
- bf-4qfif: Comprehensive audit of all rendering/ordering code
- bf-2ce32: Guard flag timing fix
