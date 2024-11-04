module.exports = {
    displayName: "rate-sheets",
    preset: "../../jest.preset.js",
    globals: {
        "ts-jest": {
            stringifyContentPathRegex: "\\.(html|svg)$",
            tsconfig: "<rootDir>/tsconfig.spec.json",
        },
    },
    transform: {
        "^.+.(ts|mjs|js|html)$": "jest-preset-angular",
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
    coverageDirectory: "../../coverage/libs/rate-sheets",
    transformIgnorePatterns: ["node_modules/(?!.*.mjs$)"],
    snapshotSerializers: [
        "jest-preset-angular/build/serializers/no-ng-attributes",
        "jest-preset-angular/build/serializers/ng-snapshot",
        "jest-preset-angular/build/serializers/html-comment",
    ],
    setupFilesAfterEnv: ["../../jest.setup.ts", "<rootDir>/src/test-setup.ts"],
};
