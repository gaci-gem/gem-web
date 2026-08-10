export const environment = {
    BASE_URL: '',

    loginUrl: 'http://localhost:4200/login',
    apiBaseUrl: 'http://localhost:4000',
    cookieName: 'token',
    cookieOnlyAuth: false,
    useCookieAuth: false,
    REVERT_LITERAL: false,

    trustedReturnOrigins: [
        'http://localhost:4201',
        'http://localhost:4200',
    ] as string[],

};
