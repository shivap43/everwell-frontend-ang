import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NGRXStore } from "@empowered/ngrx-store";
import { provideMockStore } from "@ngrx/store/testing";
import { PlanSelectionComponent } from "./plan-selection.component";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { mockLanguageService, mockRateSheetsComponentStoreService, MockReplaceTagPipe, mockStore } from "@empowered/testing";
import { RateSheetsComponentStoreService } from "../../rate-sheets-component-store/rate-sheets-component-store.service";
import { of } from "rxjs";
import { DatePipe } from "@angular/common";
import { Store } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ADVPlanType } from "@empowered/constants";
import { RateSheetsActions } from "@empowered/ngrx-store/ngrx-states/rate-sheets";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

describe("PlanSelectionComponent", () => {
    let component: PlanSelectionComponent;
    let fixture: ComponentFixture<PlanSelectionComponent>;
    let ngrxStore: NGRXStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, HttpClientTestingModule],
            declarations: [PlanSelectionComponent, MockReplaceTagPipe, MockRichTooltipDirective],
            providers: [
                NGRXStore,
                provideMockStore({}),
                FormBuilder,
                { provide: LanguageService, useValue: mockLanguageService },
                {
                    provide: RateSheetsComponentStoreService,
                    useValue: mockRateSheetsComponentStoreService,
                },
                DatePipe,
                {
                    provide: Store,
                    useValue: mockStore,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlanSelectionComponent);
        component = fixture.componentInstance;
        ngrxStore = TestBed.inject(NGRXStore);
        component.selectedPlanSeriesData$ = of([
            {
                planId: 1234,
                coverageLevelOptions: [{ id: 22, eliminationPeriod: "7/7", name: "7/7 days" }],
                benefitAmounts: [{ units: 5, amount: 500 }],
                genders: [],
                tobaccoStatuses: [],
                ageBands: [],
                salaryRange: { minSalary: 500, maxSalary: 1000 },
                riders: [],
            },
            {
                planId: 1244,
                coverageLevelOptions: [
                    { id: 22, eliminationPeriod: "7/7", name: "7/7 days" },
                    { id: 23, eliminationPeriod: "14/14", name: "14/14 days" },
                ],
                benefitAmounts: [
                    { units: 5, amount: 500 },
                    { units: 6, amount: 600 },
                ],
                genders: [],
                tobaccoStatuses: [],
                ageBands: [],
                salaryRange: { minSalary: 600, maxSalary: 800 },
                riders: [],
            },
        ]);
        component.eliminationOptions$ = of([
            { id: 22, eliminationPeriod: "7/7", name: "7/7 days" },
            { id: 23, eliminationPeriod: "14/14", name: "14/14 days" },
        ]);
        component.benefitAmountOptions$ = of([
            { units: 5, amount: 500 },
            { units: 6, amount: 600 },
        ]);
        component.isOtherProductSelected$ = of(true);
        component.isStdProduct$ = of(false);
        component.isWholeAndTermLifeProduct$ = of(false);
        component.form = new FormGroup({
            plans: new FormControl(),
            eliminationPeriods: new FormControl(),
            selectAllEliminationPeriods: new FormControl(),
        });
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should initialize the plan-selection component", () => {
            expect.assertions(3);
            const spy1 = jest.spyOn(component, "initializeForm");
            const spy2 = jest.spyOn(component, "getCoverageLevelOptions");
            const spy3 = jest.spyOn(component, "getEliminationPeriods");
            component.ngOnInit();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
        });
    });

    describe("getBenefitAmountOptions()", () => {
        it("should get benefit amounts that are valid for selected plans/benefit periods", () => {
            component.minimumBenefitAmountOptions = [];
            const benefitAmountOptions = [
                { units: 5, amount: 500 },
                { units: 6, amount: 600 },
                { units: 7, amount: 700 },
            ];
            const selectedPlanSeriesBenefitAmounts = [500, 600];
            component.getBenefitAmountOptions(benefitAmountOptions, selectedPlanSeriesBenefitAmounts);
            expect(component.minimumBenefitAmountOptions).toStrictEqual([
                { units: 5, amount: 500 },
                { units: 6, amount: 600 },
            ]);
        });
    });

    describe("updateSelectAllCheckbox()", () => {
        it("should update the state of the select all checkbox", () => {
            component.isIndeterminate = false;
            component.updateSelectAllCheckbox("selectAllEliminationPeriods", 10, 8);
            expect(component.form.controls.selectAllEliminationPeriods.value).toBe(false);
            expect(component.isIndeterminate).toBe(true);
        });
    });

    describe("getDisabledBenefitAmounts()", () => {
        it("should get disabled benefit amounts based on plan/benefit period selection", () => {
            const benefitAmountOptions = [
                { units: 5, amount: 500 },
                { units: 6, amount: 600 },
                { units: 7, amount: 700 },
            ];
            const selectedPlanSeriesBenefitAmounts = [500, 700];
            expect(component.getDisabledBenefitAmounts(benefitAmountOptions, selectedPlanSeriesBenefitAmounts)).toStrictEqual([
                false,
                true,
                false,
            ]);
        });
    });

    describe("getDisabledEliminationPeriods()", () => {
        it("should get disabled elimination periods based on benefit period selection", () => {
            const eliminationPeriods = [
                { id: 5, name: "14/14 days" },
                { id: 6, name: "7/7 days" },
                { id: 7, name: "7/14 days" },
            ];
            const selectedPlanSeriesCoverageLevels = [5, 7];
            expect(component.getDisabledEliminationPeriods(eliminationPeriods, selectedPlanSeriesCoverageLevels)).toStrictEqual([
                false,
                true,
                false,
            ]);
        });
    });

    describe("getMaxAge()", () => {
        it("should get maximum age among all maxAges", () => {
            expect(
                component.getMaxAge([
                    { minAge: 18, maxAge: 35 },
                    { minAge: 36, maxAge: 45 },
                ]),
            ).toStrictEqual(45);
        });
    });

    describe("initializeForm()", () => {
        it("should initialize the form", () => {
            component.initializeForm();
            expect(component.form).toBeDefined();
        });

        it("should initialize the form with STD product controls", () => {
            expect.assertions(1);
            component.isStdProduct$ = of(true);
            component.initializeForm();
            expect(component.form).toBeDefined();
        });
    });

    describe("addToRateSheet()", () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.product = { id: 1, name: "Test Product", code: "" };
            component.planSeries = {
                id: 1,
                code: "",
                name: "Test Plan Series",
                categories: [],
                plans: [],
            };
            component.form.controls.plans.setValue([
                {
                    id: 1,
                    name: "test",
                    adminName: "test",
                    carrierId: 1,
                    missingEmployerFlyer: false,
                    displayOrder: 1,
                    description: "test",
                },
            ]);
        });
        it("should call helper functions and update store", () => {
            component.coverageLevelOptions$ = of([{ id: 1, name: "Test Coverage Level" }]);
            component.eliminationOptions$ = of([]);
            component.benefitAmountOptions$ = of([]);
            component.isCarrierOfADV$ = of(false);
            component.form.controls.benefitAmounts.setValue(null);

            const spySetErrors = jest.spyOn(component, "setInvalidSelectionsError");
            const spyFormTouched = jest.spyOn(component.form, "markAllAsTouched");
            const spyDispatch = jest.spyOn(ngrxStore, "dispatch");
            const spySaved = jest.spyOn(component.saved, "emit");
            const spyResetForm = jest.spyOn(component, "resetForm");

            component.addToRateSheet();

            expect(spySetErrors).toBeCalledTimes(1);
            expect(spyFormTouched).toBeCalledTimes(1);
            expect(spyDispatch).toBeCalledWith(
                RateSheetsActions.setRateSheetPlanSeriesSelections({
                    productId: 1,
                    planSeriesId: 1,
                    planSelections: [
                        {
                            benefitAmounts: undefined,
                            coverageLevelIds: [1],
                            eliminationPeriods: undefined,
                            planId: 1,
                            planSeriesCategory: undefined,
                            planTypes: undefined,
                            riderSelections: undefined,
                        },
                    ],
                    planSeriesCategory: undefined,
                }),
            );
            expect(spySaved).toBeCalledTimes(1);
            expect(spyResetForm).toBeCalledTimes(1);
        });
        it("should set coverageOptions errors", () => {
            component.coverageLevelOptions$ = of([
                { id: 1, name: "Test Coverage Level 1" },
                { id: 2, name: "Test Coverage Level 2" },
            ]);
            component.form.controls.coverageOptions.setValue([]);

            const spySetErrors = jest.spyOn(component.form.controls.coverageOptions, "setErrors");
            component.addToRateSheet();
            expect(spySetErrors).toBeCalledWith({ required: true });
        });
        it("should set eliminationPeriods errors", () => {
            component.eliminationOptions$ = of([
                { id: 1, name: "Test Elimination Period 1" },
                { id: 2, name: "Test Elimination Period 2" },
            ]);
            component.form.controls.eliminationPeriods.setValue([]);

            const spyElimPeriodSetErrors = jest.spyOn(component.form.controls.eliminationPeriods, "setErrors");
            const spySelectAllSetErrors = jest.spyOn(component.form.controls.selectAllEliminationPeriods, "setErrors");
            component.addToRateSheet();
            expect(spyElimPeriodSetErrors).toBeCalledWith({ required: true });
            expect(spySelectAllSetErrors).toBeCalledWith({ required: true });
        });
        it("should set benefitAmounts errors (non-STD)", () => {
            component.benefitAmountOptions$ = of([{ amount: 10000 }, { amount: 20000 }]);
            component.form.controls.benefitAmounts.setValue([]);
            component.isWholeAndTermLifeProduct$ = of(false);

            const spyBenefitAmountsSetErrors = jest.spyOn(component.form.controls.benefitAmounts, "setErrors");
            const spySelectAllSetErrors = jest.spyOn(component.form.controls.selectAllBenefitAmounts, "setErrors");
            component.addToRateSheet();
            expect(spyBenefitAmountsSetErrors).toBeCalledWith({ required: true });
            expect(spySelectAllSetErrors).toBeCalledWith({ required: true });
        });
        it("should set planTypes errors", () => {
            component.isCarrierOfADV$ = of(true);
            component.form.controls.planTypes.setValue(null);

            const spySetErrors = jest.spyOn(component.form.controls.planTypes, "setErrors");
            component.addToRateSheet();
            expect(spySetErrors).toBeCalledWith({ required: true });
        });
    });

    describe("setPlanForADV()", () => {
        it("should set ADV list of selected plans", () => {
            const mockListOfPlan = [
                {
                    id: 1,
                    name: "test",
                    adminName: "test",
                    carrierId: 1,
                    missingEmployerFlyer: false,
                    displayOrder: 1,
                    description: "test",
                    shortName: "test",
                    characteristics: [],
                },
            ];
            component.form.value.planTypes = [ADVPlanType.EMPLOYEE_PAID];
            component.planSeries = {
                id: 65,
                name: "Aflac Dental Insurance (Group) - MAC",
                code: "QN81000",
                categories: ["MAC"],
                plans: mockListOfPlan,
            };
            const spy = jest.spyOn(component, "setPlanForADV");
            component.setPlanForADV(mockListOfPlan);
            expect(spy).toReturnWith(mockListOfPlan);
        });
    });

    describe("removeDuplicatePlans()", () => {
        it("should remove duplicate plans", () => {
            expect.assertions(2);
            const planSeries = {
                id: 1,
                name: "test",
                code: "test",
                categories: ["test"],
                plans: [
                    {
                        id: 1,
                        name: "test",
                        adminName: "test",
                        carrierId: 1,
                        missingEmployerFlyer: false,
                        displayOrder: 1,
                        description: "test",
                        shortName: "test",
                    },
                    {
                        id: 1,
                        name: "test",
                        adminName: "test",
                        carrierId: 1,
                        missingEmployerFlyer: false,
                        displayOrder: 1,
                        description: "test",
                        shortName: "test",
                    },
                ],
            };
            const spy = jest.spyOn(component, "removeDuplicatePlans");
            component.removeDuplicatePlans(planSeries);
            expect(spy).toBeCalled();
            expect(spy).toHaveReturnedWith([
                {
                    id: 1,
                    name: "test",
                    adminName: "test",
                    carrierId: 1,
                    missingEmployerFlyer: false,
                    displayOrder: 1,
                    description: "test",
                    shortName: "test",
                },
            ]);
        });
    });

    describe("setInvalidSelectionsError()", () => {
        beforeEach(() => {
            component.form.controls.plans.setValue([
                { id: 1234, code: "ABC", name: "Aflac Short Term Disability 12 months" },
                { id: 1244, code: "ABC", name: "Aflac Short Term Disability 24 months" },
            ]);
            component.invalidPlanSelections = { 1234: false };
            component.requiredEliminationPeriodSelections = [];
            component.requiredBenefitAmountSelections = [];
        });

        it("should set invalidPlanSelections to true for selecting elimination periods that are not applicable to all selected plans", () => {
            component.form.controls.eliminationPeriods.setValue([{ id: 23, eliminationPeriod: "14/14", name: "14/14 days" }]);
            component.isInvalidEliminationPeriodSelection = false;
            component.setInvalidSelectionsError();
            expect(component.invalidPlanSelections[1234]).toBe(true);
            expect(component.requiredEliminationPeriodSelections).toStrictEqual([true, false]);
            expect(component.isInvalidEliminationPeriodSelection).toBe(true);
        });

        it("should set invalidPlanSelections to true for selecting benefit amount that is not applicable to all selected plans of Std products", () => {
            component.form.addControl(
                "benefitAmounts",
                new FormControl({ minBenefitAmount: { units: 6, amount: 600 }, maxBenefitAmount: "" }),
            );
            component.isInvalidBenefitAmountSelection = false;
            component.isStdProduct$ = of(true);
            component.isOtherProductSelected$ = of(false);
            component.setInvalidSelectionsError();
            expect(component.invalidPlanSelections[1234]).toBe(true);
            expect(component.isInvalidBenefitAmountSelection).toBe(true);
        });
    });

    describe("resetForm()", () => {
        it("should mark form as untouched and pristine", () => {
            component.form.markAsTouched();
            component.form.markAsDirty();
            const spyFormUntouched = jest.spyOn(component.form, "markAsUntouched");
            const spyFormPristine = jest.spyOn(component.form, "markAsPristine");
            component.resetForm();
            expect(spyFormUntouched).toBeCalledTimes(1);
            expect(spyFormPristine).toBeCalledTimes(1);
            expect(component.form.pristine).toBe(true);
            expect(component.form.untouched).toBe(true);
        });
    });

    describe("onRidersValueChange()", () => {
        it("should call checkRiderSelectionChange()", () => {
            const spy = jest.spyOn(component, "checkRiderSelectionChange");
            component.onRidersValueChange([]);
            expect(spy).toBeCalledWith([]);
        });
        it("should mark form dirty if selection has changed", () => {
            component.previouslySelectedRiders = [];
            const spy = jest.spyOn(component.form.controls.plans, "markAsDirty");
            component.onRidersValueChange([{ selected: true }]);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("checkRiderSelectionChange()", () => {
        it("should return true if no riders previously selected and riders selected", () => {
            component.previouslySelectedRiders = [];
            const spy = jest.spyOn(component, "checkRiderSelectionChange");
            component.checkRiderSelectionChange([{ selected: true }]);
            expect(spy).toReturnWith(true);
        });
        it("should return true if riders added/removed", () => {
            component.previouslySelectedRiders = [{}];
            const spy = jest.spyOn(component, "checkRiderSelectionChange");
            component.checkRiderSelectionChange([]);
            expect(spy).toReturnWith(true);
        });
        it("should return true if selectedRider contains different riders from previouslySelectedRiders", () => {
            component.previouslySelectedRiders = [{ planId: 1 }];
            const spy = jest.spyOn(component, "checkRiderSelectionChange");
            component.checkRiderSelectionChange([{ planId: 2, selected: true }]);
            expect(spy).toReturnWith(true);
        });
        it("should return false if selectedRider contains same riders from previouslySelectedRiders", () => {
            component.previouslySelectedRiders = [{ planId: 1 }];
            const spy = jest.spyOn(component, "checkRiderSelectionChange");
            component.checkRiderSelectionChange([{ planId: 1, selected: true }]);
            expect(spy).toReturnWith(false);
        });
        it("should return false for any other case", () => {
            component.previouslySelectedRiders = [];
            const spy = jest.spyOn(component, "checkRiderSelectionChange");
            component.checkRiderSelectionChange([{ selected: false }]);
            expect(spy).toReturnWith(false);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyNext = jest.spyOn(component["unsubscribe$"], "next");
            const spyComplete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyNext).toBeCalledTimes(1);
            expect(spyComplete).toBeCalledTimes(1);
        });
    });
});
