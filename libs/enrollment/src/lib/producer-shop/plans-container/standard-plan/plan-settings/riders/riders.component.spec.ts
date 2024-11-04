import { Component, Directive, forwardRef, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
    ControlValueAccessor,
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule,
    Validators,
} from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { provideMockStore } from "@ngrx/store/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { Observable, of, Subscription } from "rxjs";
import { RidersComponent } from "./riders.component";
import { ProducerShopComponentStoreService } from "../../../../services/producer-shop-component-store/producer-shop-component-store.service";
import { RiderComponentStoreService } from "../../../../services/rider-component-store/rider-component-store.service";
import { RiderState, RiderStateValidationOptions } from "../../../../services/rider-state/rider-state.model";
import { getMockRiderFormGroup, getMockRiderState, MOCK_PLAN_PANEL } from "./riders.component.mock";
import { RiderFormArray } from "./riders.model";
import {
    CoverageLevel,
    Plan,
    PlanOffering,
    EnrollmentRider,
    PlanOfferingPricing,
    SettingsDropdownName,
    PlanOfferingWithCartAndEnrollment,
    TaxStatus,
} from "@empowered/constants";
import { DropDownPortalComponent, SettingsDropdownComponentStore } from "@empowered/ui";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MockCurrencyPipe, mockPlanPanelService } from "@empowered/testing";
import { PlanPanelService } from "../../../../services/plan-panel/plan-panel.service";
import { PlanOfferingService } from "../../../../services/plan-offering/plan-offering.service";
import { CurrencyPipe } from "@angular/common";

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) => ({}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

@Component({
    selector: "mat-checkbox",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatCheckboxComponent),
            multi: true,
        },
    ],
})
class MockMatCheckboxComponent implements ControlValueAccessor {
    @Input() value!: string;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Component({
    selector: "mat-select",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatSelectComponent),
            multi: true,
        },
    ],
})
class MockMatSelectComponent implements ControlValueAccessor {
    @Input() value!: string;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Component({
    selector: "mat-form-field",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatFormFieldComponent),
            multi: true,
        },
    ],
})
class MockMatFormFieldComponent implements ControlValueAccessor {
    @Input() value!: string;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Component({
    selector: "mat-option",
    template: "",
})
class MockMatOptionComponent {
    @Input() value!: string;
}

@Component({
    selector: "mat-spinner",
    template: "",
})
class MockMatSpinnerComponent {}

const mockSettingsDropdownStore = {
    selectActiveDropdown: () => of(),
    selectFooter: () => of(),
    setActiveDropdown: (observableOrValue: SettingsDropdownName) => ({} as Subscription),
    showResetButtonOnDirty: (form: FormGroup, onRevert$: Observable<void>, onReset$: Observable<void>, onApply$: Observable<void>) =>
        of(true),
} as SettingsDropdownComponentStore;

const mockPlanOfferingService = {
    getPlanId: (planOffering: PlanOffering) => 10,
};
@Directive({
    selector: "[language]",
})
class MockLanguageDirective {
    @Input() language!: string;

    transform(value: any): string {
        return value;
    }
}

describe("RidersComponent", () => {
    let component: RidersComponent;
    let fixture: ComponentFixture<RidersComponent>;
    let riderComponentStoreService: RiderComponentStoreService;
    let planPanelService: PlanPanelService;
    const portalRef = {
        hide: () => {},
    } as DropDownPortalComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                RidersComponent,
                MockMatCheckboxComponent,
                MockMatSelectComponent,
                MockMatOptionComponent,
                MockMatFormFieldComponent,
                MockMatSpinnerComponent,
                MockLanguageDirective,
            ],
            providers: [
                NGRXStore,
                provideMockStore({}),
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: SettingsDropdownComponentStore, useValue: mockSettingsDropdownStore },
                FormBuilder,
                ProducerShopComponentStoreService,
                RiderComponentStoreService,
                {
                    provide: PlanPanelService,
                    useValue: mockPlanPanelService,
                },
                {
                    provide: PlanOfferingService,
                    useValue: mockPlanOfferingService,
                },
                {
                    provide: CurrencyPipe,
                    useValue: MockCurrencyPipe,
                },
            ],
            imports: [ReactiveFormsModule, HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RidersComponent);
        component = fixture.componentInstance;
        component.portalRef = portalRef;
        component.planPanel = MOCK_PLAN_PANEL;
        riderComponentStoreService = TestBed.inject(RiderComponentStoreService);
        planPanelService = TestBed.inject(PlanPanelService);
        jest.spyOn(planPanelService, "getPanelIdentifiers").mockReturnValue({
            planOfferingId: 1,
            cartId: 2,
            enrollmentId: 3,
        });
        jest.spyOn(planPanelService, "getPlanOffering").mockReturnValue({
            id: 1,
            plan: {
                id: 12,
                name: "some plan",
                adminName: "admin name",
                carrierId: 1,
                missingEmployerFlyer: true,
                displayOrder: 15,
                description: "some description",
            },
            taxStatus: TaxStatus.PRETAX,
            agentAssistanceRequired: false,
        });
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("setMatCheckboxState()", () => {
        it("should set RiderFormGroup based on RiderState", () => {
            const mockRiderState = getMockRiderState(true);
            const mockRiderFormGroup = getMockRiderFormGroup(false);

            component.setMatCheckboxState(mockRiderFormGroup, mockRiderState);

            expect(mockRiderFormGroup.controls.riderPlanName.value).toBe(true);
        });

        it("should enable riderPlanNameControl if RiderState is enabled", () => {
            const mockRiderState = getMockRiderState(true);
            mockRiderState.disabled = false;
            mockRiderState.riderHasPrice = true;
            const mockRiderFormGroup = getMockRiderFormGroup(false);
            mockRiderFormGroup.controls.riderPlanName.disable();

            component.setMatCheckboxState(mockRiderFormGroup, mockRiderState);

            expect(mockRiderFormGroup.controls.riderPlanName.enabled).toBe(true);
            expect(mockRiderFormGroup.controls.riderPlanName.disabled).toBe(false);
        });

        it("should disabled riderPlanNameControl if RiderState is disabledd", () => {
            const mockRiderState = getMockRiderState(true);
            mockRiderState.disabled = true;

            const mockRiderFormGroup = getMockRiderFormGroup(false);
            mockRiderFormGroup.controls.riderPlanName.enable();

            component.setMatCheckboxState(mockRiderFormGroup, mockRiderState);

            expect(mockRiderFormGroup.controls.riderPlanName.enabled).toBe(false);
            expect(mockRiderFormGroup.controls.riderPlanName.disabled).toBe(true);
        });
    });

    describe("updateMatSelectStates()", () => {
        it("should enable mat-select FormControls if riderNameControl has value", () => {
            const mockRiderFormGroup = getMockRiderFormGroup(true);
            mockRiderFormGroup.controls.coverageLevelName.disable();
            mockRiderFormGroup.controls.eliminationPeriodName.disable();
            mockRiderFormGroup.controls.benefitAmount.disable();

            component.updateMatSelectStates(mockRiderFormGroup);

            expect(mockRiderFormGroup.controls.coverageLevelName.enabled).toBe(true);
            expect(mockRiderFormGroup.controls.coverageLevelName.disabled).toBe(false);
            expect(mockRiderFormGroup.controls.eliminationPeriodName.enabled).toBe(true);
            expect(mockRiderFormGroup.controls.eliminationPeriodName.disabled).toBe(false);
            expect(mockRiderFormGroup.controls.benefitAmount.enabled).toBe(true);
            expect(mockRiderFormGroup.controls.benefitAmount.disabled).toBe(false);
        });

        it("should disable mat-select FormControls if riderNameControl has NO value", () => {
            const mockRiderFormGroup = getMockRiderFormGroup(false);
            mockRiderFormGroup.controls.coverageLevelName.enable();
            mockRiderFormGroup.controls.eliminationPeriodName.enable();
            mockRiderFormGroup.controls.benefitAmount.enable();

            component.updateMatSelectStates(mockRiderFormGroup);

            expect(mockRiderFormGroup.controls.coverageLevelName.enabled).toBe(false);
            expect(mockRiderFormGroup.controls.coverageLevelName.disabled).toBe(true);
            expect(mockRiderFormGroup.controls.eliminationPeriodName.enabled).toBe(false);
            expect(mockRiderFormGroup.controls.eliminationPeriodName.disabled).toBe(true);
            expect(mockRiderFormGroup.controls.benefitAmount.enabled).toBe(false);
            expect(mockRiderFormGroup.controls.benefitAmount.disabled).toBe(true);
        });
    });

    describe("updateFormUsingRiderStates()", () => {
        it("should set each riderPlanName FormControl using RiderState and update its selects", () => {
            const mockRiderFormGroup1 = getMockRiderFormGroup(true);
            const mockRiderFormGroup2 = getMockRiderFormGroup(false);

            const mockRiderState1 = getMockRiderState(false);
            const mockRiderState2 = getMockRiderState(true);

            const mockRiderStates = [getMockRiderState(false), getMockRiderState(true)];

            component.riderFormArray.push(mockRiderFormGroup1);
            component.riderFormArray.push(mockRiderFormGroup2);

            const spy = jest.spyOn(component, "setMatCheckboxState");
            const spy2 = jest.spyOn(component, "updateMatSelectStates");

            component.updateFormUsingRiderStates(mockRiderStates);

            expect(spy).toHaveBeenNthCalledWith(1, mockRiderFormGroup1, mockRiderState1);
            expect(spy).toHaveBeenNthCalledWith(2, mockRiderFormGroup2, mockRiderState2);

            expect(spy2).toHaveBeenNthCalledWith(1, mockRiderFormGroup1);
            expect(spy2).toHaveBeenNthCalledWith(2, mockRiderFormGroup2);
        });
    });

    describe("setFormArrayValues()", () => {
        it("should set RiderFormArray based on RiderStates", () => {
            const mockRiderFormArray = new FormArray([]) as RiderFormArray;
            const expectedRiderFormArray = new FormArray([
                getMockRiderFormGroup(true),
                getMockRiderFormGroup(false),
                getMockRiderFormGroup(true),
            ]) as RiderFormArray;

            component.setFormArrayValues(mockRiderFormArray, [getMockRiderState(true), getMockRiderState(false), getMockRiderState(true)]);

            expect(mockRiderFormArray.controls[0].controls.riderPlanName.value).toBe(
                expectedRiderFormArray.controls[0].controls.riderPlanName.value,
            );

            expect(mockRiderFormArray.controls[1].controls.riderPlanName.value).toBe(
                expectedRiderFormArray.controls[1].controls.riderPlanName.value,
            );

            expect(mockRiderFormArray.controls[2].controls.riderPlanName.value).toBe(
                expectedRiderFormArray.controls[2].controls.riderPlanName.value,
            );
        });
    });

    describe("getFilteredBenefitAmounts()", () => {
        it("should return empty array if there are no pricings with coverage level id", () => {
            expect(component.getFilteredBenefitAmounts([{}] as PlanOfferingPricing[])).toStrictEqual([]);
        });

        it("should exclude pricings that don't have a benefit amount", () => {
            expect(
                component.getFilteredBenefitAmounts([
                    { benefitAmount: 5, coverageLevelId: 2 },
                    { benefitAmount: 3, coverageLevelId: 2 },
                    { coverageLevelId: 2 },
                ] as PlanOfferingPricing[]),
            ).toStrictEqual([3, 5]);
        });

        it("should exclude pricings that don't have matching coverage level id", () => {
            expect(
                component.getFilteredBenefitAmounts([
                    { benefitAmount: 5, coverageLevelId: 2 },
                    { benefitAmount: 3, coverageLevelId: 999 },
                    { benefitAmount: 1, coverageLevelId: 2 },
                ] as PlanOfferingPricing[]),
            ).toStrictEqual([1, 5]);
        });

        it("should return empty array if length of filtered benefit amounts is less than minimum required options", () => {
            expect(component.getFilteredBenefitAmounts([{ benefitAmount: 5, coverageLevelId: 2 }] as PlanOfferingPricing[])).toStrictEqual(
                [],
            );
        });

        it("should get filtered benefit amounts in sorted order", () => {
            expect(
                component.getFilteredBenefitAmounts([
                    { benefitAmount: 5, coverageLevelId: 2 },
                    { benefitAmount: 3, coverageLevelId: 2 },
                    { benefitAmount: 1, coverageLevelId: 2 },
                ] as PlanOfferingPricing[]),
            ).toStrictEqual([1, 3, 5]);
        });
    });

    describe("getBaseBenefitAmountForEnrollmentRiders()", () => {
        it("should return benefitAmount of EnrollmentRider if parent of Rider and have matching policySeries", () => {
            expect(
                component.getBaseBenefitAmountForEnrollmentRiders(
                    [
                        {
                            plan: {
                                id: 222,
                                policySeries: "some policy series",
                            },
                            benefitAmount: 555,
                        },
                    ] as EnrollmentRider[],
                    {
                        parentPlanId: 222,
                        plan: {
                            policySeries: "some policy series",
                        },
                    } as PlanOffering,
                ),
            ).toBe(555);
        });

        it("should return null if EnrollmentRider if NOT parent of Rider", () => {
            expect(
                component.getBaseBenefitAmountForEnrollmentRiders(
                    [
                        {
                            plan: {
                                id: 111,
                                policySeries: "some policy series",
                            },
                            benefitAmount: 555,
                        },
                    ] as EnrollmentRider[],
                    {
                        parentPlanId: 222,
                        plan: {
                            policySeries: "some policy series",
                        },
                    } as PlanOffering,
                ),
            ).toBe(null);
        });

        it("should return null if EnrollmentRider if mismatched policySeries", () => {
            expect(
                component.getBaseBenefitAmountForEnrollmentRiders(
                    [
                        {
                            plan: {
                                id: 222,
                                policySeries: "some policy series",
                            },
                            benefitAmount: 555,
                        },
                    ] as EnrollmentRider[],
                    {
                        parentPlanId: 222,
                        plan: {
                            policySeries: "some other policy series",
                        },
                    } as PlanOffering,
                ),
            ).toBe(null);
        });
    });

    describe("getMatSelectNames()", () => {
        it("should return empty array if values length is less than required number of options", () => {
            expect(component.getMatSelectNames([{ name: "some name" }])).toStrictEqual([]);
        });

        it("should return array of value names", () => {
            expect(component.getMatSelectNames([{ name: "some name" }, { name: "some name 2" }])).toStrictEqual([
                "some name",
                "some name 2",
            ]);
        });
    });

    describe("riderFormArraysMatch()", () => {
        it("should return false if both FormArrays have different length", () => {
            const a = new FormArray([getMockRiderFormGroup(true)]) as RiderFormArray;
            const b = new FormArray([getMockRiderFormGroup(true), getMockRiderFormGroup(true)]) as RiderFormArray;

            expect(component.riderFormArraysMatch(a, b)).toBe(false);
        });

        it("should return there is a mismatch riderPlanName value", () => {
            const a = new FormArray([getMockRiderFormGroup(false)]) as RiderFormArray;
            const b = new FormArray([getMockRiderFormGroup(true)]) as RiderFormArray;

            expect(component.riderFormArraysMatch(a, b)).toBe(false);
        });

        it("should return there is a mismatch coverageLevelName value", () => {
            const a = new FormArray([getMockRiderFormGroup(true)]) as RiderFormArray;
            a.controls[0].controls.coverageLevelName.setValue("a");
            const b = new FormArray([getMockRiderFormGroup(true)]) as RiderFormArray;
            b.controls[0].controls.coverageLevelName.setValue("b");

            expect(component.riderFormArraysMatch(a, b)).toBe(false);
        });

        it("should return there is a mismatch eliminationPeriodName value", () => {
            const a = new FormArray([getMockRiderFormGroup(true)]) as RiderFormArray;
            a.controls[0].controls.eliminationPeriodName.setValue("a");
            const b = new FormArray([getMockRiderFormGroup(true)]) as RiderFormArray;
            b.controls[0].controls.eliminationPeriodName.setValue("b");

            expect(component.riderFormArraysMatch(a, b)).toBe(false);
        });

        it("should return there is a mismatch benefitAmount value", () => {
            const a = new FormArray([getMockRiderFormGroup(true)]) as RiderFormArray;
            a.controls[0].controls.benefitAmount.setValue(1);
            const b = new FormArray([getMockRiderFormGroup(true)]) as RiderFormArray;
            b.controls[0].controls.benefitAmount.setValue(2);

            expect(component.riderFormArraysMatch(a, b)).toBe(false);
        });

        it("should return true if all FormControl values of each FormGroup match", () => {
            const a = new FormArray([getMockRiderFormGroup(true)]) as RiderFormArray;
            const b = new FormArray([getMockRiderFormGroup(true)]) as RiderFormArray;

            expect(component.riderFormArraysMatch(a, b)).toBe(true);
        });
    });

    describe("allRiderPlanNamesAreUnchecked()", () => {
        it("should return true if all Rider FormGroup's riderPlanName FormControls are unchecked", () => {
            component.riderFormArray.push(getMockRiderFormGroup(false));
            component.riderFormArray.push(getMockRiderFormGroup(false));

            const mockRiderStates = [getMockRiderState(false), getMockRiderState(false)] as RiderState[];

            expect(component.riderFormArray.controls[0].controls.riderPlanName.value).toBe(false);
            expect(component.riderFormArray.controls[1].controls.riderPlanName.value).toBe(false);
            expect(component.allRiderPlanNamesAreUnchecked(mockRiderStates)).toBe(true);
        });

        it("should return false if some Rider FormGroup's riderPlanName FormControls is checked", () => {
            component.riderFormArray.push(getMockRiderFormGroup(false));
            component.riderFormArray.push(getMockRiderFormGroup(true));

            const mockRiderStates = [getMockRiderState(false), getMockRiderState(true)] as RiderState[];

            expect(component.riderFormArray.controls[0].controls.riderPlanName.value).toBe(false);
            expect(component.riderFormArray.controls[1].controls.riderPlanName.value).toBe(true);
            expect(component.allRiderPlanNamesAreUnchecked(mockRiderStates)).toBe(false);
        });
    });

    describe("resetRidersFormArray()", () => {
        it("should uncheck all rider FormGroup's FormControls", () => {
            const spy = jest.spyOn(component, "setFormArrayValues");

            const mockRiderState = getMockRiderState(true);

            const mockRiderStates: RiderState[] = [mockRiderState];

            const mockRiderFormGroup = getMockRiderFormGroup(true);

            component.riderFormArray.push(mockRiderFormGroup);

            expect(component.riderFormArray.controls[0].controls.riderPlanName.value).toBe(true);
            component.resetRidersFormArray(mockRiderStates);
            expect(spy).toBeCalledWith(component.riderFormArray, [{ ...mockRiderState, checked: false }]);
            expect(component.riderFormArray.controls[0].controls.riderPlanName.value).toBe(false);
        });

        it("should mark form as pristine", () => {
            const spy = jest.spyOn(component.form, "markAsPristine");
            component.resetRidersFormArray([]);
            expect(spy).toBeCalled();
        });
    });

    describe("submitForm()", () => {
        it("should mark form as touched", () => {
            const spy = jest.spyOn(component.form, "markAllAsTouched");
            component.submitForm([], {} as RiderStateValidationOptions);
            expect(spy).toBeCalled();
        });

        it("should not update RiderComponentStoreService if form is NOT valid", () => {
            const spy = jest.spyOn(riderComponentStoreService, "upsertRiderStates");
            // Make riderFormArray invalid by including a FormControl that is required but has no value
            component.riderFormArray.push(new FormGroup({ test: new FormControl("", Validators.required) }));
            expect(component.form.valid).toBe(false);
            component.submitForm([], {} as RiderStateValidationOptions);
            expect(spy).not.toBeCalled();
        });

        it("should update RiderComponentStoreService if form is valid", () => {
            const spy = jest.spyOn(riderComponentStoreService, "upsertRiderStates");

            const mockRiderStates = [{ riderPlanName: "some plan name" }] as RiderState[];
            const mockOptions = { memberHasSpouse: true } as RiderStateValidationOptions;

            expect(component.form.valid).toBe(true);
            component.submitForm(mockRiderStates, mockOptions);

            expect(spy).toBeCalledWith({
                memberHasSpouse: true,
                riderStates: [{ riderPlanName: "some plan name" }],
            });
        });

        it("should close portal if form is valid", () => {
            const spy = jest.spyOn(component.portalRef, "hide");
            expect(component.form.valid).toBe(true);
            component.submitForm([], {} as RiderStateValidationOptions);
            expect(spy).toBeCalled();
        });
    });

    describe("onShow()", () => {
        it("should emit onShow", () => {
            const spy = jest.spyOn(component["onShow$"], "next");
            component.onShow();
            expect(spy).toBeCalled();
        });
    });

    describe("trackByRiderOption()", () => {
        it("should return the option value for tracking", () => {
            expect(component.trackByRiderOption(1, "value")).toBe("value");
        });
    });

    describe("getFilteredRiderCoverageLevels()", () => {
        let isSupplementaryPlan;
        let coverageLevels;
        let enrollmentRidersOfAdditionalUnitParentPlan;
        let planOfferingRider;

        beforeEach(() => {
            isSupplementaryPlan = false;
            coverageLevels = [
                {
                    id: 1,
                    retainCoverageLevel: true,
                } as CoverageLevel,
                { id: 2, retainCoverageLevel: false } as CoverageLevel,
            ];

            enrollmentRidersOfAdditionalUnitParentPlan = {
                id: 1,
                plan: { policySeries: "A57653" } as Plan,
            } as EnrollmentRider;

            planOfferingRider = {
                id: 111,
                plan: { policySeries: "A57653" } as Plan,
            } as PlanOffering;
        });

        it("should return same coverage levels when current plan is not supplementary", () => {
            expect(component.getFilteredRiderCoverageLevels(isSupplementaryPlan, coverageLevels, planOfferingRider)).toBe(coverageLevels);
        });

        it("should return retain rider coverage levels when same rider is enrolled in base plan", () => {
            isSupplementaryPlan = true;
            expect(
                component.getFilteredRiderCoverageLevels(isSupplementaryPlan, coverageLevels, planOfferingRider, [
                    enrollmentRidersOfAdditionalUnitParentPlan,
                ]),
            ).toStrictEqual([
                {
                    id: 1,
                    retainCoverageLevel: true,
                } as CoverageLevel,
            ]);
        });

        it("should remove retain rider coverage levels when same rider is not enrolled in base plan", () => {
            isSupplementaryPlan = true;
            enrollmentRidersOfAdditionalUnitParentPlan.plan.policySeries = "A57651";
            expect(
                component.getFilteredRiderCoverageLevels(isSupplementaryPlan, coverageLevels, planOfferingRider, [
                    enrollmentRidersOfAdditionalUnitParentPlan,
                ]),
            ).toStrictEqual([
                {
                    id: 2,
                    retainCoverageLevel: false,
                } as CoverageLevel,
            ]);
        });
    });

    describe("filterRiderFromCartData()", () => {
        it("should remove off the job rider from cart data when all the units are consumed and there is no benefit amount", () => {
            const planOfferingCartItemRiders = [
                {
                    baseRiderId: 7028,
                    cartItemId: 43,
                    coverageLevelId: 365,
                    lastAnsweredId: 299858,
                    memberCost: 0,
                    planId: 10990,
                    planOfferingId: 8,
                    status: "IN_PROGRESS",
                    totalCost: 0,
                },
                {
                    baseRiderId: 7030,
                    benefitAmount: 600,
                    cartItemId: 44,
                    coverageLevelId: 309,
                    lastAnsweredId: 299859,
                    memberCost: 3.96,
                    planId: 10996,
                    planOfferingId: 9,
                    status: "IN_PROGRESS",
                    totalCost: 3.96,
                },
            ];
            const offTheJobAURiderPlanIds = [10990, 10989];
            const offTheJobAURiderCoverageLevelIds = [365, 366, 367, 368];

            expect(
                component.filterRiderFromCartData(planOfferingCartItemRiders, offTheJobAURiderPlanIds, offTheJobAURiderCoverageLevelIds),
            ).toStrictEqual([
                {
                    baseRiderId: 7030,
                    benefitAmount: 600,
                    cartItemId: 44,
                    coverageLevelId: 309,
                    lastAnsweredId: 299859,
                    memberCost: 3.96,
                    planId: 10996,
                    planOfferingId: 9,
                    status: "IN_PROGRESS",
                    totalCost: 3.96,
                },
            ]);
        });
    });

    describe("onApply()", () => {
        it("should emit onApply", () => {
            const spy = jest.spyOn(component["onApply$"], "next");
            component.onApply();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onRevert()", () => {
        it("should emit onRevert", () => {
            const spy = jest.spyOn(component["onRevert$"], "next");
            component.onRevert();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onReset()", () => {
        it("should emit onReset", () => {
            const spy = jest.spyOn(component["onReset$"], "next");
            component.onReset();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onHide()", () => {
        it("should revert Form", () => {
            const spy = jest.spyOn(component, "onRevert");
            component.onHide();
            expect(spy).toBeCalled();
        });
    });
});
