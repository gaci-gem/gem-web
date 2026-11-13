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

    license: 'eyJpZCI6ImFhMjM4MDU3LTRhMGUtNDlhNy04NWZmLTM3YjhjNjU5NDY2MCIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3OTQzNjA4ODQsImV4cCI6MTgyNTg5Njg4NH0.wTVafoF54ldYNHuPQNR1BbzE7mohcrV_uhUPZK-SP50tGtu5-x8BdLK73MsD3W3EnaStVvk-ZsN17kCv4DtUCA',

    trustedReturnOrigins: [
        'http://localhost:4201',
        'http://localhost:4200',
    ] as string[],

};
