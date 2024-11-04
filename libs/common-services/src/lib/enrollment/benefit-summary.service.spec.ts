import { TestBed } from "@angular/core/testing";
import { BenefitSummaryService } from "./benefit-summary.service";

describe("BenefitSummaryService", () => {
    let service: BenefitSummaryService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [],
        });

        service = TestBed.inject(BenefitSummaryService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("setEndCoverageFlag()", () => {
        it("should set isAnyAccountViewed subject", () => {
            const spy = jest.spyOn(service["submitEndCoverage$"], "next");
            service.setEndCoverageFlag(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("getEndCoverageFlag()", () => {
        it("should return the false value by default as its not set initially ", (done) => {
            expect.assertions(1);
            service.getEndCoverageFlag().subscribe((data) => {
                expect(data).toBe(false);
                done();
            });
        });
    });
});
