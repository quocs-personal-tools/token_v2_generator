import SHA256 from "crypto-js/sha256";

export type TokenV2Params = {
  queryParams?: Record<string, string>;
  bodyData?: unknown;
  bearerToken: string;
  apiShareKey: string;
};

function getQueryParamsRawString(queryParams: Record<string, string>): string {
  const filteredParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null) {
      filteredParams[key] = value;
    }
  }
  return new URLSearchParams(filteredParams).toString();
}

export function getObjectFromQueryParamsString(
  queryString: string
): Record<string, string> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function getActualBearerToken(bearerToken: string): string {
  const parts = bearerToken.trim().split(/\s+/);
  if (parts.length >= 2) return parts[1] ?? "";
  return parts[0] ?? "";
}

function sha256Hex(input: string): string {
  return SHA256(input).toString();
}

export async function generateTokenV2({
  queryParams,
  bodyData,
  bearerToken,
  apiShareKey,
}: TokenV2Params): Promise<string> {
  if (!bearerToken.trim()) throw new Error("Token is required");
  if (!apiShareKey.trim()) throw new Error("API share key is required");

  let input = "";
  if (queryParams) {
    input += `${getQueryParamsRawString(queryParams)}`;
  }
  if (bodyData !== undefined) {
    input += `${JSON.stringify(bodyData)}`;
  }

  const actualToken = getActualBearerToken(bearerToken);
  if (!actualToken) throw new Error("Invalid bearer token");

  input += `${actualToken}${apiShareKey}`;
  return sha256Hex(input);
}

export function parseQueryParams(
  input: string
): Record<string, string> | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  // JSON object: {"a":"1"}
  if (trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error("Query params JSON must be an object");
    }
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v === undefined || v === null) continue;
      out[k] = String(v);
    }
    return out;
  }

  // Querystring: a=1&b=2
  if (trimmed.includes("=")) {
    const qs = trimmed.startsWith("?") ? trimmed.slice(1) : trimmed;
    return getObjectFromQueryParamsString(qs);
  }

  throw new Error("Query params must be JSON object or querystring");
}

export function parseBodyData(input: string): unknown | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error("Body data must be valid JSON");
  }
}
