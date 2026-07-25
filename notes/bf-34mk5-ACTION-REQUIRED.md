# ACTION REQUIRED: Manual Cloudflare CNAME Creation

## Task: bf-34mk5 - Add Cloudflare DNS CNAME for vista.jedarden.com

## Current Status: ⚠️ BLOCKED - Manual Intervention Required

### What Has Been Done
✅ Analyzed apexalgo-iad cluster - IngressRoute IS deployed (51d old)
✅ Identified target Cloudflare tunnel: `cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com`
✅ Confirmed root cause: **external-dns is NOT running** on apexalgo-iad
✅ Created verification script: `scripts/verify-vista-cname.sh`
✅ Created documentation: `notes/bf-34mk5-cloudflare-cname-setup.md`

### What Cannot Be Done (Blockers)
❌ **No Cloudflare API access** on this server
   - No API credentials in environment
   - No Cloudflare CLI tools installed
   - No API access via kubectl (read-only observer account)

❌ **external-dns not deployed** on apexalgo-iad
   - IngressRoute has external-dns annotations
   - But external-dns pod doesn't exist
   - Automatic DNS creation won't work

### What YOU Need To Do (Manual Steps)

#### Step 1: Log into Cloudflare Dashboard
1. Go to https://dash.cloudflare.com/
2. Select domain: **jedarden.com**
3. Navigate to: **DNS** → **Records**

#### Step 2: Check for Existing Record
Look for any existing record for `vista.jedarden.com`:
- If it exists as an A record or other type, **delete it first**
- If it exists as a CNAME, **update it**

#### Step 3: Add CNAME Record
Click **Add Record** and configure:

| Field | Value | Notes |
|-------|-------|-------|
| **Type** | `CNAME` | Not A record |
| **Name** | `vista` | Creates vista.jedarden.com |
| **Target** | `cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com` | Cloudflare tunnel endpoint |
| **TTL** | `Auto` | Accept default |
| **Proxy status** | **☁️ DNS only** (GRAY cloud) | ⚠️ CRITICAL - Do NOT use orange cloud! |

**⚠️ CRITICAL: Proxy Status MUST be "DNS only" (gray cloud)**
- Gray cloud (☁️) = DNS only = Correct
- Orange cloud (🟠) = Proxied = WRONG - will break the tunnel

#### Step 4: Save and Verify
1. Click **Save**
2. Wait ~30 seconds for Cloudflare to propagate
3. Run verification: `bash scripts/verify-vista-cname.sh`

### How to Verify Completion

After creating the CNAME, run the verification script:

```bash
bash /home/coding/vista/scripts/verify-vista-cname.sh
```

Expected output:
```
✅ CNAME found: vista.jedarden.com → cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
✅ CNAME points to correct target!
🎉 SUCCESS: All verification checks passed!
```

### Current DNS State (Before CNAME)

```
vista.jedarden.com has address 172.67.172.218
vista.jedarden.com has address 104.21.40.5
vista.jedarden.com has NO CNAME record
```

These IPs are Cloudflare proxy IPs, but the CNAME to the tunnel doesn't exist.

### Expected DNS State (After CNAME)

```
vista.jedarden.com is an alias for cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
```

### Why This Can't Be Automated

1. **No Cloudflare API credentials** available on this server
2. **No external-dns** deployment on apexalgo-iad cluster
3. **Read-only kubectl access** prevents deploying external-dns
4. **Manual Cloudflare dashboard access** is only viable path

### Long-term Solution (Out of Scope)

To prevent manual intervention in future:
1. Deploy external-dns to apexalgo-iad cluster
2. Create Cloudflare API token with DNS edit permissions
3. Configure external-dns with API credentials
4. Test automatic DNS record creation

This requires cluster-admin access and credentials setup.

## Files Created

- `notes/bf-34mk5-cloudflare-cname-setup.md` - Full technical documentation
- `scripts/verify-vista-cname.sh` - Verification script (run after manual setup)
- `notes/bf-34mk5-ACTION-REQUIRED.md` - This action item document

## Next Steps

1. **Manually create CNAME** in Cloudflare dashboard (follow steps above)
2. **Run verification script** to confirm it works
3. **Close bead bf-34mk5** once verification passes
4. **Consider long-term fix** (deploy external-dns) to prevent future manual work
