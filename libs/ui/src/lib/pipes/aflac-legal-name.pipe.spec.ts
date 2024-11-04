import { AflacLegalNamePipe } from "./aflac-legal-name.pipe";

describe("AflacLegalNamePipe", () => {
    const legalName = "Longer Aflac legal name here";
    let pipe: AflacLegalNamePipe;

    beforeEach(() => {
        pipe = new AflacLegalNamePipe();
    });

    it("create an instance of the pipe", () => {
        expect(pipe).toBeTruthy();
    });

    it("should output the same carrier name if not Aflac", () => {
        const carrier = "Carrier Test";
        const result = pipe.transform(carrier, legalName);
        expect(result).toBe("Carrier Test");
    });

    it("should output the Aflac legal name if carrier is Aflac", () => {
        const carrier = "Aflac";
        const result = pipe.transform(carrier, legalName);
        expect(result).toBe("Longer Aflac legal name here");
    });

    it("should output the Aflac legal name plus other carriers properly", () => {
        const carriers = "Aflac,ABC Carrier,Test";
        const result = pipe.transform(carriers, legalName);
        expect(result).toBe("Longer Aflac legal name here; ABC Carrier; Test");
    });
});
