export const environment = {
    BASE_URL: '',
    gemDocsUrl: 'http://localhost:4201',
    gemClientesUrl: 'http://localhost:4202',

    loginUrl: 'http://localhost:4200/login',
    apiBaseUrl: 'http://localhost:4000',
    mcpUrl: 'http://127.0.0.1:3000/mcp',
    cookieName: 'token',
    cookieOnlyAuth: false,
    useCookieAuth: false,
    REVERT_LITERAL: false,

    trustedReturnOrigins: [
        'http://localhost:4201',
        'http://localhost:4200',
    ] as string[],

};
