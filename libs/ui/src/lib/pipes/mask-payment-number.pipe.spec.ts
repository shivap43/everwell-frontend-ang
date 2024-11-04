import { MaskPaymentPipe } from "./mask-payment-number.pipe";

describe("MaskPaymentPipe", () => {
    let pipe: MaskPaymentPipe;

    beforeEach(() => {
        pipe = new MaskPaymentPipe();
    });

    it("create an instance of the pipe", () => {
        expect(pipe).toBeTruthy();
    });

    it("should mask all except the last 4 digits of <digits>", () => {
        const result = pipe.transform(235345, 4);
        expect(result).toEqual("**5345");
    });

    it("should not mask <digits> if 'length' > digits.length", () => {
        const result = pipe.transform(1324234, 9);
        expect(result).toEqual(1324234);
    });

    it("should return null if <digits> is falsy", () => {
        const result = pipe.transform(null, 0);
        expect(result).toEqual(null);
    });

    it("should mask <digits> if <length> is 0", () => {
        const result = pipe.transform(28785, 0);
        expect(result).toEqual("*8785");
    });
});
