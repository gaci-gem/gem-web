// environment.gaci.ts — prod-LAN placeholder. Cookie is host-only (no Domain)
// so the single-IP serving pattern works. The trustedReturnOrigins list holds
// PROD-LAN raw IPs as placeholders; ops owns the real values (D2 follow-up;
// ADR-006 documents the placeholder nature). When ops promotes prod-real,
// this file is the prod-LAN target — a real prod-real override arrives in
// Slice 4 alongside the parent domain confirmation (D1).

export const environment = {
  // BASE_URL is a build-time placeholder resolved by tools/write-version.js.
  BASE_URL: '__BASE_URL__',
  gemClientesUrl: '__GEM_CLIENTES_URL__',

  loginUrl: '__GEM_WEB_URL__/login',
  apiBaseUrl: '__BASE_URL__',
  mcpUrl: '__GEM_MCP_URL__',
  cookieName: 'token',
  cookieOnlyAuth: true,
  useCookieAuth: true,
  REVERT_LITERAL: false,

    license: 'eyJpZCI6ImFhMjM4MDU3LTRhMGUtNDlhNy04NWZmLTM3YjhjNjU5NDY2MCIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3OTQzNjA4ODQsImV4cCI6MTgyNTg5Njg4NH0.wTVafoF54ldYNHuPQNR1BbzE7mohcrV_uhUPZK-SP50tGtu5-x8BdLK73MsD3W3EnaStVvk-ZsN17kCv4DtUCA',

  // Origin allowlist replaced at container startup by entrypoint.sh
  trustedReturnOrigins: [
    '__GEM_WEB_URL__',
    '__GEM_DOCS_URL__',
  ] as string[],
}
