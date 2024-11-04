import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminService } from "@empowered/api";
import { AsyncStatus, Gender, ProductId, TobaccoStatus } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store";
import {
    mockAdminService,
    mockLanguageService,
    mockNGXSRateSheetsStateService,
    mockRateSheetsComponentStoreService,
    mockUserService,
    mockMatBottomSheet,
    mockEmpoweredSheetService,
} from "@empowered/testing";
import { UserService } from "@empowered/user";
import { provideMockStore } from "@ngrx/store/testing";
import { NGXSRateSheetsStateService } from "./ngxs-rate-sheets-state/ngxs-rate-sheets-state.service";
import { ProductsComponent } from "./products/products.component";
import { RateSheetsComponentStoreService } from "./rate-sheets-component-store/rate-sheets-component-store.service";
import { RateSheetsComponent } from "./rate-sheets.component";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { EmpoweredSheetService } from "@empowered/common-services";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { SHARED_FEATURE_KEY, SharedPartialState } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { combineLatest } from "rxjs/operators";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

const paymentFrequency = [
    { id: 2342, frequencyType: "Monthly", payrollsPerYear: 12, name: "Monthly" },
    { id: 2324, frequencyType: "Weekly", payrollsPerYear: 48, name: "Weekly" },
    { id: 2329, frequencyType: "Bi-Weekly", payrollsPerYear: 80, name: "Bi-Weekly" },
];
const riskClasses = [
    { id: 123, name: "A" },
    { id: 124, name: "B" },
    { id: 125, name: "C" },
    { id: 126, name: "D" },
];
const allStates = [
    { abbreviation: "GA", name: "Georgia" },
    { abbreviation: "CA", name: "California" },
];
const configurations = [
    {
        channel: "PAYROLL",
        allowedRiskValues: ["A", "B", "C", "D", "E", "F"],
        allowedPayFrequency: ["Monthly", "Weekly", "Bi-Weekly"],
    },
    {
        channel: "UNION",
        allowedRiskValues: ["A", "B", "C"],
        allowedPayFrequency: ["Monthly", "Weekly"],
    },
];

const mockInitialState = {
    [SHARED_FEATURE_KEY]: {
        ...SharedState.initialState,
    },
} as SharedPartialState;

describe("RateSheetsComponent", () => {
    let component: RateSheetsComponent;
    let fixture: ComponentFixture<RateSheetsComponent>;
    let adminService: AdminService;
    let rateSheetsComponentStoreService: RateSheetsComponentStoreService;
    let ngxsRateSheetsStateService: NGXSRateSheetsStateService;
    let empoweredSheetService: EmpoweredSheetService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RateSheetsComponent, ProductsComponent, MockRichTooltipDirective],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                NGRXStore,
                provideMockStore({ initialState: mockInitialState }),
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: NGXSRateSheetsStateService,
                    useValue: mockNGXSRateSheetsStateService,
                },
                {
                    provide: AdminService,
                    useValue: mockAdminService,
                },
                {
                    provide: RateSheetsComponentStoreService,
                    useValue: mockRateSheetsComponentStoreService,
                },
                {
                    provide: MatBottomSheet,
                    useValue: mockMatBottomSheet,
                },
                {
                    provide: EmpoweredSheetService,
                    useValue: mockEmpoweredSheetService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RateSheetsComponent);
        component = fixture.componentInstance;
        rateSheetsComponentStoreService = TestBed.inject(RateSheetsComponentStoreService);
        adminService = TestBed.inject(AdminService);
        ngxsRateSheetsStateService = TestBed.inject(NGXSRateSheetsStateService);
        component.paymentFrequency = paymentFrequency;
        component.riskClasses = riskClasses;
        component.adminId = 111;
        component.defaultStateName = "Georgia";
        component.allStates = allStates;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should initialize the component by setting up required data", () => {
            const spy1 = jest.spyOn(component, "getAdminId");
            component.adminId = undefined;
            const spy2 = jest.spyOn(ngxsRateSheetsStateService, "setAdminPreference");
            const spy3 = jest.spyOn(ngxsRateSheetsStateService, "setQuoteLevelData");
            const spy4 = jest.spyOn(ngxsRateSheetsStateService, "setRestrictedConfiguration");
            component.ngOnInit();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            expect(spy4).toBeCalled();
        });
    });

    describe("getAdminId()", () => {
        it("should get the id of the admin", () => {
            component.getAdminId();
            expect(component.adminId).toStrictEqual(111);
        });
    });

    describe("getStateName()", () => {
        it("should return the state name based on state abbreviation passed", () => {
            expect(component.getStateName("CA", allStates)).toStrictEqual("California");
        });
    });

    describe("updateConfigurations()", () => {
        it("should update the pay frequencies and risk classes to valid values based on channel, provided defaultPayFrequency and defaultRiskClass are among valid values", () => {
            component.defaultChannelName = "UNION";
            component.defaultPayFrequencyName = "Monthly";
            component.defaultRiskClassName = "A";
            component.updateConfigurations(riskClasses, paymentFrequency, configurations);
            expect(component.riskClasses).toStrictEqual([
                { id: 123, name: "A" },
                { id: 124, name: "B" },
                { id: 125, name: "C" },
            ]);
            expect(component.paymentFrequency).toStrictEqual([
                { id: 2342, frequencyType: "Monthly", payrollsPerYear: 12, name: "Monthly" },
                { id: 2324, frequencyType: "Weekly", payrollsPerYear: 48, name: "Weekly" },
            ]);
        });

        it("should update the pay frequencies and risk classes to valid values based on channel, and update defaultPayFrequency and defaultRiskClass to the first element of pay frequencies and risk classes array respectively, provided defaultPayFrequency and defaultRiskClass are not valid", () => {
            component.defaultChannelName = "UNION";
            component.defaultPayFrequencyName = "Bi-Weekly";
            component.defaultRiskClassName = "D";
            component.updateConfigurations(riskClasses, paymentFrequency, configurations);
            expect(component.riskClasses).toStrictEqual([
                { id: 123, name: "A" },
                { id: 124, name: "B" },
                { id: 125, name: "C" },
            ]);
            expect(component.paymentFrequency).toStrictEqual([
                { id: 2342, frequencyType: "Monthly", payrollsPerYear: 12, name: "Monthly" },
                { id: 2324, frequencyType: "Weekly", payrollsPerYear: 48, name: "Weekly" },
            ]);
            expect(component.defaultPayFrequencyName).toStrictEqual("Monthly");
            expect(component.defaultRiskClassName).toStrictEqual("A");
        });
    });

    describe("updateDefaultSettingValuesToStore()", () => {
        it("should update the default values of settings' dropdowns to the component store", () => {
            component.defaultChannelName = "UNION";
            component.defaultPayFrequencyName = "Monthly";
            component.defaultRiskClassName = "A";
            component.defaultStateName = "Georgia";
            const spy1 = jest.spyOn(rateSheetsComponentStoreService, "setCountryState");
            const spy2 = jest.spyOn(rateSheetsComponentStoreService, "setChannel");
            const spy3 = jest.spyOn(rateSheetsComponentStoreService, "setPayFrequency");
            const spy4 = jest.spyOn(rateSheetsComponentStoreService, "setRiskClass");
            component.updateDefaultSettingValuesToStore();
            expect(spy1).toBeCalledWith({
                status: AsyncStatus.SUCCEEDED,
                value: { abbreviation: "GA", name: "Georgia" },
                error: null,
            });
            expect(spy2).toBeCalledWith({
                status: AsyncStatus.SUCCEEDED,
                value: "UNION",
                error: null,
            });
            expect(spy3).toBeCalledWith({
                status: AsyncStatus.SUCCEEDED,
                value: { id: 2342, frequencyType: "Monthly", payrollsPerYear: 12, name: "Monthly" },
                error: null,
            });
            expect(spy4).toBeCalledWith({
                status: AsyncStatus.SUCCEEDED,
                value: { id: 123, name: "A" },
                error: null,
            });
        });
    });

    describe("resetSettings()", () => {
        it("should reset all rate sheet settings to default values", () => {
            const spy1 = jest.spyOn(component, "updateDefaultSettingValuesToStore");
            const spy2 = jest.spyOn(rateSheetsComponentStoreService, "setMoreSettings");
            const moreSettings = { zipCode: null, sicCode: null, eligibleSubscribers: null };
            component.resetSettings();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalledWith({
                status: AsyncStatus.SUCCEEDED,
                value: moreSettings,
                error: null,
            });
        });
    });

    describe("getPlanSeriesSettingsDefaults()", () => {
        it("should get default plan series setting for non-life plans", () => {
            expect(
                component.getPlanSeriesSettingsDefaults(
                    1,
                    200,
                    [{ minAge: 18, maxAge: 99 }],
                    [Gender.FEMALE, Gender.MALE],
                    [TobaccoStatus.NONTOBACCO, TobaccoStatus.TOBACCO],
                ),
            ).toStrictEqual({
                productId: 1,
                planSeriesId: 200,
                settings: {
                    ageBands: [{ minAge: 18, maxAge: 99 }],
                    genders: [Gender.FEMALE, Gender.MALE],
                    tobaccoStatuses: [TobaccoStatus.NONTOBACCO, TobaccoStatus.TOBACCO],
                },
            });
        });

        it("should get default plan series setting for WL plans", () => {
            expect(
                component.getPlanSeriesSettingsDefaults(
                    ProductId.WHOLE_LIFE,
                    200,
                    [{ minAge: 18, maxAge: 99 }],
                    [Gender.FEMALE, Gender.MALE],
                    [TobaccoStatus.NONTOBACCO, TobaccoStatus.TOBACCO],
                ),
            ).toStrictEqual({
                productId: ProductId.WHOLE_LIFE,
                planSeriesId: 200,
                settings: {
                    ageBands: [{ minAge: 18, maxAge: 99 }],
                    genders: [Gender.FEMALE],
                    tobaccoStatuses: [TobaccoStatus.NONTOBACCO],
                },
            });
        });

        it("should get default plan series setting for TL plans", () => {
            expect(
                component.getPlanSeriesSettingsDefaults(
                    ProductId.TERM_LIFE,
                    200,
                    [{ minAge: 18, maxAge: 99 }],
                    [Gender.FEMALE, Gender.MALE],
                    [TobaccoStatus.NONTOBACCO, TobaccoStatus.TOBACCO],
                ),
            ).toStrictEqual({
                productId: ProductId.TERM_LIFE,
                planSeriesId: 200,
                settings: {
                    ageBands: [{ minAge: 18, maxAge: 99 }],
                    genders: [Gender.FEMALE],
                    tobaccoStatuses: [TobaccoStatus.NONTOBACCO],
                },
            });
        });
    });

    describe("createRateSheet", () => {
        it("should open create-rate-sheet quasimodal", () => {
            empoweredSheetService = TestBed.inject(EmpoweredSheetService);
            const spy = jest.spyOn(empoweredSheetService, "openSheet");
            component.createRateSheet();
            expect(spy).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component["unsubscribe$"], "next");
            const spyForComplete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
});
