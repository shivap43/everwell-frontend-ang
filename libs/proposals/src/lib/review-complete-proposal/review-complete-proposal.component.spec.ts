import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { RouterTestingModule } from "@angular/router/testing";
import { BenefitsOfferingService, Carrier, Eligibility, Proposal } from "@empowered/api";
import { EmpStepperService } from "@empowered/emp-stepper";
import { LanguageService } from "@empowered/language";
import { MPGroupAccountService } from "@empowered/common-services";
import { NgxsModule, Store } from "@ngxs/store";
import { of, Subscription, throwError } from "rxjs";
import { ReviewCompleteProposalComponent } from "./review-complete-proposal.component";
import { Router } from "@angular/router";
import { mockLanguageService, mockEmpStepperService, mockMpGroupAccountService, mockDatePipe } from "@empowered/testing";
import { DatePipe } from "@angular/common";
import { MatMenuModule } from "@angular/material/menu";
import { BenefitsOfferingState, ProposalsState, StaticUtilService } from "@empowered/ngxs-store";
import { PanelModel, PlanPanelModel, PayFrequency, CountryState, PlanYear, TaxStatus } from "@empowered/constants";
import { MatTableModule } from "@angular/material/table";

@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any): string {
        return "replaced";
    }
}

describe("ReviewCompleteProposalComponent", () => {
    let component: ReviewCompleteProposalComponent;
    let fixture: ComponentFixture<ReviewCompleteProposalComponent>;
    let benefitsOfferingService: BenefitsOfferingService;
    let stepperService: EmpStepperService;
    let router: Router;
    let store: Store;
    let stateForNgxsStore: Store;
    let staticUtilService: StaticUtilService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                RouterTestingModule,
                NgxsModule.forRoot([BenefitsOfferingState, ProposalsState]),
                MatMenuModule,
                MatTableModule,
            ],
            declarations: [ReviewCompleteProposalComponent, MockReplaceTagPipe],
            providers: [
                FormBuilder,
                Store,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: EmpStepperService,
                    useValue: mockEmpStepperService,
                },
                {
                    provide: MPGroupAccountService,
                    useValue: mockMpGroupAccountService,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                BenefitsOfferingService,
                StaticUtilService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ReviewCompleteProposalComponent);
        component = fixture.componentInstance;
        benefitsOfferingService = TestBed.inject(BenefitsOfferingService);
        stepperService = TestBed.inject(EmpStepperService);
        router = TestBed.inject(Router);
        store = TestBed.inject(Store);
        stateForNgxsStore = {
            ...store.snapshot(),
            productOffering: {
                benefitOferingStates: [
                    {
                        name: "Georgia",
                        abbreviation: "GA",
                    },
                ] as CountryState[],
                panelProducts: [
                    {
                        productChoice: {
                            id: 1,
                        },
                        product: {
                            valueAddedService: false,
                        },
                    },
                ] as PanelModel[],
            },
            proposals: {
                proposals: [
                    {
                        name: "proposal1",
                    },
                ] as Proposal[],
            },
        };
        store.reset(stateForNgxsStore);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("arrangeData()", () => {
        it("should call methods on getPlanYears response ", () => {
            component.mpGroup = 123;
            const spy1 = jest.spyOn(benefitsOfferingService, "getPlanYears").mockReturnValue(
                of([
                    {
                        id: 1,
                        name: "PY1",
                    } as PlanYear,
                ]),
            );
            const spy2 = jest.spyOn(component, "getValuesFromStore");
            const spy3 = jest.spyOn(component, "setCensusEstimate");
            const spy4 = jest.spyOn(component, "setProductInformation");
            component.arrangeData();
            expect(spy1).toBeCalledWith(123, true);
            expect(spy2).toBeCalledTimes(1);
            expect(spy3).toBeCalledTimes(1);
            expect(spy4).toBeCalledTimes(1);
        });
        it("should set errorMessage on getPlanYears() error response", () => {
            component.mpGroup = 123;
            jest.spyOn(benefitsOfferingService, "getPlanYears").mockReturnValue(
                throwError({
                    error: { message: "api error message" },
                }),
            );
            component.arrangeData();
            expect(component.errorMessage).toContain("primary.portal.benefitsOffering.reviewSubmit.unableToLoadPlan");
            expect(component.errorResponse).toBe(true);
        });
    });
    describe("displayValues()", () => {
        it("should set displayValue data when states are less than 5", () => {
            component.statesList = [{ abbreviation: "GA" }, { abbreviation: "PR" }, { abbreviation: "NY" }];
            const values = [{ abbreviation: "GA" }, { abbreviation: "PR" }] as CountryState[];
            jest.spyOn(router, "url", "get").mockReturnValue("proposals");
            const displayValue = component.displayValues(values);
            expect(displayValue).toStrictEqual("GA, PR");
        });
        it("should set displayValue as states length with language value when states are greater than 5", () => {
            component.statesList = [
                { abbreviation: "GA" },
                { abbreviation: "PR" },
                { abbreviation: "NY" },
                { abbreviation: "NJ" },
                { abbreviation: "ME" },
                { abbreviation: "AL" },
            ];
            const values = [
                { abbreviation: "GA" },
                { abbreviation: "PR" },
                { abbreviation: "NY" },
                { abbreviation: "NJ" },
                { abbreviation: "ME" },
                { abbreviation: "AL" },
            ] as CountryState[];
            jest.spyOn(router, "url", "get").mockReturnValue("proposals");
            const displayValue = component.displayValues(values);
            expect(displayValue).toStrictEqual("6primary.portal.proposals.reviewComplete.states");
        });
    });
    describe("setSpecificPlans()", () => {
        it("should set plansPanelList", () => {
            const carrierSpecificPRPlans = [{ plan: { id: 1 } }] as PlanPanelModel[];
            const specificCarrier = { id: 1 } as Carrier;
            const productPannelItem = { product: { name: "Term Life" } } as PanelModel;
            component.setSpecificPlans(carrierSpecificPRPlans, specificCarrier, productPannelItem);
            expect(component.plansPanelList).toContainEqual({
                carrier: { id: 1 },
                plans: [{ plan: { id: 1 } }],
                product: { name: "Term Life" },
            });
        });
    });
    describe("stepChangeOnEdit()", () => {
        it("should return step change object", () => {
            const stepChange = component.stepChangeOnEdit(1);
            expect(stepChange).toStrictEqual({
                step: 1,
                state: "edit",
            });
        });
    });

    describe("setCensusEstimate()", () => {
        it("should Set census estimate", () => {
            const mockProposals = [
                {
                    id: 1,
                    eligibleEmployeeEstimate: 20,
                },
            ] as Proposal[];
            component.proposalId = 1;
            const spy = jest.spyOn(store, "selectSnapshot").mockReturnValue(mockProposals);
            component.setCensusEstimate();
            expect(spy).toBeCalledWith(ProposalsState.proposals);
            expect(component.censusEstimate).toStrictEqual(20);
        });
    });

    describe("getDeductionFrequencyName()", () => {
        it("should set deduction frequency for displaying on review complete page", () => {
            const mockDeductionFrequency = [
                {
                    id: 1,
                    name: "Bi-Weekly",
                },
            ] as PayFrequency[];
            component.payrollFrequencyId = 1;
            const spy = jest.spyOn(store, "selectSnapshot").mockReturnValue(mockDeductionFrequency);
            component.getDeductionFrequencyName();
            expect(spy).toBeCalledWith(ProposalsState.getDeductionFrequencies);
            expect(component.getDeductionFrequencyName()).toStrictEqual("Bi-Weekly");
        });
    });

    describe("editSettings()", () => {
        it("should edit settings redirects to settings step", () => {
            const spy = jest.spyOn(stepperService, "previousStep");
            component.editSettings();
            expect(spy).toBeCalledWith(0);
        });
    });

    describe("editProducts()", () => {
        it("should Edit products redirects to products step", () => {
            const spy = jest.spyOn(stepperService, "previousStep");
            component.editProducts();
            expect(spy).toBeCalledWith(1);
        });
    });

    describe("editPlans()", () => {
        it("should Edit plans redirects to plans step", () => {
            const spy = jest.spyOn(stepperService, "previousStep");
            component.editPlans();
            expect(spy).toBeCalledWith(2);
        });
    });
    describe("beforeunloadHandler()", () => {
        it("should check whether tab closes or reloads", () => {
            const event = new Event("click");
            const spy = jest.spyOn(event, "preventDefault");
            const spy1 = jest.spyOn(event, "stopPropagation");
            component.beforeunloadHandler(event);
            expect(spy).toHaveBeenCalled();
            expect(spy1).toHaveBeenCalled();
            expect(component.beforeunloadHandler(event)).toBe(false);
        });
    });
    describe("getValuesFromStore", () => {
        const mockStates = [
            {
                abbreviation: "CA",
                name: "California",
            },
        ] as CountryState[];
        it("should get state list from store", () => {
            const spy = jest.spyOn(store, "selectSnapshot").mockReturnValueOnce(mockStates);
            component.getValuesFromStore();
            expect(spy).toBeCalledWith(BenefitsOfferingState.getBenefitOfferingStates);
            expect(component.statesList).toEqual(mockStates);
        });
        it("should set state name if component.state is null", () => {
            component.state = "";
            jest.spyOn(store, "selectSnapshot").mockReturnValueOnce(mockStates);
            component.getValuesFromStore();
            expect(component.state).toEqual("California");
        });
        it("should combine state names if component.state is not null", () => {
            component.state = "SampleState";
            jest.spyOn(store, "selectSnapshot").mockReturnValueOnce(mockStates);
            component.getValuesFromStore();
            expect(component.state).toEqual("SampleState, California");
        });
    });

    describe("missing flyer feature config", () => {
        beforeEach(() => {
            staticUtilService = TestBed.inject(StaticUtilService);
        });
        it("should be enabled", (done) => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
            fixture.detectChanges();
            component.missingFlyerFeatureEnable$.subscribe((res) => {
                expect(spy).toBeCalledWith("general.feature.enable.display_flyer_missing_message");
                expect(res).toBe(true);
                done();
            });
        });

        it("should be disabled", (done) => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(false));
            fixture.detectChanges();
            component.missingFlyerFeatureEnable$.subscribe((res) => {
                expect(spy).toBeCalledWith("general.feature.enable.display_flyer_missing_message");
                expect(res).toBe(false);
                done();
            });
        });

        it("should not be called", () => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(false));
            expect(spy).toBeCalledTimes(0);
        });
    });

    describe("missing flyer names", () => {
        it("plan name should be added", () => {
            const spy = jest.spyOn(component["missingFlyerPlanNames$"], "next");
            component.setSpecificPlans(
                [
                    {
                        plan: {
                            missingEmployerFlyer: true,
                            id: 0,
                            name: "",
                            adminName: "",
                            carrierId: 0,
                            displayOrder: 0,
                            description: "",
                        },
                        planChoice: {
                            id: 0,
                            planId: 0,
                            taxStatus: TaxStatus.PRETAX,
                            agentAssisted: false,
                        },
                        states: [],
                        planEligibilty: {
                            planId: 0,
                            eligibility: Eligibility.ELIGIBLE,
                            allowedStates: [],
                        },
                    },
                ],
                {
                    id: 0,
                    name: "",
                    nameOverride: "",
                    commissionSplitEligible: false,
                },
                {
                    product: {
                        missingEmployerFlyer: true,
                        id: 0,
                        name: "",
                        code: "",
                    },
                    carrier: [],
                    individualEligibility: false,
                    groupEligibility: false,
                },
            );
            expect(spy).toBeCalledTimes(1);
        });
        it("plan name should not be added", () => {
            const spy = jest.spyOn(component["missingFlyerPlanNames$"], "next");
            component.setSpecificPlans(
                [
                    {
                        plan: {
                            missingEmployerFlyer: false,
                            id: 0,
                            name: "",
                            adminName: "",
                            carrierId: 0,
                            displayOrder: 0,
                            description: "",
                        },
                        planChoice: {
                            id: 0,
                            planId: 0,
                            taxStatus: TaxStatus.PRETAX,
                            agentAssisted: false,
                        },
                        states: [],
                        planEligibilty: {
                            planId: 0,
                            eligibility: Eligibility.ELIGIBLE,
                            allowedStates: [],
                        },
                    },
                ],
                {
                    id: 0,
                    name: "",
                    nameOverride: "",
                    commissionSplitEligible: false,
                },
                {
                    product: {
                        missingEmployerFlyer: false,
                        id: 0,
                        name: "",
                        code: "",
                    },
                    carrier: [],
                    individualEligibility: false,
                    groupEligibility: false,
                },
            );
            expect(spy).toBeCalledTimes(0);
        });
        it("plan name should be set properly", () => {
            const spy = jest.spyOn(component["missingFlyerPlanNames$"], "next");
            component.setSpecificPlans(
                [
                    {
                        plan: {
                            missingEmployerFlyer: true,
                            id: 0,
                            name: "",
                            adminName: "Plan Name Test",
                            carrierId: 0,
                            displayOrder: 0,
                            description: "",
                        },
                        planChoice: {
                            id: 0,
                            planId: 0,
                            taxStatus: TaxStatus.PRETAX,
                            agentAssisted: false,
                        },
                        states: [],
                        planEligibilty: {
                            planId: 0,
                            eligibility: Eligibility.ELIGIBLE,
                            allowedStates: [],
                        },
                    },
                ],
                {
                    id: 0,
                    name: "",
                    nameOverride: "",
                    commissionSplitEligible: false,
                },
                {
                    product: {
                        missingEmployerFlyer: true,
                        id: 0,
                        name: "",
                        code: "",
                    },
                    carrier: [],
                    individualEligibility: false,
                    groupEligibility: false,
                },
            );
            expect(spy).toBeCalledWith(["Plan Name Test"]);
        });
    });

    describe("ngOnDestroy", () => {
        it("should unsubscribe from all subscriptions", () => {
            const spy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [of(null).subscribe()];
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalled();
        });
    });
});
