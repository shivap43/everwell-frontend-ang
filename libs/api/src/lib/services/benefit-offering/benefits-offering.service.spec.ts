import { TestBed } from "@angular/core/testing";
import { BenefitsOfferingService } from "./benefits-offering.service";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { AccountCarrier, ProductContributionLimit } from "./models";

describe("BenefitsOfferingService", () => {
    let service: BenefitsOfferingService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(BenefitsOfferingService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    describe("BenefitsOfferingService", () => {
        it("should be defined", () => {
            expect(service).toBeTruthy();
        });

        afterEach(() => {
            httpTestingController.verify();
        });

        describe("getBenefitOfferingCarrier()", () => {
            it("should return Account Carrier against provided ID", (done) => {
                expect.assertions(2);
                const mockAccountCarrier: AccountCarrier = { id: 1, name: "Aflac" };
                const useUnapproved = false;
                service.getBenefitOfferingCarrier(mockAccountCarrier.id, useUnapproved).subscribe((data) => {
                    expect(data).toBe(mockAccountCarrier);
                    done();
                });

                const req = httpTestingController.expectOne(
                    `/api/benefitOffering/carriers/${mockAccountCarrier.id}?useUnapproved=${useUnapproved}`,
                );
                expect(req.request.method).toBe("GET");
                req.flush(mockAccountCarrier);
            });
        });

        describe("getRecentCensusConflict()", () => {
            it("should return states with census conflicts", (done) => {
                expect.assertions(3);
                const mockRecentCensusConflictData = {
                    states: ["GA"],
                    count: 41,
                };

                service.getRecentCensusConflict(1234).subscribe((data) => {
                    expect(data).toBe(mockRecentCensusConflictData);
                    done();
                });

                const req = httpTestingController.expectOne("/api/benefitOffering/settings/recentCensusConflict");
                expect(req.request.method).toBe("GET");
                expect(req.request.headers.get("MP-Group")).toBe("1234");
                req.flush(mockRecentCensusConflictData);
            });
        });

        describe("getProductContributionLimits()", () => {
            it("should return product contribution limits", (done) => {
                expect.assertions(3);
                const mockProductContributionLimit: ProductContributionLimit = {
                    maxContribution: 12000,
                    maxFamilyContribution: 120000,
                    minContribution: 30000,
                    minFamilyContribution: 1000,
                };
                const productId = 1;

                service.getProductContributionLimits(productId, 12345).subscribe((data) => {
                    expect(data).toBe(mockProductContributionLimit);
                    done();
                });

                const req = httpTestingController.expectOne(`/api/benefitOffering/products/${productId}/contributionLimits`);
                expect(req.request.headers.get("MP-Group")).toBe("12345");
                expect(req.request.method).toBe("GET");
                req.flush(mockProductContributionLimit);
            });
        });

        describe("getPlanYear()", () => {
            it("should return play year", (done) => {
                expect.assertions(3);
                const mockPlanYearData = {
                    type: "AFLAC_INDIVIDUAL",
                    id: 1,
                    locked: false,
                    name: "py12",
                    enrollmentPeriod: {
                        effectiveStarting: "2023-07-07",
                        expiresAfter: "2023-07-31",
                    },
                    coveragePeriod: {
                        effectiveStarting: "2023-08-01",
                        expiresAfter: "2024-07-31",
                    },
                    activeEnrollments: false,
                };
                const useUnapproved = false;

                service.getPlanYear(mockPlanYearData.id, 12345, false).subscribe((data) => {
                    expect(data).toBe(mockPlanYearData);
                    done();
                });

                const req = httpTestingController.expectOne(
                    `/api/benefitOffering/planYears/${mockPlanYearData.id}?useUnapproved=${useUnapproved}&checkActiveEnrollments=false`,
                );
                expect(req.request.headers.get("MP-Group")).toBe("12345");
                expect(req.request.method).toBe("GET");
                req.flush(mockPlanYearData);
            });
        });
    });
});
