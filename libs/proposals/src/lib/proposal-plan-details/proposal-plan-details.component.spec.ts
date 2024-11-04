import { ProposalPlanDetailsComponent } from "./proposal-plan-details.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { NgxsModule, Store } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { RouterTestingModule } from "@angular/router/testing";
import { Plan, PlanPanelModel, StaticUtilService } from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";
import { ProposalNoPlansSelectedComponent } from "../proposal-no-plans-selected/proposal-no-plans-selected.component";
import { EmpoweredModalService } from "@empowered/common-services";
import {
    mockMatDialog,
    mockDatePipe,
    mockStore,
    mockStaticUtilService,
    mockLanguageService,
    mockEmpoweredModalService,
    MockReplaceTagPipe,
} from "@empowered/testing";
import { CountryState, PlanChoice, PlansEligibility } from "@empowered/constants";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { MaterialModule } from "@empowered/ui";

describe("ProposalPlanDetailsComponent", () => {
    let component: ProposalPlanDetailsComponent;
    let fixture: ComponentFixture<ProposalPlanDetailsComponent>;
    let empoweredModalService: EmpoweredModalService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProposalPlanDetailsComponent, MockReplaceTagPipe],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule, RouterTestingModule, MaterialModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ProposalPlanDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        empoweredModalService = TestBed.inject(EmpoweredModalService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should initialize the form", () => {
        const form = {
            carriersFilter: "",
            ridersFilter: "",
            statesFilter: "",
            planType: "",
        };
        expect(component.form.value).toEqual(form);
    });
    describe("matSelectOpenHandler()", () => {
        it("should open filter based on isOpen value", () => {
            expect(component.filterOpen).toBe(false);
            component.matSelectOpenHandler(true);
            expect(component.filterOpen).toBe(true);
        });
    });
    describe("onInvalidTraversal()", () => {
        it("should open the dialog no plans selected", () => {
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.onInvalidTraversal();
            expect(spy).toBeCalledWith(ProposalNoPlansSelectedComponent);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("addIndividualAndGroupLinks()", () => {
        const productData = {
            product: {
                id: 1,
                name: "Sample Product",
            },
        };
        it("should have productData", () => {
            component.addIndividualAndGroupLinks(productData);
            expect(component.productList).toStrictEqual([
                {
                    id: "1i",
                    name: "Sample Product Individual",
                },
                {
                    id: "1g",
                    name: "Sample Product Group",
                },
            ]);
        });
    });
    describe("isChecked()", () => {
        beforeEach(() => {
            component.form.controls.carriersFilter.setValue("Sample Value");
            component.filtersData["carrier"] = "Sample Value";
            component.form.controls.statesFilter.setValue("Sample State Value");
            component.filtersData["states"] = "Sample State Value";
            component.form.controls.ridersFilter.setValue("Sample Rider Value");
            component.filtersData["riders"] = "Sample Rider Value";
        });
        it("should return true for filters career, states and riders()", () => {
            expect(component.isChecked("carrier")).toBeTruthy();
            expect(component.isChecked("states")).toBeTruthy();
            expect(component.isChecked("riders")).toBeTruthy();
        });
        it("should return undefined()", () => {
            expect(component.isChecked("carriers")).toBeUndefined();
        });
    });
    describe("isIndeterminate()", () => {
        beforeEach(() => {
            component.form.controls.carriersFilter.setValue("Sample Value");
            component.filtersData["carrier"] = "Sample Values";
            component.form.controls.statesFilter.setValue("Sample State Value");
            component.filtersData["states"] = "Sample State Values";
            component.form.controls.ridersFilter.setValue("Sample Rider Value");
            component.filtersData["riders"] = "Sample Rider Values";
        });
        it("should return true for all filters()", () => {
            expect(component.isIndeterminate("carrier")).toBeTruthy();
            expect(component.isIndeterminate("states")).toBeTruthy();
            expect(component.isIndeterminate("riders")).toBeTruthy();
        });
        it("should return undefined()", () => {
            expect(component.isIndeterminate("carriers")).toBeUndefined();
        });
    });

    describe("showPlanDetails()", () => {
        it("dialog open", () => {
            const data = {
                planId: 1,
                planName: "test",
                states: ["a"],
                mpGroup: 123,
            };
            const spy = jest.spyOn(component.dialog, "open");
            component.showPlanDetails(data);
            expect(spy).toBeCalled();
        });
        it("sorted states", () => {
            const data = {
                planId: 1,
                planName: "test",
                states: ["a"],
                mpGroup: 123,
            };
            component.showPlanDetails(data);
            expect(component.sortedStates).toStrictEqual(["a"]);
        });
    });

    describe("updateReceivingHQ()", () => {
        it("isReceivingHQ", () => {
            component.updateReceivingHQ();
            expect(component.isReceivingHQ).toBe(false);
        });

        it("plans form", () => {
            component.updateReceivingHQ();
            expect(component.form.contains("plans")).toBe(true);
        });
    });

    describe("loadPlansScreen()", () => {
        it("stepper service", () => {
            const next = jest.spyOn(component["stepperService"], "next");
            component.skipHQFunded = true;
            component.loadPlansScreen();
            expect(next).toBeCalledTimes(1);
        });
    });

    describe("filterBenefitOfferingStates()", () => {
        it("should call filterBenefitOfferingStates", () => {
            component.benefitOfferingStates = [
                { abbreviation: "UT", name: "Utah" },
                { abbreviation: "GA", name: "Georgia" },
            ];
            const planData = {
                plan: { id: 1, name: "plan", adminName: "admin", carrierId: 1 } as Plan,
                planChoice: { id: 1, planId: 1, taxStatus: "PRETAX", agentAssisted: true } as PlanChoice,
                states: [
                    { abbreviation: "GA", name: "Georgia" },
                    { abbreviation: "UT", name: "Utah" },
                ] as CountryState[],
                planEligibilty: {
                    planId: 1,
                    eligibility: "ELIGIBLE",
                    allowedStates: [
                        {
                            state: { abbreviation: "GA", name: "Georgia" },
                            validity: { effectiveStarting: "12/07/2022" },
                        },
                    ],
                } as PlansEligibility,
            } as PlanPanelModel;
            component.filterBenefitOfferingStates(planData);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });
});
