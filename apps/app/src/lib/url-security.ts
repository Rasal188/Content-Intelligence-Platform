/**
 * SSRF & URL Security Validator for outbound URL fetching/scraping proxies.
 * Validates protocols, userinfo, ports, loopback, private CIDRs, link-local, and cloud metadata.
 */

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
}

/**
 * Checks if an IPv4 string falls into private, loopback, link-local, or reserved ranges.
 */
function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IPv4 treated as unsafe
  }

  const [b0, b1, b2, b3] = parts as [number, number, number, number];

  // 0.0.0.0/8 (Current network)
  if (b0 === 0) return true;

  // 10.0.0.0/8 (Private RFC1918)
  if (b0 === 10) return true;

  // 100.64.0.0/10 (Shared Address Space / CGNAT)
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

  // 127.0.0.0/8 (Loopback)
  if (b0 === 127) return true;

  // 169.254.0.0/16 (Link-Local & Cloud Metadata e.g. 169.254.169.254)
  if (b0 === 169 && b1 === 254) return true;

  // 172.16.0.0/12 (Private RFC1918)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (b0 === 192 && b1 === 0 && b2 === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (b0 === 192 && b1 === 0 && b2 === 2) return true;

  // 192.168.0.0/16 (Private RFC1918)
  if (b0 === 192 && b1 === 168) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (b0 === 198 && b1 >= 18 && b1 <= 19) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (b0 === 198 && b1 === 51 && b2 === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (b0 === 203 && b1 === 0 && b2 === 113) return true;

  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved / Future Use)
  if (b0 >= 224) return true;

  // 255.255.255.255/32 (Broadcast)
  if (b0 === 255 && b1 === 255 && b2 === 255 && b3 === 255) return true;

  return false;
}

/**
 * Checks if an IPv6 string falls into loopback, unique local (ULA), link-local, or IPv4-mapped private ranges.
 */
function isPrivateOrReservedIPv6(ip: string): boolean {
  const cleanIp = ip.toLowerCase().replace(/^\[|\]$/g, "");

  // :: (Unspecified)
  if (cleanIp === "::" || cleanIp === "0:0:0:0:0:0:0:0") return true;

  // ::1 (Loopback)
  if (cleanIp === "::1" || cleanIp.endsWith(":0001") || cleanIp === "0:0:0:0:0:0:0:1") return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1, ::ffff:10.0.0.1, etc.)
  if (cleanIp.startsWith("::ffff:") || cleanIp.startsWith("0:0:0:0:0:ffff:")) {
    const ipv4Part = cleanIp.split(":").pop();
    if (ipv4Part && ipv4Part.includes(".")) {
      return isPrivateOrReservedIPv4(ipv4Part);
    }
  }

  // fc00::/7 (Unique Local Address - ULA)
  if (cleanIp.startsWith("fc") || cleanIp.startsWith("fd")) return true;

  // fe80::/10 (Link-Local Unicast)
  if (
    cleanIp.startsWith("fe8") ||
    cleanIp.startsWith("fe9") ||
    cleanIp.startsWith("fea") ||
    cleanIp.startsWith("feb")
  ) {
    return true;
  }

  // ff00::/8 (Multicast)
  if (cleanIp.startsWith("ff")) return true;

  return false;
}

/**
 * Validates a user-supplied target URL against SSRF and protocol abuse policies.
 */
export function validateScrapeTargetUrl(rawUrl: unknown): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    return { valid: false, error: "Invalid URL." };
  }

  const trimmed = rawUrl.trim();

  // Reject malformed triple slash URLs (e.g. http:///path)
  if (trimmed.startsWith("http:///") || trimmed.startsWith("https:///")) {
    return { valid: false, error: "Invalid URL." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: "Invalid URL." };
  }

  // 1. Strict Protocol Validation (http: and https: only)
  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return { valid: false, error: "Invalid URL." };
  }

  // 2. Reject Userinfo Credentials (e.g. https://user:pass@host)
  if (parsed.username || parsed.password) {
    return { valid: false, error: "Invalid URL." };
  }

  // Reject URLs with empty host or hostnames
  if (!parsed.host || !parsed.hostname || parsed.hostname.trim().length === 0) {
    return { valid: false, error: "Invalid URL." };
  }

  // 3. Normalize Hostname (strip brackets, trailing dots, lowercase)
  let hostname = parsed.hostname.toLowerCase().trim();
  if (hostname.endsWith(".")) {
    hostname = hostname.slice(0, -1);
  }

  if (!hostname || hostname.length === 0) {
    return { valid: false, error: "Invalid URL." };
  }

  // 4. Block Localhost Hostnames
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "local" ||
    hostname.endsWith(".local") ||
    hostname === "internal" ||
    hostname.endsWith(".internal")
  ) {
    return { valid: false, error: "URL host is not allowed." };
  }

  // Check IPv4-mapped IPv6 form in hostname (e.g. ::ffff:127.0.0.1)
  const cleanHost = hostname.replace(/^\[|\]$/g, "");
  if (cleanHost.startsWith("::ffff:") || cleanHost.startsWith("0:0:0:0:0:ffff:")) {
    const ipv4Part = cleanHost.split(":").pop();
    if (ipv4Part && isPrivateOrReservedIPv4(ipv4Part)) {
      return { valid: false, error: "URL host is not allowed." };
    }
  }

  // 5. Check if hostname is an IPv4 literal
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    if (isPrivateOrReservedIPv4(hostname)) {
      return { valid: false, error: "URL host is not allowed." };
    }
  }

  // 6. Check if hostname is an IPv6 literal (with or without brackets)
  const isIpv6 = hostname.includes(":") || (hostname.startsWith("[") && hostname.endsWith("]"));
  if (isIpv6) {
    if (isPrivateOrReservedIPv6(hostname)) {
      return { valid: false, error: "URL host is not allowed." };
    }
  }

  // 7. Port Validation (Permit standard HTTP/HTTPS ports 80, 443, 8080, 8443, or empty default)
  if (parsed.port) {
    const portNum = Number.parseInt(parsed.port, 10);
    if (
      Number.isNaN(portNum) ||
      portNum < 1 ||
      portNum > 65535 ||
      // Block common internal administrative ports
      [22, 25, 110, 143, 3306, 5432, 6379, 27017, 9200, 2375, 2376].includes(portNum)
    ) {
      return { valid: false, error: "URL host is not allowed." };
    }
  }

  return {
    valid: true,
    normalizedUrl: parsed.toString(),
  };
}
