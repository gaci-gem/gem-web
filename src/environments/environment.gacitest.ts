// environment.gacitest.ts — shared test environment at julitorossian.dev.
// Shared parent domain in production cookie matrix (Slice 1 — `Domain=.julitorossian.dev`).
// Cookie handover active: `useCookieAuth=true`, `cookieOnlyAuth=true`.
// The browser navigates back to gem-docs with the cookie doing the work; no
// `?token=` ever shows up in the address bar.

export const environment = {
  BASE_URL: 'https://makima-v2.julitorossian.dev',
  gemClientesUrl: 'https://gem-clientes.julitorossian.dev',

  loginUrl: 'https://gem-web.julitorossian.dev/login',
  apiBaseUrl: 'https://makima-v2.julitorossian.dev',
  mcpUrl: 'http://127.0.0.1:3000/mcp',
  cookieName: 'token',
  cookieOnlyAuth: true,
  useCookieAuth: true,
  REVERT_LITERAL: false,

    license: 'eyJpZCI6ImFhMjM4MDU3LTRhMGUtNDlhNy04NWZmLTM3YjhjNjU5NDY2MCIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3OTQzNjA4ODQsImV4cCI6MTgyNTg5Njg4NH0.wTVafoF54ldYNHuPQNR1BbzE7mohcrV_uhUPZK-SP50tGtu5-x8BdLK73MsD3W3EnaStVvk-ZsN17kCv4DtUCA',

  trustedReturnOrigins: [
    'https://gem-docs.julitorossian.dev',
    'https://gem-web.julitorossian.dev',
  ] as string[],
}
