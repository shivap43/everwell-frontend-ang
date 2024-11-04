module.exports = {
    preset: "../../jest.preset.js",
    coverageDirectory: "../../coverage/libs/message-center",

    setupFilesAfterEnv: ["../../jest.setup.ts", "<rootDir>/src/test-setup.ts"],
    globals: {
        "ts-jest": {
            stringifyContentPathRegex: "\\.(html|svg)$",

            tsconfig: "<rootDir>/tsconfig.spec.json",
        },
    },
    displayName: "message-center",
    snapshotSerializers: [
        "jest-preset-angular/build/serializers/no-ng-attributes",
        "jest-preset-angular/build/serializers/ng-snapshot",
        "jest-preset-angular/build/serializers/html-comment",
    ],
    transform: {
        "^.+.(ts|mjs|js|html)$": "jest-preset-angular",
    },
    transformIgnorePatterns: ["node_modules/(?!.*.mjs$)"],
};
