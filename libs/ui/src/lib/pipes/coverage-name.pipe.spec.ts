import { CoverageNamePipe } from "./coverage-name.pipe";

describe("CoverageNamePipe", () => {
    let pipe: CoverageNamePipe;

    beforeEach(() => {
        pipe = new CoverageNamePipe();
    });

    it("should create an instance of the pipe", () => {
        expect(pipe).toBeTruthy();
    });

    it("should name enrolled plans as individual", () => {
        expect(pipe.transform("enrolled")).toEqual("Individual");
    });
});
