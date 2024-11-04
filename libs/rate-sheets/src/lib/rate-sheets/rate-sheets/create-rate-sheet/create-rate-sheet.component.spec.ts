import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CreateRateSheetComponent } from "./create-rate-sheet.component";
import { MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store";
import { provideMockStore } from "@ngrx/store/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { mockLanguageService, mockEmpoweredModalService, mockAflacService, mockMatDialog } from "@empowered/testing";
import { EmpoweredModalService } from "@empowered/common-services";
import { AflacService } from "@empowered/api";
import { of } from "rxjs";
import { PlanIds } from "@empowered/constants";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { DatePipe } from "@angular/common";
import { MaterialModule } from "@empowered/ui";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
    mockInitialState,
    mockCombinedQuickQuotePlansAndPlanSeries,
    mockIncludedPlanSeries,
    mockIncludedPlansIds,
    mockPlanOrder,
    mockPlanOrderMaps,
    planSelectionsAccident,
    planSelectionsHospital,
    planSelectionsJuvenileTL,
    planSelectionsSTD,
    planSelectionsTermLife,
    planSeriesOptionsAccident,
    planSeriesOptionsJuvenileTL,
    planSeriesOptionsTermLife,
} from "./create-rate-sheet.mock";

describe("CreateRateSheetComponent", () => {
    let component: CreateRateSheetComponent;
    let fixture: ComponentFixture<CreateRateSheetComponent>;

    const mockBottomSheetRef = {
        dismiss: () => {},
    } as MatBottomSheetRef<CreateRateSheetComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CreateRateSheetComponent],
            imports: [ReactiveFormsModule, MaterialModule, BrowserAnimationsModule],
            providers: [
                FormBuilder,
                NGRXStore,
                provideMockStore({ initialState: mockInitialState }),
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatBottomSheetRef,
                    useValue: mockBottomSheetRef,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: AflacService,
                    useValue: mockAflacService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                DatePipe,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CreateRateSheetComponent);
        component = fixture.componentInstance;
        component.includedPlanSeries$ = of(mockIncludedPlanSeries);
        component.combinedQuickQuotePlansAndPlanSeries$ = of(mockCombinedQuickQuotePlansAndPlanSeries);
        component.planOrder = [];
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("language strings initialized", () => {
        expect(component.languageStrings).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should call initializeForm() and fetchSelectedPlans()", () => {
            const spy1 = jest.spyOn(component, "initializeForm");
            const spy2 = jest.spyOn(component, "fetchSelectedPlans");
            component.ngOnInit();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });
    });

    describe("initializeForm()", () => {
        it("should initialize FormGroup", () => {
            component.initializeForm();
            expect(component.createRateSheetForm).toBeDefined();
        });
    });

    describe("fetchSelectedPlans()", () => {
        it("should get PlanIds in array for included plans", () => {
            component.fetchSelectedPlans();
            let includedPlanIds: PlanIds[] = [];
            component.includedPlansIds$.subscribe((planIds) => {
                includedPlanIds = [...includedPlanIds, planIds];
            });
            expect(includedPlanIds).toStrictEqual(mockIncludedPlansIds);
        });
        it("should fill planOrder array", () => {
            component.fetchSelectedPlans();
            expect(component.planOrder).toStrictEqual(mockPlanOrder);
        });
    });

    describe("editPlanOrder()", () => {
        it("should open edit-plan-order modal and reorder planOrder", () => {
            const empoweredModalService = TestBed.inject(EmpoweredModalService);
            const mockMatDialogRef = {
                afterClosed: () => of(mockPlanOrder),
            } as MatDialogRef<any>;

            const spy = jest.spyOn(empoweredModalService, "openDialog").mockReturnValue(mockMatDialogRef);
            component.editPlanOrder();
            expect(spy).toBeCalled();
            expect(component.planOrder).toStrictEqual(mockPlanOrder);
        });
    });

    describe("getPlanOrderMaps()", () => {
        it("should create order map of plans based on planSeriesId", () => {
            component.planOrder = mockPlanOrder;
            component.getPlanOrderMaps();
            expect(component.planOrderMaps).toStrictEqual(mockPlanOrderMaps);
        });
    });

    describe("getBenefitAmounts()", () => {
        it("should return empty array", () => {
            const spy = jest.spyOn(component, "getBenefitAmounts");
            component.getBenefitAmounts(planSelectionsAccident);
            expect(spy).toReturnWith([]);
        });
        it("should return benefitAmountObject (if)", () => {
            const spy = jest.spyOn(component, "getBenefitAmounts");
            component.getBenefitAmounts(planSelectionsSTD);
            expect(spy).toReturnWith([
                {
                    minBenefitAmount: {
                        units: 6,
                        amount: 600,
                    },
                    maxBenefitAmount: {
                        units: 15,
                        amount: 1500,
                    },
                },
            ]);
        });
        it("should return benefitAmountObject.benefitAmountSelected.amount (else if)", () => {
            const spy = jest.spyOn(component, "getBenefitAmounts");
            component.getBenefitAmounts(planSelectionsTermLife);
            expect(spy).toReturnWith([25000]);
        });
        it("should return benefitAmountObject.amount (else)", () => {
            const spy = jest.spyOn(component, "getBenefitAmounts");
            component.getBenefitAmounts(planSelectionsHospital);
            expect(spy).toReturnWith([500, 1000, 1500, 2000]);
        });
    });

    describe("getRiders()", () => {
        it("should return empty if no riderSelection", () => {
            const spy = jest.spyOn(component, "getRiders");
            component.getRiders(planSelectionsJuvenileTL, planSeriesOptionsJuvenileTL);
            expect(spy).toReturnWith({
                ridersChoices: [],
                spouseGender: null,
                spouseTobaccoStatus: null,
            });
        });
        it("should return ridersChoices (no spouse)", () => {
            const spy = jest.spyOn(component, "getRiders");
            component.getRiders(planSelectionsAccident, planSeriesOptionsAccident);
            expect(spy).toReturnWith({
                ridersChoices: [
                    {
                        planId: 1530,
                        benefitAmount: null,
                        coverageLevelIds: [27, 28, 29, 30],
                    },
                    {
                        planId: 1505,
                        benefitAmount: null,
                        coverageLevelIds: [298, 294, 295, 299, 300, 296, 297, 301],
                    },
                    {
                        planId: 1531,
                        benefitAmount: null,
                        coverageLevelIds: [27, 28, 29, 30],
                    },
                    {
                        planId: 1508,
                        benefitAmount: null,
                        coverageLevelIds: [298, 294, 295, 299, 300, 296, 297, 301],
                    },
                    {
                        planId: 1532,
                        benefitAmount: null,
                        coverageLevelIds: [27, 28, 29, 30],
                    },
                    {
                        planId: 1509,
                        benefitAmount: null,
                        coverageLevelIds: [298, 294, 295, 299, 300, 296, 297, 301],
                    },
                    {
                        planId: 1533,
                        benefitAmount: null,
                        coverageLevelIds: [27, 28, 29, 30],
                    },
                    {
                        planId: 1510,
                        benefitAmount: null,
                        coverageLevelIds: [298, 294, 295, 299, 300, 296, 297, 301],
                    },
                    {
                        planId: 1534,
                        benefitAmount: null,
                        coverageLevelIds: [27, 28, 29, 30],
                    },
                    {
                        planId: 1529,
                        benefitAmount: null,
                        coverageLevelIds: [298, 294, 295, 299, 300, 296, 297, 301],
                    },
                ],
                spouseGender: null,
                spouseTobaccoStatus: null,
            });
        });
        it("should return data for spouse", () => {
            const spy = jest.spyOn(component, "getRiders");
            component.getRiders(planSelectionsTermLife, planSeriesOptionsTermLife);
            expect(spy).toReturnWith({
                ridersChoices: [
                    { planId: 1312, benefitAmount: null, coverageLevelIds: [241] },
                    { planId: 1316, benefitAmount: null, coverageLevelIds: [244] },
                    { planId: 1320, benefitAmount: null, coverageLevelIds: [245] },
                    { planId: 1324, benefitAmount: null, coverageLevelIds: [246] },
                    { planId: 1311, benefitAmount: null, coverageLevelIds: [242, 241] },
                    { planId: 1315, benefitAmount: null, coverageLevelIds: [244] },
                    { planId: 1319, benefitAmount: null, coverageLevelIds: [245] },
                    { planId: 1323, benefitAmount: null, coverageLevelIds: [246] },
                    { planId: 1310, benefitAmount: null, coverageLevelIds: [241, 243] },
                    { planId: 1314, benefitAmount: null, coverageLevelIds: [244] },
                    { planId: 1318, benefitAmount: null, coverageLevelIds: [245] },
                    { planId: 1322, benefitAmount: null, coverageLevelIds: [246] },
                ],
                spouseGender: "FEMALE",
                spouseTobaccoStatus: "NONTOBACCO",
            });
        });
    });

    describe("downloadRateSheetAndClose()", () => {
        it("should call helper functions", () => {
            const spy1 = jest.spyOn(component, "getPlanOrderMaps");
            const spy2 = jest.spyOn(component, "getBenefitAmounts");
            component.downloadRateSheetAndClose();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
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
