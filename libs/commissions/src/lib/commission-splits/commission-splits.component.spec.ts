import { ComponentType } from "@angular/cdk/portal";
import { DatePipe } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { AccountService, AflacService, BenefitsOfferingService, CommissionSplit, Situs, StaticService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { CommissionsState, StaticUtilService } from "@empowered/ngxs-store";
import { UserService } from "@empowered/user";
import { NgxsModule, Store } from "@ngxs/store";
import { of, throwError } from "rxjs";
import { CompanyCode, WritingNumber } from "@empowered/constants";
import { CommissionSplitsComponent } from "./commission-splits.component";
import {
    mockLanguageService,
    mockMatDialog,
    mockAccountService,
    mockStaticService,
    mockStaticUtilService,
    mockMpGroupAccountService,
    mockSharedService,
    mockUserService,
    mockStore,
    MockReplaceTagPipe,
} from "@empowered/testing";
import { MPGroupAccountService, SharedService } from "@empowered/common-services";
import { State } from "@empowered/ui";

@Directive({
    selector: "[configEnabled]",
})
class MockConfigEnableDirective {
    @Input("configEnabled") configKey: string;
}

@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

const mockAflacService = {
    getSitCodes: (companyCode: CompanyCode, includeExpired?: boolean, allAccountProducers?: boolean, mpGroup?: string) =>
        of([] as WritingNumber[]),
    getCommissionSplits: (mpGroup: string) => of([] as CommissionSplit[]),
    deleteCommissionSplit: (mpGroup: number, commissionId: number) => of(),
} as AflacService;

const mockError = {
    error: {
        status: "ERROR",
        code: 404,
        details: [
            { code: "", message: "Mock 404 error" },
            { code: "", message: "Reached Maximum length" },
        ],
    },
};

const mockBenefitsOfferingService = {
    getCarrierCoverageDetails: (carrierId: number, useUnapproved?: boolean, mpGroup?: string) => of([]),
} as BenefitsOfferingService;

describe("CommissionSplitComponent", () => {
    let component: CommissionSplitsComponent;
    let fixture: ComponentFixture<CommissionSplitsComponent>;
    let store: Store;
    let staticService: StaticService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot([])],
            declarations: [CommissionSplitsComponent, MockReplaceTagPipe, MockConfigEnableDirective, MockRichTooltipDirective],
            providers: [
                DatePipe,
                Store,
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: AflacService,
                    useValue: mockAflacService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: BenefitsOfferingService,
                    useValue: mockBenefitsOfferingService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: MPGroupAccountService,
                    useValue: mockMpGroupAccountService,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CommissionSplitsComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        staticService = TestBed.inject(StaticService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getActiveAndExpiredSitCodes()", () => {
        it("should call fetchActiveAndExpiredSitCodes method", () => {
            const spy = jest.spyOn(component, "fetchActiveAndExpiredSitCodes");
            component.allWritingNumbers = [
                {
                    // eslint-disable-next-line id-denylist
                    number: "U0297",
                    sitCodes: [
                        {
                            id: 51006,
                            code: "1",
                            active: true,
                        },
                        {
                            id: 51032,
                            code: "1",
                            active: true,
                        },
                    ],
                },
            ];
            component.getActiveAndExpiredSitCodes();
            expect(spy).toBeCalledTimes(2);
            expect(spy).toBeCalledWith(
                {
                    id: 51032,
                    code: "1",
                    active: true,
                },
                "U0297",
            );
        });
    });

    describe("checkForRemove()", () => {
        it("should display the remove button if method returns true", () => {
            const commission = {
                conversion: false,
                isDefault: false,
                isPartnerCarrierSplit: false,
                defaultSplit: {
                    remove: true,
                },
                customSplit: {
                    remove: true,
                },
            } as CommissionSplit;
            const result = component.checkForRemove(commission as CommissionSplit);
            expect(result).toStrictEqual(true);
        });
        it("should not display the remove button if method returns false", () => {
            const commission = {
                conversion: false,
                isDefault: true,
                isPartnerCarrierSplit: false,
                defaultSplit: {
                    remove: false,
                },
                customSplit: {
                    remove: true,
                },
            } as CommissionSplit;
            const result = component.checkForRemove(commission);
            expect(result).toStrictEqual(false);
        });
    });

    describe("checkForEdit()", () => {
        it("should display the Edit button if method returns true", () => {
            const commission = {
                isDefault: true,
                defaultSplit: {
                    edit: true,
                },
                customSplit: {
                    edit: true,
                },
                expandedView: false,
                isPartnerCarrierSplit: false,
            } as CommissionSplit;
            const result = component.checkForEdit(commission);
            expect(result).toStrictEqual(true);
        });

        it("should not display the Edit button if method returns false", () => {
            const commission = {
                isDefault: false,
                defaultSplit: {
                    edit: false,
                },
                customSplit: {
                    edit: false,
                },
                expandedView: false,
                isPartnerCarrierSplit: false,
            } as CommissionSplit;
            const result = component.checkForEdit(commission);
            expect(result).toStrictEqual(false);
        });
    });

    describe("getCompanyCode()", () => {
        const mockCompanyCode = {
            US: "US",
        };
        const mockSitus = {
            state: {
                abbreviation: "GA",
                name: "Georgia",
            },
        } as Situs;
        it("should get company code from store", () => {
            const spy = jest.spyOn(store, "selectSnapshot").mockReturnValueOnce(mockCompanyCode);
            component.getCompanyCode();
            expect(spy).toBeCalledWith(CommissionsState.companyCode);
            expect(component.companyCode).toEqual(mockCompanyCode.US);
        });
        it("should get situs if no company code", () => {
            jest.spyOn(store, "selectSnapshot").mockReturnValueOnce(undefined);
            const spy2 = jest.spyOn(store, "selectSnapshot").mockReturnValueOnce(of(mockSitus));
            component.getCompanyCode();
            expect(spy2).toBeCalledWith(CommissionsState.situs);
            expect(component.companyCode).toEqual("US");
        });
    });

    describe("addCustmizedSplit()", () => {
        it("should set expandedView to true if account is direct or not aflac group account", () => {
            component.isDirect = true;
            component.addCustmizedSplit();
            expect(component.expandedView).toEqual(true);
        });
    });

    describe("loadStates()", () => {
        const mockStates = [
            {
                abbreviation: "GA",
                name: "Georgia",
            },
        ] as State[];
        it("should load all available states", () => {
            jest.spyOn(staticService, "getStates").mockReturnValue(of(mockStates));
            component.loadStates();
            expect(component.stateList).toStrictEqual(mockStates);
        });

        it("should show error alert message if error", () => {
            jest.spyOn(staticService, "getStates").mockReturnValue(throwError(mockError));
            component.loadStates();
            expect(component.errorMessage).toBe("secondary.api.ERROR.404");
        });
    });

    describe("getDisplayTextOfStates()", () => {
        it("should get display texts of states", () => {
            component.stateList = [
                {
                    abbreviation: "GA",
                    name: "Georgia",
                },
            ];
            expect(component.getDisplayTextOfStates("GA")).toEqual("Georgia");
        });
    });
});
