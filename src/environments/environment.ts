// environment.ts — base/default. Real builds replace this file via the
// angular.json configurations (development, gaci, gaciTest). Each real build
// re-declares all keys so TS structural shape is consistent.
//
// Slice 2 (shared-auth-cross-origin): env-driven origin allowlist + cookie
// handover flags. The `trustedReturnOrigins` shape lives on the caller —
// `sign-in.ts` passes it to `isTrustedReturnUrl(url, trustedReturnOrigins)`.

export const environment = {
  // Base URL of the gem-api backend (HTTPS in test/prod; localhost in dev).
  BASE_URL: '',

  // auth/cookie wiring (test/prod only; dev leaves cookies off).
  loginUrl: '',
  apiBaseUrl: '', // alias of BASE_URL; consumed by the credentials-interceptor
  cookieName: 'token',
  cookieOnlyAuth: false,
  useCookieAuth: false,

  // Origin allowlist for the open-redirect guard. Empty by default; the
  // per-environment file overrides it. NEVER widen this without explicit
  // spec/design approval.
  trustedReturnOrigins: [] as string[],
}
