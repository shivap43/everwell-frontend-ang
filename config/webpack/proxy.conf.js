// Normally development is based on dev
const PROXY_CONFIG = {
    "/api/*": {
        target: "https://www.dev.everwellbenefits.com",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/ws/*": {
        target: "http://jas001.mp.dev4.clt4.empoweredbenefits.com:8080",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
};

module.exports = PROXY_CONFIG;
