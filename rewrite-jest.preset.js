const preset = require("./jest.preset");

module.exports = {
    ...preset,
    collectCoverageFrom: ["./src/lib/producer-shop/**/*"],
};
