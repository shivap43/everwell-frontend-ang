import { PhoneFormatConverterPipe } from "./phone-format-converter.pipe";

describe("PhoneFormatConverterPipe", () => {
    let pipe: PhoneFormatConverterPipe;

    beforeEach(() => {
        pipe = new PhoneFormatConverterPipe();
    });

    it("should create an instance of the pipe", () => {
        expect(pipe).toBeTruthy();
    });

    it("should format a 10-digit phone number", () => {
        expect(pipe.transform("1112223333")).toEqual("111-222-3333");
    });

    it("should format an 11-digit phone number", () => {
        expect(pipe.transform("11112223333")).toEqual("1-111-222-3333");
    });

    it("should include dialing code if so specified", () => {
        expect(pipe.transform("1112223333", "US", true)).toEqual("1-111-222-3333");
    });

    it("should return the string as it is as default value if phone number is invalid", () => {
        expect(pipe.transform("113333", "US", true)).toEqual("113333");
    });
});
