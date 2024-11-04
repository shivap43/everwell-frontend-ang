import { TestBed } from "@angular/core/testing";
import { AccountService } from "./account.service";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { AccountImportTypes, Accounts, PartnerAccountType, ProspectType, RatingCode, StatusTypeValues } from "@empowered/constants";
import { BrandingColorFormat, BrandingType, StandardBrandingModel } from "./models";

const MOCK_BRANDING_DATA: StandardBrandingModel = {
    id: 2326,
    colorFormat: BrandingColorFormat.HEX,
    colorCode: "00aab9",
    createDate: "2023-08-31T07:40:48",
    type: BrandingType.STANDARD,
    standardLogos: {
        smallLogo: {
            logoId: 2,
            status: {
                status: "COMPLETE",
            },
        },
        largeLogo: {
            logoId: 3,
            status: {
                status: "COMPLETE",
            },
        },
    },
};

const MOCK_ACCOUNT_DATA: Accounts = {
    id: 181654,
    name: "CLAXTON HOBBS PHARMACY - NQH6",
    accountNumber: "dev-NQH6",
    ratingCode: RatingCode.STANDARD,
    primaryContact: {
        address: {
            address1: "131 W TAYLOR ST",
            address2: "",
            city: "COLUMBUS",
            state: "GA",
            zip: "31907",
        },
        emailAddresses: [],
        phoneNumbers: [
            {
                phoneNumber: "7702272428",
                type: "WORK",
                isMobile: false,
            },
        ],
        primary: true,
        name: "CLAXTON HOBBS PHARMACY - NQH6",
        typeId: 1,
    },
    situs: {
        state: {
            abbreviation: "GA",
            name: "Georgia",
        },
        zip: "31907",
    },
    payFrequencyId: 5,
    type: ProspectType.CLIENT,
    status: StatusTypeValues.ACTIVE,
    partnerAccountType: PartnerAccountType.PAYROLL,
    partnerId: 2,
    importType: AccountImportTypes.AFLAC_INDIVIDUAL,
    enrollmentAssistanceAgreement: false,
    thirdPartyPlatformsEnabled: true,
    checkedOut: false,
    contact: {},
    prospectInformation: { sicIrNumber: "dfdgfd", taxId: " dfdfs" },
    subordinateProducerId: 0,
    typeId: 0,
    employeeCount: 0,
    productsCount: 0,
    daysToEnroll: 0,
};

describe("AccountService", () => {
    let service: AccountService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
        service = TestBed.inject(AccountService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    describe("AccountService", () => {
        it("should be defined", () => {
            expect(service).toBeTruthy();
        });

        describe("Block for API Testing", () => {
            afterEach(() => {
                httpTestingController.verify();
            });

            describe("getAccountBrandings()", () => {
                it("should return all branding details related to a group", (done) => {
                    expect.assertions(2);
                    const mockBrandingDataArray = [MOCK_BRANDING_DATA];

                    service.getAccountBrandings(12345).subscribe((data) => {
                        expect(data).toBe(mockBrandingDataArray);
                        done();
                    });

                    const req = httpTestingController.expectOne("/api/account/brandings");
                    expect(req.request.method).toEqual("GET");
                    req.flush(mockBrandingDataArray);
                });
            });

            describe("getAccountBranding()", () => {
                it("should return a specific branding detail", (done) => {
                    expect.assertions(2);
                    const brandingId = 1;
                    const mockBrandingData = { ...MOCK_BRANDING_DATA, id: brandingId };

                    service.getAccountBranding(brandingId).subscribe((data) => {
                        expect(data).toBe(mockBrandingData);
                        done();
                    });

                    const req = httpTestingController.expectOne(`/api/account/brandings/${brandingId}`);
                    expect(req.request.method).toBe("GET");
                    req.flush(mockBrandingData);
                });
            });

            describe("getAccount()", () => {
                it("should return account details against provided account id", (done) => {
                    expect.assertions(3);
                    const mockAccountData = { ...MOCK_ACCOUNT_DATA, id: 1 };

                    service.getAccount("1").subscribe((data) => {
                        expect(data.id).toBe(1);
                        expect(data).toBe(mockAccountData);
                        done();
                    });

                    const req = httpTestingController.expectOne("/api/account");
                    expect(req.request.method).toBe("GET");
                    req.flush(mockAccountData);
                });
            });

            describe("updateAccount()", () => {
                it("should return the updated account data", (done) => {
                    expect.assertions(2);
                    const updatedAccountData = { ...MOCK_ACCOUNT_DATA, ratingCode: RatingCode.PEO, status: StatusTypeValues.INACTIVE };

                    service.updateAccount("181654", updatedAccountData).subscribe((data) => {
                        expect(data).toBe(updatedAccountData);
                        done();
                    });

                    const req = httpTestingController.expectOne("/api/account");
                    expect(req.request.method).toBe("PUT");
                    req.flush(updatedAccountData);
                });
            });
        });
    });
});
