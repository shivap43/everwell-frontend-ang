import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { mockStore } from "@empowered/testing";
import { Store } from "@ngxs/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { UtilService } from "./util.service";
import { combineLatest, of } from "rxjs";
import { StaticUtilService } from "./static-util.service";
import { MockStore, provideMockStore } from "@ngrx/store/testing";
import {
    AccountImportTypes,
    Accounts,
    GroupAttribute,
    PartnerAccountType,
    ProspectType,
    RatingCode,
    StatusTypeValues,
} from "@empowered/constants";
import { AccountService } from "@empowered/api";
import { getSelectedAccount } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.selectors";

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
describe("UtilService", () => {
    let service: UtilService;
    let staticUtilService: StaticUtilService;
    let accountService: jest.Mocked<AccountService>;
    let ngrxStore = { onAsyncValue: jest.fn(), dispatch: jest.fn() };
    beforeEach(() => {
        const staticUtilServiceMock = {
            hasPermission: jest.fn(),
        };
        const accountServiceMock = {
            hasPermission: jest.fn(),
            getGroupAttributesByName: jest.fn(),
        };
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: AccountService,
                    useValue: accountServiceMock,
                },
                { provide: NGRXStore, useValue: ngrxStore },
                DatePipe,
                provideMockStore({}),
            ],
        });

        service = TestBed.inject(UtilService);
        staticUtilService = TestBed.inject(StaticUtilService);
        accountService = TestBed.inject(AccountService) as jest.Mocked<AccountService>;
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("UtilService", () => {
        it("should be truthy", () => {
                expect(service).toBeTruthy();
        });
    });

    describe("showWellthieLink()", () => {
        it("should return true as the agent level does not belongs to 5  which is default agent level", (done) => {
            expect.assertions(1);
            jest.spyOn(staticUtilService, "cacheConfigValue").mockReturnValueOnce(of("1"));
            service.showWellthieLink().subscribe((data) => {
                expect(data).toBe(true);
                done();
            });
        });
        it("should return false the agent level belongs to 5", (done) => {
            expect.assertions(1);
            jest.spyOn(staticUtilService, "cacheConfigValue").mockReturnValueOnce(of("5"));
            service.showWellthieLink().subscribe((data) => {
                expect(data).toBe(false);
                done();
            });
        });
    });

    describe("checkDisableForRole12Functionalities()", () => {
        it("should check disable for role 12 functionalities", (done) => {
            const permissionString = "testPermission";
            const mpGroupId = "123";
            const mockAccount: Accounts = { ...MOCK_ACCOUNT_DATA, id: 1 };
            jest.spyOn(staticUtilService, "hasPermission").mockReturnValueOnce(of(true));
            ngrxStore.onAsyncValue.mockReturnValue(of(mockAccount));
            accountService.getGroupAttributesByName.mockReturnValue(of([{ id: 1, value: "COMPLETE" }] as GroupAttribute[]));
            service.checkDisableForRole12Functionalities("test", mpGroupId).subscribe((data) => {
                expect(ngrxStore.dispatch).toHaveBeenCalled();
                expect(ngrxStore.onAsyncValue).toHaveBeenCalled();
                done();
            });
        });
    });
});
