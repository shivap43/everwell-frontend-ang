module.exports = {
    displayName: "review-enrollments",
    preset: "../../jest.preset.js",
    setupFilesAfterEnv: ["../../jest.setup.ts", "<rootDir>/src/test-setup.ts"],
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/tsconfig.spec.json",
            stringifyContentPathRegex: "\\.(html|svg)$",
        },
    },
    coverageDirectory: "../../coverage/libs/review-enrollments",
    transform: {
        "^.+\\.(ts|js|html)$": "jest-preset-angular",
    },
    transformIgnorePatterns: ["node_modules/(?!.*.mjs$)"],
    snapshotSerializers: [
        "jest-preset-angular/build/serializers/no-ng-attributes",
        "jest-preset-angular/build/serializers/ng-snapshot",
        "jest-preset-angular/build/serializers/html-comment",
    ],
};
