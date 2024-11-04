import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { EmployeeMinimunPopupComponent } from "./employee-minimun-popup.component";
import { CountryState, Plan, PlanChoice, PlansEligibility } from "@empowered/constants";
import { mockLanguageService } from "@empowered/testing";

const plans = {
    ineligiblePlans: [],
    eligibleEmployeeInformation: "",
    recentEstimate: 1,
};

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<any>;
describe("EmployeeMinimunPopupComponent", () => {
    let component: EmployeeMinimunPopupComponent;
    let fixture: ComponentFixture<EmployeeMinimunPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EmployeeMinimunPopupComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: plans,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EmployeeMinimunPopupComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should check length of plansDisableMessage if ineligiblePlans.length > 1", () => {
            component.plans.ineligiblePlans = [
                {
                    plan: {
                        id: 1, // (global plan Id)
                        name: "plan",
                        adminName: "admin",
                        carrierId: 1,
                    } as Plan,
                    planChoice: {
                        id: 1,
                        planId: 1,
                        taxStatus: "PRETAX",
                        agentAssisted: true,
                    } as PlanChoice,
                    states: [
                        {
                            abbreviation: "GA",
                            name: "Georgia",
                        },
                    ] as CountryState[],
                    planEligibilty: {
                        planId: 1,
                        eligibility: "ELIGIBLE",
                        allowedStates: [
                            {
                                state: {
                                    abbreviation: "GA",
                                    name: "Georgia",
                                },
                                validity: { effectiveStarting: "12/07/2022" },
                            },
                        ],
                    } as PlansEligibility,
                },
                {
                    plan: {
                        id: 2, // (global plan Id)
                        name: "plans",
                        adminName: "admins",
                        carrierId: 1,
                    } as Plan,
                    planChoice: {
                        id: 2,
                        planId: 2,
                        taxStatus: "PRETAX",
                        agentAssisted: true,
                    } as PlanChoice,
                    states: [
                        {
                            abbreviation: "GA",
                            name: "Georgia",
                        },
                    ] as CountryState[],
                    planEligibilty: {
                        planId: 2,
                        eligibility: "ELIGIBLE",
                        allowedStates: [
                            {
                                state: {
                                    abbreviation: "GA",
                                    name: "Georgia",
                                },
                                validity: { effectiveStarting: "12/07/2022" },
                            },
                        ],
                    } as PlansEligibility,
                },
            ];
            component.ngOnInit();
            expect(component.planDisableMessage).toHaveLength(65);
        });

        it("should check length of plansDisableMessage if ineligiblePlans.length <= 1", () => {
            component.plans.ineligiblePlans = [];
            component.ngOnInit();
            expect(component.planDisableMessage).toHaveLength(60);
        });
    });

    describe("cancelUpdate()", () => {
        it("should close the dialog on click of cancel", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.cancelUpdate();
            expect(spy1).toBeCalledWith("cancel");
        });
    });

    describe("onGotIt()", () => {
        it("should close the dialog on click of got it", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onGotIt();
            expect(spy1).toBeCalledWith(true);
        });
    });

    describe("onBack()", () => {
        it("should close the dialog on click of back", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onBack();
            expect(spy1).toBeCalledWith(false);
        });
    });
});
