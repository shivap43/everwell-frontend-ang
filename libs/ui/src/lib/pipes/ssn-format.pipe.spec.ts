import { SsnFormatPipe } from "./ssn-format.pipe";

describe("SsnFormatPipe", () => {
    let pipe: SsnFormatPipe;
    let ssnSplitFormat: RegExp;

    beforeEach(() => {
        pipe = new SsnFormatPipe();
        ssnSplitFormat = /([\dX]{3})([\dX]{2})([\dX]{4})/;
    });

    it("should create an instance of the pipe", () => {
        expect(pipe).toBeTruthy();
    });

    it("should format a valid SSN", () => {
        const result = pipe.transform("123456788", ssnSplitFormat);
        expect(result).toBe("123-45-6788");
    });

    it("should return the input unchanged if it is not a valid SSN or an empty string", () => {
        const result = pipe.transform("", ssnSplitFormat);
        expect(result).toBe("");
    });

    it("should return the input unchanged if it is a formatted SSN", () => {
        const result = pipe.transform("123-45-6788", ssnSplitFormat);
        expect(result).toBe("123-45-6788");
    });

    it("should return the input unchanged if the regex param is undefined", () => {
        const result = pipe.transform("123456788", undefined);
        expect(result).toBe("123456788");
    });
});
