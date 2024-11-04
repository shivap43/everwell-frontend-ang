module.exports = {
  preset: "../../../jest.preset.js",
  coverageDirectory: "../../../coverage/libs/portals/group-registration",

  setupFilesAfterEnv: ["../../../jest.setup.ts", "<rootDir>/src/test-setup.ts"],
  globals: { "ts-jest": { tsconfig: "<rootDir>/tsconfig.spec.json" } },
  displayName: "group-registration",
  snapshotSerializers: [
    "jest-preset-angular/build/serializers/no-ng-attributes",
    "jest-preset-angular/build/serializers/ng-snapshot",
    "jest-preset-angular/build/serializers/html-comment",
  ],
};
