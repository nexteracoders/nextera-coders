import dns from 'dns';
import net from 'net';
import { logger } from '../utils/logger';

let configured = false;

/**
 * Validates whether an address string is a valid IPv4 or IPv6 address.
 * Optionally handles port syntax (e.g., "8.8.8.8:53" or "[2001:4860:4860::8888]:53").
 */
function isValidDnsServer(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  const host = trimmed.startsWith('[')
    ? trimmed.slice(1, trimmed.indexOf(']'))
    : trimmed.split(':')[0];
  return net.isIP(host) !== 0;
}

/**
 * Checks if all currently active c-ares servers are local loopback addresses (127.0.0.1, ::1).
 * On Windows, Node.js c-ares frequently resolves to 127.0.0.1 when no local DNS daemon exists,
 * causing querySrv ECONNREFUSED for MongoDB Atlas SRV records.
 */
function hasOnlyLoopbackServers(): boolean {
  try {
    const servers = dns.getServers();
    return (
      servers.length > 0 &&
      servers.every((s) => s === '127.0.0.1' || s === '::1' || s === 'localhost')
    );
  } catch {
    return false;
  }
}

/**
 * Configures Node.js c-ares DNS servers used by MongoDB driver for SRV / TXT resolution.
 * Must be executed before mongoose.connect() or any MongoDB SRV lookups occur.
 *
 * @param customServers - Optional comma-separated string or array of DNS server IPs.
 *                        Falls back to process.env.MONGODB_DNS_SERVERS or public DNS on loopback.
 * @returns Array of active DNS servers, or null if configuration failed.
 */
export function configureDns(customServers?: string | string[]): string[] | null {
  if (configured) {
    return dns.getServers();
  }

  const rawConfig = customServers ?? process.env.MONGODB_DNS_SERVERS ?? '';
  let serversToSet: string[] = [];

  if (Array.isArray(rawConfig)) {
    serversToSet = rawConfig.map((s) => s.trim()).filter(isValidDnsServer);
  } else if (typeof rawConfig === 'string' && rawConfig.trim().length > 0) {
    serversToSet = rawConfig
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && isValidDnsServer(s));
  }

  // If no explicit DNS servers configured via env/arguments:
  if (serversToSet.length === 0) {
    if (hasOnlyLoopbackServers()) {
      logger.info(
        `[DNS] Detected loopback-only c-ares resolver (${dns.getServers().join(', ')}). Applying fallback public DNS (8.8.8.8, 1.1.1.1) for MongoDB Atlas SRV resolution.`
      );
      serversToSet = ['8.8.8.8', '1.1.1.1'];
    } else {
      // Retain system DNS servers in container/production environments where system resolver works
      configured = true;
      return dns.getServers();
    }
  }

  try {
    dns.setServers(serversToSet);
    configured = true;
    logger.info(`[DNS] Successfully configured DNS servers for MongoDB SRV resolution: ${serversToSet.join(', ')}`);
    return serversToSet;
  } catch (error) {
    logger.warn(
      `[DNS] Failed to set DNS servers (${serversToSet.join(', ')}): ${(error as Error).message}. Retaining defaults.`
    );
    return null;
  }
}

export function isDnsConfigured(): boolean {
  return configured;
}
