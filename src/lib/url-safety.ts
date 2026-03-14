import dns from "node:dns/promises";
import net from "node:net";

import { HttpError } from "@/lib/api-error";

export type HostResolver = (hostname: string) => Promise<string[]>;

const BLOCKED_HOSTNAMES = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1"]);
const BLOCKED_SUFFIXES = [
  ".internal",
  ".local",
  ".localhost",
  ".test",
  ".invalid",
  ".home",
  ".lan",
];

export async function assertPublicHttpUrl(
  rawUrl: string,
  resolveHostname: HostResolver = defaultResolveHostname,
): Promise<URL> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new HttpError(422, "invalid_url", "Link gecersiz.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new HttpError(
      422,
      "unsupported_protocol",
      "Sadece herkese acik http veya https linkleri desteklenir.",
    );
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new HttpError(
      422,
      "credentialed_url",
      "Kullanici adi veya sifre iceren linkler desteklenmiyor.",
    );
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (!hostname || BLOCKED_HOSTNAMES.has(hostname)) {
    throw new HttpError(
      422,
      "private_url",
      "Local veya dahili adresler PDF'e cevrilemez.",
    );
  }

  if (BLOCKED_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    throw new HttpError(
      422,
      "private_hostname",
      "Dahili hostname'ler desteklenmiyor.",
    );
  }

  const ipVersion = net.isIP(hostname);

  if (ipVersion > 0) {
    if (!isPublicIp(hostname)) {
      throw new HttpError(
        422,
        "private_ip",
        "Private veya reserve IP adresleri desteklenmiyor.",
      );
    }

    return parsedUrl;
  }

  if (!hostname.includes(".")) {
    throw new HttpError(422, "invalid_hostname", "Public bir domain kullanin.");
  }

  let resolvedAddresses: string[];

  try {
    resolvedAddresses = await resolveHostname(hostname);
  } catch {
    throw new HttpError(
      422,
      "unresolvable_url",
      "Link cozumlenemedi. Public ve erisilebilir bir domain kullanin.",
    );
  }

  if (
    resolvedAddresses.length === 0 ||
    resolvedAddresses.some((address) => !isPublicIp(address))
  ) {
    throw new HttpError(
      422,
      "private_resolution",
      "Link public bir hedefe cozumlenmeli.",
    );
  }

  return parsedUrl;
}

export async function defaultResolveHostname(hostname: string): Promise<string[]> {
  const records = await dns.lookup(hostname, {
    all: true,
    verbatim: true,
  });

  return records.map((record) => record.address);
}

export function isPublicIp(address: string): boolean {
  const normalizedAddress = address.toLowerCase();
  const ipVersion = net.isIP(normalizedAddress);

  if (ipVersion === 4) {
    return isPublicIpv4(normalizedAddress);
  }

  if (ipVersion === 6) {
    if (normalizedAddress.startsWith("::ffff:")) {
      return isPublicIpv4(normalizedAddress.replace("::ffff:", ""));
    }

    const value = ipv6ToBigInt(normalizedAddress);

    return !BLOCKED_IPV6_RANGES.some(({ start, prefix }) =>
      isWithinPrefix(value, start, prefix, 128),
    );
  }

  return false;
}

function isPublicIpv4(address: string): boolean {
  const parts = address.split(".").map((part) => Number(part));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;

  if (a === 10 || a === 127 || a === 0) {
    return false;
  }

  if (a === 169 && b === 254) {
    return false;
  }

  if (a === 172 && b >= 16 && b <= 31) {
    return false;
  }

  if (a === 192 && b === 168) {
    return false;
  }

  if (a === 100 && b >= 64 && b <= 127) {
    return false;
  }

  if (a === 192 && b === 0) {
    return false;
  }

  if (a === 198 && (b === 18 || b === 19 || b === 51)) {
    return false;
  }

  if (a === 203 && b === 0) {
    return false;
  }

  if (a >= 224) {
    return false;
  }

  return true;
}

const BLOCKED_IPV6_RANGES = [
  { start: ipv6ToBigInt("::"), prefix: 128 },
  { start: ipv6ToBigInt("::1"), prefix: 128 },
  { start: ipv6ToBigInt("fc00::"), prefix: 7 },
  { start: ipv6ToBigInt("fe80::"), prefix: 10 },
  { start: ipv6ToBigInt("fec0::"), prefix: 10 },
  { start: ipv6ToBigInt("2001:db8::"), prefix: 32 },
  { start: ipv6ToBigInt("ff00::"), prefix: 8 },
];

function isWithinPrefix(
  value: bigint,
  start: bigint,
  prefix: number,
  bits: number,
): boolean {
  const shift = BigInt(bits - prefix);
  return value >> shift === start >> shift;
}

function ipv6ToBigInt(address: string): bigint {
  const normalized = expandIpv6(address);
  return normalized.reduce(
    (accumulator, block) =>
      (accumulator << BigInt(16)) + BigInt(`0x${block}`),
    BigInt(0),
  );
}

function expandIpv6(address: string): string[] {
  const [headRaw, tailRaw] = address.split("::");
  const head = normalizeIpv6Parts(headRaw);
  const tail = normalizeIpv6Parts(tailRaw);
  const missing = 8 - (head.length + tail.length);
  const middle = missing > 0 ? new Array(missing).fill("0000") : [];

  return [...head, ...middle, ...tail].map((part) => part.padStart(4, "0"));
}

function normalizeIpv6Parts(raw?: string): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(":")
    .filter(Boolean)
    .flatMap((part) =>
      part.includes(".")
        ? ipv4ToIpv6Blocks(part)
        : [part.toLowerCase().padStart(4, "0")]
    );
}

function ipv4ToIpv6Blocks(address: string): string[] {
  const octets = address.split(".").map((part) => Number(part));

  if (octets.length !== 4 || octets.some((part) => Number.isNaN(part))) {
    return ["0000", "0000"];
  }

  const first = ((octets[0] << 8) | octets[1]).toString(16);
  const second = ((octets[2] << 8) | octets[3]).toString(16);

  return [first.padStart(4, "0"), second.padStart(4, "0")];
}
