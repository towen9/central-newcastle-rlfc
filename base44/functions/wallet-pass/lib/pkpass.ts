/**
 * pkpass.ts — builds and signs a real Apple Wallet .pkpass, in Deno.
 *
 * A .pkpass is a zip containing:
 *   pass.json      the card definition
 *   icon.png       required — iOS silently rejects a pass without it
 *   logo.png       shown top-left
 *   manifest.json  { filename: sha1-hex } for every other file
 *   signature      detached PKCS#7 signature over manifest.json
 */

import forge from "npm:node-forge@1.3.1";
import { zipSync } from "npm:fflate@0.8.2";
import type { RenderedPass } from "./pass-data.ts";

export interface AppleCerts {
  signerCertPem: string;
  signerKeyPem: string;
  signerKeyPassphrase?: string;
  wwdrPem: string;
  passTypeIdentifier: string;
  teamIdentifier: string;
}

export interface PassAssets {
  "icon.png": Uint8Array;
  "icon@2x.png"?: Uint8Array;
  "logo.png"?: Uint8Array;
  "logo@2x.png"?: Uint8Array;
  "strip.png"?: Uint8Array;
  "strip@2x.png"?: Uint8Array;
}

async function sha1Hex(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * storeCard is the right style for a membership — big primary field and a
 * barcode, without pretending to be a ticket for one event.
 */
export function buildPassJson(
  p: RenderedPass,
  opts: {
    passTypeIdentifier: string;
    teamIdentifier: string;
    serialNumber: string;
    authenticationToken: string;
    webServiceURL: string;
  },
): Record<string, unknown> {
  const voided = p.status !== "VALID";

  const pass: Record<string, unknown> = {
    formatVersion: 1,
    passTypeIdentifier: opts.passTypeIdentifier,
    teamIdentifier: opts.teamIdentifier,
    serialNumber: opts.serialNumber,
    organizationName: p.organizationName,
    description: p.description,
    logoText: p.logoText,

    backgroundColor: p.style.bg,
    foregroundColor: p.style.fg,
    labelColor: p.style.label,

    // Auto-update: iOS calls this URL with the token to refresh the card.
    webServiceURL: opts.webServiceURL,
    authenticationToken: opts.authenticationToken,

    // A voided pass renders greyed out and struck through in Wallet.
    voided,

    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        // Membership.qr_code_id — GateScan's JSON.parse falls through to the
        // bare-string branch, so processScan resolves it unchanged.
        message: p.barcodeValue,
        messageEncoding: "iso-8859-1",
        altText: p.altText,
      },
    ],

    storeCard: {
      headerFields: [
        {
          key: "status",
          label: "STATUS",
          value: p.status,
          textAlignment: "PKTextAlignmentRight",
        },
      ],
      primaryFields: [{ key: "member", label: "MEMBER", value: p.name }],
      secondaryFields: [
        { key: "tier", label: "TIER", value: p.tier },
        {
          key: "number",
          label: "MEMBER NO.",
          value: p.altText,
          textAlignment: "PKTextAlignmentRight",
        },
      ],
      auxiliaryFields: [
        { key: "nextgame", label: p.nextGameLabel, value: p.nextGameValue },
        {
          key: "points",
          label: "POINTS",
          value: p.points,
          textAlignment: "PKTextAlignmentRight",
          changeMessage: "You're on %@ points.",
        },
      ],
      backFields: p.backFields,
    },
  };

  // relevantDate + locations = the card surfaces on the lock screen near
  // kick-off and near the ground. This is the whole magic trick.
  if (p.relevantDate) pass.relevantDate = p.relevantDate;
  if (p.location) {
    pass.locations = [
      {
        latitude: p.location.latitude,
        longitude: p.location.longitude,
        relevantText: p.location.relevantText,
      },
    ];
    pass.maxDistance = 500;
  }

  return pass;
}

/** Detached PKCS#7 signature over the manifest, per Apple's spec. */
function signManifest(manifestBytes: Uint8Array, certs: AppleCerts): Uint8Array {
  const signerCert = forge.pki.certificateFromPem(certs.signerCertPem);
  const wwdrCert = forge.pki.certificateFromPem(certs.wwdrPem);
  const privateKey = certs.signerKeyPassphrase
    ? forge.pki.decryptRsaPrivateKey(certs.signerKeyPem, certs.signerKeyPassphrase)
    : forge.pki.privateKeyFromPem(certs.signerKeyPem);

  if (!privateKey) {
    throw new Error(
      "Could not read the pass signing key. Check APPLE_PASS_KEY_PEM and its passphrase.",
    );
  }

  // forge wants a binary string. Chunked so a large manifest can never blow
  // the argument limit on the spread.
  let binary = "";
  const CHUNK = 8192;
  for (let i = 0; i < manifestBytes.length; i += CHUNK) {
    binary += String.fromCharCode(...manifestBytes.subarray(i, i + CHUNK));
  }

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(binary, "raw");
  p7.addCertificate(wwdrCert);
  p7.addCertificate(signerCert);
  p7.addSigner({
    key: privateKey,
    certificate: signerCert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date().toISOString() },
    ],
  });

  p7.sign({ detached: true });

  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  const out = new Uint8Array(der.length);
  for (let i = 0; i < der.length; i++) out[i] = der.charCodeAt(i) & 0xff;
  return out;
}

/** Build the complete signed .pkpass. */
export async function buildPkPass(
  passJson: Record<string, unknown>,
  assets: PassAssets,
  certs: AppleCerts,
): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {};

  files["pass.json"] = new TextEncoder().encode(JSON.stringify(passJson, null, 2));

  for (const [name, bytes] of Object.entries(assets)) {
    if (bytes && bytes.length) files[name] = bytes;
  }

  if (!files["icon.png"]) {
    throw new Error("icon.png is required — iOS rejects a pass without it.");
  }

  const manifest: Record<string, string> = {};
  for (const [name, bytes] of Object.entries(files)) {
    manifest[name] = await sha1Hex(bytes);
  }
  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
  files["manifest.json"] = manifestBytes;
  files["signature"] = signManifest(manifestBytes, certs);

  return zipSync(files, { level: 6 });
}

/** Decode a base64 secret into bytes. */
export function b64ToBytes(b64?: string): Uint8Array {
  if (!b64) return new Uint8Array();
  const clean = b64.replace(/\s+/g, "");
  try {
    const bin = atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return new Uint8Array();
  }
}

/** Secrets may be stored base64-wrapped (safer for multiline PEMs). */
export function readPemSecret(name: string): string {
  const raw = Deno.env.get(name) ?? "";
  if (!raw) throw new Error(`Missing secret: ${name}`);
  if (raw.includes("-----BEGIN")) return raw.replace(/\\n/g, "\n");
  return new TextDecoder().decode(b64ToBytes(raw));
}
