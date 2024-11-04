import { TruncatePipe } from "./truncate.pipe";

describe("TruncatePipe", () => {
    let pipe: TruncatePipe;

    beforeEach(() => {
        pipe = new TruncatePipe();
    });

    it("should create an instance of the pipe", () => {
        expect(pipe).toBeTruthy();
    });

    it("should truncate the input value correctly", () => {
        expect(pipe.transform("Very very long long long long long long account name", 32)).toEqual("Very very long ... account name");
    });

    it("should truncate the input value so that its length is the given characterLimit - 1", () => {
        expect(pipe.transform("Very very long long long long long long account name", 32).length).toEqual(31);
    });

    it("should default to 30 character limit if none is specified", () => {
        expect(pipe.transform("CLAXTON HOBBS PHARMACY - ZZK5 (dev-ZZK5)")).toEqual("CLAXTON HOBBS ...5 (dev-ZZK5)");
    });

    it("should return the input value unchanged if its length <= characterLimit", () => {
        expect(pipe.transform("CLAXTON HOBBS PHARMACY - ZZK5 (dev-ZZK5)", 50)).toEqual("CLAXTON HOBBS PHARMACY - ZZK5 (dev-ZZK5)");
    });
});
