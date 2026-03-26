import type { VirtualTryOnProvider, TryOnInput, TryOnOutput } from "./types";

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT ?? "";
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION ?? "us-central1";
const MODEL = "virtual-try-on-v1";

/**
 * Fetch a Google OAuth2 access token using a service account key.
 * Supports GOOGLE_SERVICE_ACCOUNT_KEY (JSON string) env var.
 */
async function getGoogleAccessToken(): Promise<string> {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not set.");
  }

  const key = JSON.parse(keyJson) as {
    client_email: string;
    private_key: string;
  };

  // Build a JWT for Google's token endpoint
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // Encode JWT (header.payload.signature)
  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  const header = encode({ alg: "RS256", typ: "JWT" });
  const payload = encode(claim);
  const signingInput = `${header}.${payload}`;

  // Sign with RSA-SHA256 using Node crypto
  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(key.private_key, "base64url");

  const jwt = `${signingInput}.${signature}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };

  if (!tokenData.access_token) {
    throw new Error(`Google OAuth error: ${tokenData.error ?? "unknown"}`);
  }

  return tokenData.access_token;
}

/** Convert a URL or data URL to base64 string */
async function toBase64(urlOrDataUrl: string): Promise<string> {
  if (urlOrDataUrl.startsWith("data:")) {
    // Already a data URL — extract the base64 portion
    return urlOrDataUrl.split(",")[1];
  }

  const res = await fetch(urlOrDataUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

export const vertexTryOnProvider: VirtualTryOnProvider = {
  name: "vertex-ai",

  async generateTryOn(input: TryOnInput): Promise<TryOnOutput> {
    if (!PROJECT) {
      throw new Error("GOOGLE_CLOUD_PROJECT is not configured.");
    }

    const [accessToken, personB64, garmentB64] = await Promise.all([
      getGoogleAccessToken(),
      toBase64(input.personImageUrl),
      toBase64(input.garmentImageUrl),
    ]);

    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;

    const requestBody = {
      instances: [
        {
          person_image: { bytesBase64Encoded: personB64 },
          garment_image: { bytesBase64Encoded: garmentB64 },
          ...(input.garmentCategory ? { garment_category: input.garmentCategory } : {}),
        },
      ],
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Vertex AI error: ${res.status} — ${errText}`);
    }

    const data = (await res.json()) as {
      predictions?: Array<{ output_image?: { bytesBase64Encoded?: string } }>;
    };

    const b64Output = data.predictions?.[0]?.output_image?.bytesBase64Encoded;
    if (!b64Output) {
      throw new Error("Vertex AI returned no output image.");
    }

    const outputImageUrl = `data:image/jpeg;base64,${b64Output}`;

    return {
      outputImageUrl,
      provider: "vertex-ai",
      raw: data,
    };
  },
};
