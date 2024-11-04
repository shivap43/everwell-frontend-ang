import { TestBed } from "@angular/core/testing";
import { AccountProfileService } from "./account-profile.service";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { Organization } from "./models";

const MOCK_CLASS_TYPE_DATA = [
    {
        id: 2,
        name: "Coverage Eligible",
        description: "Allows group administrators to define employees as coverage eligible or coverage ineligible employees.",
        determinesPayFrequency: true,
        determinesPlanAvailabilityOrPricing: false,
        tiedToPlan: false,
        visible: true,
    },
    {
        id: 4,
        name: "PEO Rating",
        description: "Groups Rating Code Type is PEO",
        determinesPayFrequency: false,
        carrierId: 1,
        determinesPlanAvailabilityOrPricing: false,
        tiedToPlan: false,
        visible: true,
    },
];

describe("AccountProfileService", () => {
    let service: AccountProfileService;
    let httpTestingController: HttpTestingController;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(AccountProfileService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    describe("AccountProfileService", () => {
        it("should be defined", () => {
            expect(service).toBeTruthy();
        });

        describe("HTTP Client Testing Block", () => {
            afterEach(() => {
                httpTestingController.verify();
            });

            describe("getOrganizations()", () => {
                it("should return organization details", (done) => {
                    expect.assertions(3);
                    const mockOrganizationDetails: Organization = { name: "Organization Name" };
                    service.getOrganizations("12345").subscribe((data) => {
                        expect(data).toBe(mockOrganizationDetails);
                        done();
                    });

                    const req = httpTestingController.expectOne("/api/account/organizations");
                    expect(req.request.method).toBe("GET");
                    expect(req.request.headers.get("MP-Group")).toBe("12345");
                    req.flush(mockOrganizationDetails);
                });
            });

            describe("getClassTypes()", () => {
                it("should return array of classTypes", (done) => {
                    expect.assertions(2);

                    service.getClassTypes().subscribe((data) => {
                        expect(data).toBe(MOCK_CLASS_TYPE_DATA);
                        done();
                    });

                    const req = httpTestingController.expectOne("/api/account/classTypes");
                    expect(req.request.method).toEqual("GET");
                    req.flush(MOCK_CLASS_TYPE_DATA);
                });
            });

            describe("getClasses()", () => {
                it("should return classType against classTypeId", (done) => {
                    const mockClassTypeIdData = [MOCK_CLASS_TYPE_DATA[0]];
                    service.getClasses(2).subscribe((data) => {
                        expect(data).toBe(mockClassTypeIdData);
                        done();
                    });

                    const req = httpTestingController.expectOne(`/api/account/classTypes/${mockClassTypeIdData[0].id}/classes`);
                    expect(req.request.method).toEqual("GET");
                    req.flush(mockClassTypeIdData);
                });
            });

            describe("getClassType()", () => {
                it("should return classType against classTypeId and mpGroup", (done) => {
                    expect.assertions(3);
                    const mockClassTypeMpData = MOCK_CLASS_TYPE_DATA[1];
                    service.getClassType(4, "12345").subscribe((data) => {
                        expect(data).toBe(mockClassTypeMpData);
                        done();
                    });

                    const req = httpTestingController.expectOne(`/api/account/classTypes/${mockClassTypeMpData.id}`);
                    expect(req.request.method).toBe("GET");
                    expect(req.request.headers.get("Mp-Group")).toBe("12345");

                    req.flush(mockClassTypeMpData);
                });
            });
        });
    });
});
