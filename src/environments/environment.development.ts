// environment.development.ts — local dev. Cookies stay off (no Domain) so the
// helper falls back to the URL-token handover branch in `sign-in.ts`. The two
// localhost origins cover both potential gem-api dev hosts and the gem-docs
// companion origin on port 4201.

export const environment = {
  BASE_URL: 'http://localhost:4000',

  loginUrl: 'http://localhost:4200/auth/sign-in',
  apiBaseUrl: 'http://localhost:4000',
  cookieName: 'token',
  cookieOnlyAuth: false,
  useCookieAuth: false,

  trustedReturnOrigins: [
    'http://localhost:4201',
    'http://localhost:4200',
  ] as string[],
}
