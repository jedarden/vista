# Vista DNS CNAME Verification

## Date
2026-08-02

## Summary
The CNAME record for vista.jedarden.com is already configured and managed by external-dns on the apexalgo-iad cluster.

## Configuration Details

### IngressRoute Configuration
Located in: `~/declarative-config/k8s/apexalgo-iad/vista/ingressroute.yml`

```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: vista.jedarden.com
  external-dns.alpha.kubernetes.io/target: cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
  external-dns.alpha.kubernetes.io/ttl: "300"
```

### External-DNS Setup
- Chart: external-dns v1.20.0
- Namespace: utilities (apexalgo-iad cluster)
- Provider: cloudflare
- Domain filters: jedarden.com (among others)
- Policy: sync (creates/updates/deletes records)
- Cloudflare proxy: enabled (--cloudflare-proxied)
- Registry: txt (owner: apexalgo-iad)

### DNS Verification

```bash
$ dig vista.jedarden.com +short
172.67.172.218
104.21.40.5
```

The domain resolves to Cloudflare edge IPs (172.67.172.218, 104.21.40.5), which is expected when Cloudflare proxy is enabled. The underlying CNAME points to the Cloudflare tunnel that fronts the apexalgo-iad cluster's Traefik ingress.

### External-DNS Status

```bash
$ kubectl --server=http://traefik-apexalgo-iad:8001 logs -n utilities externaldns-ardenone-com-external-dns-795d769b68-m4t7s --tail=5
time="2026-08-02T22:15:17Z" level=info msg="All records are already up to date"
```

External-dns is running and confirms all records are synchronized.

## Architecture

```
vista.jedarden.com (DNS CNAME)
    ↓
cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com (Cloudflare Tunnel)
    ↓
traefik-apexalgo-iad ingress (Tailscale VPN)
    ↓
vista service (port 8080)
```

## Acceptance Criteria Status

- ✅ CNAME record exists in Cloudflare for vista.jedarden.com (managed by external-dns)
- ✅ Points to apexalgo-iad ingress (via Cloudflare tunnel: cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com)
- ✅ DNS propagation verified (resolves to Cloudflare edge IPs: 172.67.172.218, 104.21.40.5)

## Notes

The DNS record is managed entirely by external-dns based on the IngressRoute annotations. Manual changes to Cloudflare DNS would be overwritten by external-dns. To modify the DNS configuration, edit the IngressRoute annotations in `~/declarative-config/k8s/apexalgo-iad/vista/ingressroute.yml`.
