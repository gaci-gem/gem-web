// environment.gacitest.ts — shared test environment at julitorossian.dev.
// Shared parent domain in production cookie matrix (Slice 1 — `Domain=.julitorossian.dev`).
// Cookie handover active: `useCookieAuth=true`, `cookieOnlyAuth=true`.
// The browser navigates back to gem-docs with the cookie doing the work; no
// `?token=` ever shows up in the address bar.

export const environment = {
  BASE_URL: 'https://makima-v2.julitorossian.dev',

  loginUrl: 'https://gem-web.julitorossian.dev/auth/sign-in',
  apiBaseUrl: 'https://makima-v2.julitorossian.dev',
  cookieName: 'token',
  cookieOnlyAuth: true,
  useCookieAuth: true,

  trustedReturnOrigins: [
    'https://gem-docs.julitorossian.dev',
    'https://gem-web.julitorossian.dev',
  ] as string[],
}
