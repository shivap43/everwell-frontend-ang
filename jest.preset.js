const nxPreset = require("@nrwl/jest/preset");
const path = require("path");
const projectRoot = path.resolve(__dirname);

module.exports = {
    ...nxPreset,
    testEnvironment: "jsdom",
    testMatch: ["**/+(*.)+(spec|test).+(ts|js)?(x)"],
    transform: {
        "^.+\\.(ts|js|html)$": "jest-preset-angular",
    },
    maxWorkers: 1,
    resolver: "@nrwl/jest/plugins/resolver",
    moduleFileExtensions: ["ts", "js", "html"],
    coverageReporters: ["html"],
    collectCoverage: true,
    cacheDirectory: path.join(projectRoot, "./node_modules/.cache/jest"),
};
