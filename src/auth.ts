import { randomUUID } from "node:crypto";
import { Session } from "./session.js";
import { SrpClient } from "./srp.js";

const CLIENT_ID = "d39ba9916b7251055b22c7f910e2ea796ee65e98b2ddecea8f5dde8d9d1a815d";
const AUTH_ENDPOINT = "https://idmsa.apple.com/appleauth/auth";
const SETUP_ENDPOINT = "https://setup.icloud.com/setup/ws/1";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:103.0) Gecko/20100101 Firefox/103.0";

/** Thrown when Apple rejects the credentials or the account can't be reached. */
export class AuthError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** An authenticated iCloud session, ready for Find My service calls. */
export interface AuthResult {
  session: Session;
  /** Base URL of the Find My web service, e.g. https://p123-fmipweb.icloud.com. */
  findMeUrl: string;
  /** Base URL for account setup calls (used by the erase flow). */
  setupUrl: string;
  /** Query string shared by all service calls (clientId, dsid, build numbers). */
  params: string;
  /** The web auth token, needed to authorize an erase. */
  dsWebAuthToken: string;
}

/**
 * Signs in using Apple's Find My web flow. Thanks to Apple's lost-device
 * carve-out, device locations are reachable with just the Apple ID and password
 * — no two-factor code, since the device holding that code may be the lost one.
 */
export async function authenticate(email: string, password: string): Promise<AuthResult> {
  const session = new Session();
  const clientId = randomUUID().toLowerCase();

  const authHeaders = {
    "User-Agent": USER_AGENT,
    Accept: "application/json, text/javascript",
    "Content-Type": "application/json",
    Origin: "https://idmsa.apple.com",
    Referer: "https://idmsa.apple.com",
    "X-Apple-Widget-Key": CLIENT_ID,
    "X-Apple-OAuth-Client-Id": CLIENT_ID,
    "X-Apple-OAuth-Client-Type": "firstPartyAuth",
    "X-Apple-OAuth-Redirect-URI": "https://www.icloud.com",
    "X-Apple-OAuth-Response-Mode": "web_message",
    "X-Apple-OAuth-Response-Type": "code",
    "X-Apple-OAuth-State": clientId,
    "X-Apple-Frame-Id": clientId,
  };
  const setupHeaders = {
    "User-Agent": USER_AGENT,
    Accept: "application/json",
    "Content-Type": "application/json",
    Origin: "https://www.icloud.com",
    Referer: "https://www.icloud.com/",
  };

  // 1. SRP sign-in: prove the password without ever sending it.
  const srp = new SrpClient(email, password);
  const init = await session.fetch(`${AUTH_ENDPOINT}/signin/init`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ a: srp.publicKey(), accountName: email, protocols: ["s2k", "s2k_fo"] }),
  });
  if (!init.ok) throw new AuthError("Sign-in failed", init.status);

  const challenge = await init.json();
  const { m1, m2 } = srp.proof(challenge);
  const complete = await session.fetch(`${AUTH_ENDPOINT}/signin/complete?isRememberMeEnabled=true`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ accountName: email, c: challenge.c, m1, m2, rememberMe: true, trustTokens: [] }),
  });
  // 200 = trusted, 409 = 2FA account (fine — the carve-out doesn't need a code).
  if (complete.status !== 200 && complete.status !== 409) {
    throw new AuthError("Invalid Apple ID or password", complete.status);
  }

  const dsWebAuthToken = complete.headers.get("X-Apple-Session-Token");
  const accountCountry = complete.headers.get("X-Apple-ID-Account-Country");
  if (!dsWebAuthToken) throw new AuthError("No session token returned");

  // 2. Exchange the token for iCloud service access (works even when untrusted).
  const login = await session.fetch(`${SETUP_ENDPOINT}/accountLogin`, {
    method: "POST",
    headers: setupHeaders,
    body: JSON.stringify({
      accountCountryCode: accountCountry ?? "",
      dsWebAuthToken,
      extended_login: true,
      trustToken: "",
    }),
  });
  if (!login.ok) throw new AuthError("Account login failed", login.status);

  const data = await login.json();
  const findMeUrl: string | undefined = data?.webservices?.findme?.url;
  if (!findMeUrl) throw new AuthError("Find My is not available on this account");

  const params = new URLSearchParams({
    clientBuildNumber: "2534Project66",
    clientMasteringNumber: "2534B22",
    clientId,
  });
  if (data.dsInfo?.dsid) params.set("dsid", data.dsInfo.dsid);

  return { session, findMeUrl, setupUrl: SETUP_ENDPOINT, params: params.toString(), dsWebAuthToken };
}
