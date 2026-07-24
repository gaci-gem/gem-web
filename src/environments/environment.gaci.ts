// environment.gaci.ts — prod-LAN placeholder. Cookie is host-only (no Domain)
// so the single-IP serving pattern works. The trustedReturnOrigins list holds
// PROD-LAN raw IPs as placeholders; ops owns the real values (D2 follow-up;
// ADR-006 documents the placeholder nature). When ops promotes prod-real,
// this file is the prod-LAN target — a real prod-real override arrives in
// Slice 4 alongside the parent domain confirmation (D1).

export const environment = {
  // BASE_URL is a build-time placeholder resolved by tools/write-version.js.
  BASE_URL: '__BASE_URL__',

  loginUrl: '__GEM_WEB_URL__/login',
  apiBaseUrl: '__BASE_URL__',
  cookieName: 'token',
  cookieOnlyAuth: true,
  useCookieAuth: true,
  REVERT_LITERAL: false,

  // Origin allowlist replaced at container startup by entrypoint.sh
  trustedReturnOrigins: [
    '__GEM_WEB_URL__',
    '__GEM_DOCS_URL__',
  ] as string[],
}
