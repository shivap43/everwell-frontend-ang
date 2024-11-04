const PROXY_CONFIG = {
    "/api/messageCenter/*": {
        target: "http://localhost:3333",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/auth/*": {
        target: "https://www.dev.everwellbenefits.com",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/static/*": {
        target: "https://www.dev.everwellbenefits.com",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/core/*": {
        target: "https://www.dev.everwellbenefits.com",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/documents/*": {
        target: "https://www.dev.everwellbenefits.com",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/account/classTypes/*": {
        target: "https://www.dev.everwellbenefits.com",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/account/regionTypes/*": {
        target: "https://www.dev.everwellbenefits.com",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/enrollment/shopping/*": {
        target: "https://www.dev.everwellbenefits.com",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/accountList/*": {
        target: "https://www.dev.everwellbenefits.com",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/account/resourceCategories/*": {
        target: "http://localhost:3333",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/account/resources": {
        target: "http://localhost:3333",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/account/resources/*": {
        target: "http://localhost:3333",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/account/audienceGroupings/*": {
        target: "http://localhost:3333",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/members/*": {
        target: "https://www.dev.everwellbenefits.com",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    // "/api/account/*": {
    //   target: "https://www.dev.everwellbenefits.com",
    //   secure: false,
    //   changeOrigin: true,
    //   logLevel: "debug"
    // },
    "/api/account/admins": {
        target: "http://localhost:3333",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/account/producers": {
        target: "http://localhost:3333",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
    "/api/*": {
        target: "https://www.dev.everwellbenefits.com",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
    },
};

module.exports = PROXY_CONFIG;
