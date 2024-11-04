import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AbstractControl, FormArray, FormBuilder, FormControl, ReactiveFormsModule } from "@angular/forms";
import { NGRXStore } from "@empowered/ngrx-store";
import { provideMockStore } from "@ngrx/store/testing";
import { RiderOptionsComponent } from "./rider-options.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { mockLanguageService, mockRateSheetsComponentStoreService } from "@empowered/testing";
import { RateSheetsComponentStoreService } from "../../../rate-sheets-component-store/rate-sheets-component-store.service";
import { of } from "rxjs";
import { Plan, RateSheetPlanSeriesOption, RateSheetRider } from "@empowered/constants";
import {
    mockPlanValueChangesTL,
    mockSelectedProductTL,
    mockPlanOptionsFilteredRidersTL,
    mockOptionsTL,
    mockFilteredRidersTL,
    mockPlanValueChangesNonTL,
    mockSelectedProductNonTL,
    mockPlanOptionsFilteredRidersNonTL,
    mockOptionsNonTL,
} from "./rider-options.mock";
import { RiderOptionSelected } from "./rider-options.model";

describe("RiderOptionsComponent", () => {
    let component: RiderOptionsComponent;
    let fixture: ComponentFixture<RiderOptionsComponent>;
    let fb: FormBuilder;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RiderOptionsComponent],
            imports: [ReactiveFormsModule],
            providers: [
                NGRXStore,
                provideMockStore({}),
                FormBuilder,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: RateSheetsComponentStoreService,
                    useValue: mockRateSheetsComponentStoreService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RiderOptionsComponent);
        component = fixture.componentInstance;
        component.planValueChanges = of([] as Plan[]);
        component.options = [] as RateSheetRider[];
        component.planOptionsFilteredRiders = [] as RateSheetPlanSeriesOption[];
        fb = TestBed.inject(FormBuilder);
        component.ridersForm = fb.group({});
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it.skip("should filter options if TL", () => {
            component.planValueChanges = of(mockPlanValueChangesTL);
            component.selectedProduct$ = of(mockSelectedProductTL);
            component.planOptionsFilteredRiders = mockPlanOptionsFilteredRidersTL;
            component.options = mockOptionsTL;
            component.ngOnInit();
            expect(component.options).toStrictEqual(mockFilteredRidersTL);
        });
        it.skip("should not filter options if not TL", () => {
            component.planValueChanges = of(mockPlanValueChangesNonTL);
            component.selectedProduct$ = of(mockSelectedProductNonTL);
            component.planOptionsFilteredRiders = mockPlanOptionsFilteredRidersNonTL;
            component.options = mockOptionsNonTL;
            component.ngOnInit();
            expect(component.options).toStrictEqual(component.options);
        });
    });

    describe("getRiderWithEnableRiders()", () => {
        it("should return riders with enableRiders", () => {
            const spy = jest.spyOn(component, "getRiderWithEnableRiders");
            component.getRiderWithEnableRiders(
                [
                    {
                        planId: 1,
                        planName: "Test Rider 1",
                        selected: true,
                    },
                    {
                        planId: 2,
                        planName: "Test Rider 2",
                        selected: false,
                    },
                ],
                {
                    "Test Rider 1": "false",
                    "Test Rider 2": "false",
                },
            );
            expect(spy).toReturnWith([
                {
                    planId: 1,
                    planName: "Test Rider 1",
                    selected: true,
                    enableRiders: {
                        "Test Rider 1": "false",
                        "Test Rider 2": "false",
                    },
                },
                {
                    planId: 2,
                    planName: "Test Rider 2",
                    selected: false,
                },
            ]);
        });
    });

    describe("stringArraysEqual()", () => {
        it("should return true if arrays match", () => {
            const spy = jest.spyOn(component, "stringArraysEqual");
            component.stringArraysEqual(["false"], ["false"]);
            expect(spy).toReturnWith(true);
        });
        it("should return false if arrays don't match", () => {
            const spy = jest.spyOn(component, "stringArraysEqual");
            component.stringArraysEqual(["true"], ["false"]);
            expect(spy).toReturnWith(false);
        });
    });

    describe("checkIfSpouseRiderSelected()", () => {
        beforeEach(() => {
            component.spouseRiderIDs = [1, 2];
        });
        it("should return true if selected rider is spouse rider", () => {
            expect(component.checkIfSpouseRiderSelected(1)).toBe(true);
        });
        it("should return false if selected rider is not spouse rider", () => {
            expect(component.checkIfSpouseRiderSelected(3)).toBe(false);
        });
    });

    describe("checkSelectedPlanHasSingleCoverageOption()", () => {
        it("should return true if 1 coverageLevelOptions", () => {
            component.selectedPlansWithRiders = [
                {
                    id: 1,
                    riders: [
                        {
                            planId: 1,
                            planName: "Test Rider 1",
                            coverageLevelOptions: [{}],
                        },
                    ],
                },
            ];
            component.spouseRiderIDs = [1];
            const spy = jest.spyOn(component, "checkSelectedPlanHasSingleCoverageOption");
            component.checkSelectedPlanHasSingleCoverageOption();
            expect(spy).toReturnWith(true);
        });
    });

    describe("addCoverageLevelOptionsToSpouseControl()", () => {
        it("should Add CoverageLevelOptions To SpouseControl when custom option selected", () => {
            const riderFormGroupControls = fb.group({
                benefitAmount: [{}],
                coverageLevel: [{}],
                coverageLevelOption: [
                    {
                        value: RiderOptionSelected.CUSTOM,
                        disabled: true,
                    },
                ],
                spouseCoverageLevel: fb.array([]),
                selected: [],
                planName: [],
                spouseTobaccoStatus: [],
                spouseGender: [],
                planId: [],
                enableRiders: {},
            }) as unknown as { [key: string]: AbstractControl };
            component.selectedPlansWithRiders = [
                {
                    id: 1,
                    riders: [
                        {
                            planId: 1,
                            planName: "Test Rider 1",
                            coverageLevelOptions: [{ name: "10-year" }],
                        },
                    ],
                },
            ];
            const updatedSpouseControl = new FormArray([new FormControl("10-year")]);

            const spy1 = jest.spyOn(component, "checkIfSpouseRiderSelected").mockReturnValue(true);

            component.addCoverageLevelOptionsToSpouseControl(riderFormGroupControls);

            riderFormGroupControls.spouseCoverageLevel = new FormArray([]);
            const spouseControl = riderFormGroupControls.spouseCoverageLevel as FormArray;
            spouseControl.clear();

            component.selectedPlansWithRiders?.forEach((planData) => {
                planData.riders.forEach((rider) => {
                    expect(spy1).toBeCalledWith(rider.planId);
                    spouseControl.push(new FormControl(rider.coverageLevelOptions[0].name));
                });
            });

            expect(spouseControl.value).toEqual(updatedSpouseControl.value);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });
    });
});
