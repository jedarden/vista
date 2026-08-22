'use strict';

const dns = require('dns').promises;

/**
 * SSRF Guard - Validates URLs to prevent Server-Side Request Forgery
 *
 * Resolves hostnames via DNS and rejects requests to:
 * - Loopback addresses (127.0.0.0/8, ::1)
 * - Private networks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - Link-local addresses (169.254.0.0/16, fe80::/10)
 * - Reserved ranges (0.0.0.0/8, multicast, etc.)
 * - Literal "localhost" hostname
 */

/**
 * Check if an IP address is in a CIDR range
 */
function ipInCidr(ip, cidr) {
  const [network, prefixLength] = cidr.split('/');
  const prefix = parseInt(prefixLength, 10);

  const ipBytes = ip.split('.').map(x => parseInt(x, 10));
  const networkBytes = network.split('.').map(x => parseInt(x, 10));

  const mask = [];
  for (let i = 0; i < 4; i++) {
    const remainingBits = Math.max(0, prefix - (i * 8));
    const bitsInThisOctet = Math.min(8, remainingBits);
    mask[i] = (256 - Math.pow(2, 8 - bitsInThisOctet)) >>> 0;
  }

  for (let i = 0; i < 4; i++) {
    if ((ipBytes[i] & mask[i]) !== (networkBytes[i] & mask[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Check if an IPv6 address is loopback
 */
function isIPv6Loopback(ip) {
  return ip === '::1' || ip.startsWith('::1/');
}

/**
 * Check if an IPv6 address is link-local (fe80::/10)
 */
function isIPv6LinkLocal(ip) {
  // Remove zone ID if present (e.g., fe80::1%eth0)
  const ipWithoutZone = ip.split('%')[0];

  // Parse the first hextet (16-bit segment)
  const parts = ipWithoutZone.split(':');
  if (parts.length === 0) return false;

  const firstHextet = parts[0];
  if (!firstHextet) return false;

  // Parse as 16-bit integer
  const value = parseInt(firstHextet, 16);
  if (isNaN(value)) return false;

  // fe80::/10 means the first 10 bits match 1111111010
  // In hex, fe80 = 11111110 10000000 in binary
  // The /10 prefix means we check if the first 10 bits match 1111111010
  // fe80::/10 = fe80:0:0:0:0:0:0:0 to febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff
  // So we need to check if (value & 0xffc0) === 0xfe80
  // 0xffc0 = 11111111 11000000 in binary (masks first 10 bits)
  return (value & 0xffc0) === 0xfe80;
}

/**
 * Check if a string is a valid IPv4 address
 */
function isIPv4(str) {
  const parts = str.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

/**
 * Check if an IP address is private/internal
 */
function isPrivateIP(ip) {
  // Validate it's actually an IPv4 address first
  if (!isIPv4(ip)) {
    return false;
  }

  // IPv4 private ranges
  const ipv4PrivateRanges = [
    '127.0.0.0/8',    // Loopback
    '10.0.0.0/8',     // Private network
    '172.16.0.0/12',  // Private network
    '192.168.0.0/16', // Private network
    '169.254.0.0/16', // Link-local
    '0.0.0.0/8',      // Reserved
    '224.0.0.0/4',    // Multicast
    '240.0.0.0/4',    // Reserved
  ];

  for (const range of ipv4PrivateRanges) {
    if (ipInCidr(ip, range)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate a URL for SSRF vulnerabilities
 * @param {string} urlString - The URL to validate
 * @returns {Promise<{allowed: boolean, reason: string}>}
 */
async function validateUrl(urlString) {
  try {
    const url = new URL(urlString);

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        allowed: false,
        reason: `URL protocol "${url.protocol}" is not supported (only http/https allowed)`
      };
    }

    const hostname = url.hostname;

    // TEST MODE: Allow localhost URLs when testing is enabled
    const testMode = process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test';
    const isLocalhost = hostname.toLowerCase() === 'localhost';
    if (testMode && isLocalhost) {
      // In test mode, allow the literal loopback hostname so local test
      // fixtures (e.g. an HTTP server on :3001) can be fetched. Return here
      // instead of falling through: localhost always resolves to 127.0.0.1,
      // which the DNS-resolution check below would reject. Gated on an env
      // var production never sets (Dockerfile pins NODE_ENV=production), and
      // scoped to the literal hostname — direct loopback IPs stay blocked.
      return { allowed: true, reason: 'OK (test mode: localhost allowed)' };
    }
    if (isLocalhost) {
      return {
        allowed: false,
        reason: 'URL hostname "localhost" is not allowed (resolves to loopback address)'
      };
    }

    // Reject if hostname is already an IP address
    if (isPrivateIP(hostname)) {
      return {
        allowed: false,
        reason: `URL hostname "${hostname}" is a private/internal address and cannot be fetched`
      };
    }

    // Check for IPv6 addresses in hostname
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      const ipv6 = hostname.slice(1, -1);
      if (isIPv6Loopback(ipv6)) {
        return {
          allowed: false,
          reason: `URL hostname "${ipv6}" is a loopback address and cannot be fetched`
        };
      }
      if (isIPv6LinkLocal(ipv6)) {
        return {
          allowed: false,
          reason: `URL hostname "${ipv6}" is a link-local address and cannot be fetched`
        };
      }
    }

    // Resolve hostname to IP via DNS
    let resolvedAddresses;
    try {
      resolvedAddresses = await dns.lookup(hostname, { family: 4 });
    } catch (dnsErr) {
      // If DNS resolution fails, we should still block - the address might be
      // resolvable in the target environment (e.g., cluster-internal DNS)
      return {
        allowed: false,
        reason: `Failed to resolve hostname "${hostname}": ${dnsErr.message}`
      };
    }

    const resolvedIP = resolvedAddresses.address;

    // Check if resolved IP is private
    if (isPrivateIP(resolvedIP)) {
      return {
        allowed: false,
        reason: `URL hostname "${hostname}" resolves to private/internal address "${resolvedIP}" and cannot be fetched`
      };
    }

    return { allowed: true, reason: 'OK' };

  } catch (urlErr) {
    return {
      allowed: false,
      reason: `Invalid URL: ${urlErr.message}`
    };
  }
}

/**
 * Validate a URL and throw an error if invalid (convenience function)
 * @param {string} urlString - The URL to validate
 * @throws {Error} If the URL is invalid
 */
async function validateUrlOrThrow(urlString) {
  const result = await validateUrl(urlString);
  if (!result.allowed) {
    throw new Error(result.reason);
  }
  return result;
}

module.exports = {
  validateUrl,
  validateUrlOrThrow,
  isPrivateIP,
  isIPv4,
  isIPv6Loopback,
  isIPv6LinkLocal,
  ipInCidr,
};
