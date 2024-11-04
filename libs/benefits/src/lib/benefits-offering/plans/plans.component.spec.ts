import { DatePipe } from "@angular/common";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { AccountContacts, AccountService, BenefitsOfferingService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { PlansComponent } from "./plans.component";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, Pipe, PipeTransform } from "@angular/core";
import { Store } from "@ngxs/store";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import {
    mockAccountService,
    mockBenefitOfferingHelperService,
    mockLanguageService,
    mockProductsPlansQuasiService,
    mockSideNavService,
    mockStaticUtilService,
    mockUtilService,
    mockBenefitsOfferingService,
    mockDatePipe,
    mockMatDialog,
    mockRouter,
    mockStore,
    mockEmpoweredModalService,
    mockActivatedRoute,
} from "@empowered/testing";
import { SideNavService, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { EmpoweredModalService } from "@empowered/common-services";
import { ArgusADVTiers, PlanPanel, TaxStatus } from "@empowered/constants";
import { of } from "rxjs";
import { ProductsPlansQuasiService } from "../../maintenance-benefits-offering/products-plans-quasi";
import { BenefitOfferingHelperService } from "../../benefit-offering-helper.service";
import { TruncatePipe } from "@empowered/ui";

@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

@Pipe({
    name: "[truncate]",
})
class MockTruncatePipe implements PipeTransform {
    transform(value: any): string {
        return `$${value}`;
    }
}

@Directive({
    selector: "[language]",
})
class MockLanguageDirective {
    @Input() language!: string;

    transform(value: any): string {
        return value;
    }
}

describe("PlansComponent", () => {
    let component: PlansComponent;
    let fixture: ComponentFixture<PlansComponent>;
    let mockDialog: MatDialog;
    let accountService: AccountService;
    let quasiService: ProductsPlansQuasiService;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlansComponent, MockRichTooltipDirective, TruncatePipe, MockLanguageDirective],
            imports: [ReactiveFormsModule, MatTableModule],
            providers: [
                FormBuilder,
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: BenefitsOfferingService,
                    useValue: mockBenefitsOfferingService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: ProductsPlansQuasiService,
                    useValue: mockProductsPlansQuasiService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: BenefitOfferingHelperService,
                    useValue: mockBenefitOfferingHelperService,
                },
                {
                    provide: SideNavService,
                    useValue: mockSideNavService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlansComponent);
        component = fixture.componentInstance;
        mockDialog = TestBed.inject(MatDialog);
        accountService = TestBed.inject(AccountService);
        quasiService = TestBed.inject(ProductsPlansQuasiService);
        store = TestBed.inject(Store);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("agentAssistancestatus", () => {
        it("method should return true if plans are not selected", () => {
            component.plans = [
                {
                    selected: false,
                    agentAssisted: false,
                },
                {
                    selected: false,
                    agentAssisted: true,
                },
            ];
            const result = component.agentAssistancestatus();
            expect(result).toBe(true);
        });

        it("method should return plans object if plans are selected and agentAssisted required", () => {
            component.plans = [
                {
                    selected: true,
                    agentAssisted: false,
                },
                {
                    selected: true,
                    agentAssisted: true,
                },
            ];
            const result = component.agentAssistancestatus();
            expect(result).toStrictEqual({ agentAssisted: true, selected: true });
        });
    });

    describe("togglePretaxCafeteria", () => {
        it("assitancePerCarrier variable  should be true if parameter is agentAssisted  ", () => {
            component.fromAssistanceRequired = "agentAssisted";
            component.togglePretaxCafeteria("agentAssisted");
            expect(component.assitancePerCarrier).toBe(true);
        });

        it(" preTaxSetPerPlan variable should be true if parameter is not agentAssisted", () => {
            component.fromAssistanceRequired = "agentAssisted";
            component.togglePretaxCafeteria("preTax");
            expect(component.preTaxSetPerPlan).toBe(true);
            expect(component.displayedPlansColumns).toStrictEqual([
                "selected",
                "carrier",
                "planName",
                "riders",
                "states",
                "preTax",
                "postTax",
                "both",
            ]);
        });
    });

    describe("closeModal()", () => {
        it("should close the modal", () => {
            component.isNextClicked = false;
            const spy = jest.spyOn(mockDialog, "closeAll");
            component.closeModal();
            expect(component.isNextClicked).toBeFalsy();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("getArgusEligibleEmployeeCount()", () => {
        beforeEach(() => {
            component.argusDentalCarrierMaps = [];
            component.argusVisionCarrierMaps = [];
            component.situsState = "GA";
            component.employeesFromGroupAttribute = 342;
            component.allPlans.data = [];
            component.isRestrictedToSinglePlan = true;
            component.selectedCarriers = [];
            component.disableArgusTierPlans = { planId: { disableStatus: true } };
            component.productIdNumber = "34";
            component.argusDentalTiers = {} as ArgusADVTiers;
            component.selectedPlan = {} as PlanPanel;
        });
        it("should get eligible employee count for benefit_eligible_emp_count attribute", () => {
            jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(
                of([{ id: 12, attribute: "benefit_eligible_emp_count", value: "12" }]),
            );
            jest.spyOn(quasiService, "checkArgusSelectedPlans");
            component.mpGroup = 234;
            component.getArgusEligibleEmployeeCount();
            expect(component.employeesFromGroupAttribute).toStrictEqual(12);
        });

        it("should get eligible employee count for group_emp_count attribute ", () => {
            jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(
                of([{ id: 12, attribute: "group_emp_count", value: "1" }]),
            );
            jest.spyOn(quasiService, "checkArgusSelectedPlans");
            component.mpGroup = 234;
            component.getArgusEligibleEmployeeCount();
            expect(component.employeesFromGroupAttribute).toStrictEqual(1);
        });
    });

    describe("updateSelection()", () => {
        it("should update the plansList if plans are selected", () => {
            component.allPlans = { data: [{ planId: 1, selected: true }] } as MatTableDataSource<any>;
            component.plansList = [{ planId: 1 }] as PlanPanel[];
            component.updateSelection();
            expect(component.plansList[0].selected).toEqual(true);
        });
    });

    describe("getRestrictedStatesPlan()", () => {
        it("should check restricted states plan available or not", () => {
            jest.spyOn(quasiService, "getRestrictedPlans").mockReturnValue(true);
            component.plans = [
                {
                    agentAssisted: true,
                },
            ];
            component.restrictedStatesList = ["GA", "CA"];
            component.isRole20User = true;
            component.getRestrictedStatesPlan();
            expect(component.isAgentAssistance).toBe(true);
        });
    });

    describe("getFlagToDisable()", () => {
        it("should return false if taxStatusReadOnly value is false", () => {
            component.allPlans = { data: [{ taxStatusReadOnly: false }] } as MatTableDataSource<any>;
            const result = component.getFlagToDisable();
            expect(result).toEqual(false);
        });
    });

    describe("checkPretaxForSelectedPlan()", () => {
        it("should return true if pretax checkbox is selected", () => {
            component.preTaxSetPerPlan = false;
            component.preTaxCheckbox = {
                checked: true,
            };
            const result = component.checkPretaxForSelectedPlan(true);
            expect(result).toStrictEqual(true);
        });

        it("should return false if pretax checkbox is not selected", () => {
            component.preTaxSetPerPlan = true;
            component.preTaxCheckbox = {
                checked: true,
            };
            const result = component.checkPretaxForSelectedPlan(true);
            expect(result).toStrictEqual(false);
        });
    });

    describe("onSubmit()", () => {
        beforeEach(() => {
            component.isVasMaxValid = false;
            component.isPLHSOProductSelectedError = false;
        });
        it("should call addBillingContact method if wagework plans are selected", () => {
            const spy = jest.spyOn(component, "addBillingContact");
            component.allPlans = { data: [{ carrierId: 52, selected: true }] } as MatTableDataSource<any>;
            component.contactInfoBilling = [] as AccountContacts[];
            component.onSubmit(true);
            expect(spy).toBeCalledTimes(1);
        });

        it("should call onNext method if maxPlansValue greater than or equal to selectedPlans", () => {
            const spy = jest.spyOn(component, "onNext");
            component.allPlans = { data: [{ carrierId: 1, selected: true }] } as MatTableDataSource<any>;
            component.contactInfoBilling = [] as AccountContacts[];
            component.isVasException = true;
            component.isHQFunded = true;
            component.maxPlansValue = 2;
            component.selection["selected"] = {
                selected: [
                    { selected: true, planId: 14 },
                    { selected: true, planId: 75 },
                ],
            };
            component.onSubmit(true);
            expect(spy).toBeCalledWith(true);
        });

        it("isVasMaxValid value should be true if maxPlansValue less than selectedPlans", () => {
            const spy = jest.spyOn(component, "onNext");
            component.allPlans = { data: [{ carrierId: 1, selected: true }] } as MatTableDataSource<any>;
            component.contactInfoBilling = [] as AccountContacts[];
            component.isVasException = true;
            component.isHQFunded = true;
            component.maxPlansValue = 1;
            component.selection["selected"] = {
                selected: [
                    { selected: true, planId: 14 },
                    { selected: true, planId: 75 },
                ],
            };
            component.onSubmit(true);
            expect(component.isVasMaxValid).toStrictEqual(true);
        });

        it("should call onNext method if plans are not HQFunded and VasException", () => {
            const spy = jest.spyOn(component, "onNext");
            component.allPlans = { data: [{ carrierId: 1, selected: true }] } as MatTableDataSource<any>;
            component.contactInfoBilling = [] as AccountContacts[];
            component.isVasException = false;
            component.isHQFunded = true;
            component.maxPlansValue = 2;
            component.onSubmit(true);
            expect(spy).toBeCalledWith(true);
        });

        it("should push previous selected carrierId to a new array", () => {
            component.selectedCarriers = [16, 60];
            component.onSubmit(true);
            const actualValue = component.selectedCarrierArr;
            expect(actualValue).toContain(16);
        });
    });

    describe("validateAllPlansTaxStatus()", () => {
        it("should return true if all the plans have the tax status as input param tax status", () => {
            component.allPlans.data = [{ taxStatus: "POSTTAX" }];
            expect(component.validateAllPlansTaxStatus(TaxStatus.POSTTAX)).toBeTruthy();
        });
        it("should return false if all the plans have tax status is not equal to input param tax status", () => {
            component.allPlans.data = [{ taxStatus: "POSTTAX" }, { taxStatus: "PRETAX" }];
            expect(component.validateAllPlansTaxStatus(TaxStatus.PRETAX)).toBeFalsy();
        });
    });

    describe("getPostTaxFlagToDisable()", () => {
        it("should return true if plans are post-tax", () => {
            component.allPlans = { data: [{ defaultTaxStatus: "POSTTAX" }] } as MatTableDataSource<any>;
            const result = component.getPostTaxFlagToDisable();
            expect(result).toEqual(true);
        });
    });

    describe("agentAssistancestatus()", () => {
        it("should return true if plans are not selected", () => {
            component.plans = [{ selected: false }];
            const result = component.agentAssistancestatus();
            expect(result).toEqual(true);
        });

        it("should return selected plan object if plans are selected", () => {
            component.plans = [{ selected: true, agentAssisted: true }];
            const result = component.agentAssistancestatus();
            expect(result).toStrictEqual({ agentAssisted: true, selected: true });
        });
    });

    describe("matSelectOpenHandler()", () => {
        it("should set true value to filterOpen when method is called", () => {
            component.matSelectOpenHandler(true);
            expect(component.filterOpen).toEqual(true);
        });
    });

    describe("updateReceivingHQ()", () => {
        it("should updated plans object if plans not selected", () => {
            component.isReceivingHQ = true;
            component.plans = [
                {
                    agentAssisted: false,
                },
            ];
            component.updateReceivingHQ();
            expect(component.isReceivingHQ).toEqual(false);
            expect(component.plans).toStrictEqual([
                {
                    selected: false,
                    agentAssisted: false,
                },
            ]);
        });
    });

    describe("checkForCarrierPlans()", () => {
        it("should return carrierIds if productId matches ", () => {
            component.selectedCarriers = [];
            component.productIdNumber = "45";
            component.carrierChoice = { carrierId: 12, productId: "45", carrierName: "aflac", productName: "Accident" };
            component.checkForCarrierPlans("aflac", [12, 45, 34]);
            expect(component.selectedCarriers).toStrictEqual([12, 45, 34]);
        });

        it("should update restrictedCarriers variable if carrierId matches", () => {
            component.plansToCompare = [{ carrierId: 1 }];
            component.restrictedCarriers = [];
            component.carrierChoice = { carrierId: 1, productId: "45", carrierName: "aflac", productName: "Accident" };
            component.checkForCarrierPlans("aflac", [1, 45, 34]);
            expect(component.restrictedCarriers).toStrictEqual([
                { carrierIds: [1, 45, 34], disabled: false, selected: false, text: "aflac" },
            ]);
        });
    });

    describe("deselectPlans", () => {
        it("should deselect all plans", () => {
            component.allPlans = {
                data: [
                    { planId: 1, selected: true },
                    { planId: 2, selected: true },
                ],
            } as MatTableDataSource<any>;
            const spy = jest.spyOn(component, "checkRSLIPlanExist").mockReturnValue(false);
            component.deselectPlans();
            component.allPlans.data.forEach((data) => {
                expect(data.selected).toBe(false);
            });
            expect(spy).toBeCalledTimes(1);
            expect(component.showDisclaimerForRSLICarrier).toBe(false);
            expect(component.isSelected).toBe(false);
        });
    });

    describe("updatePlanSpecificDisclaimer()", () => {
        const visionDisclaimer = "vision disclaimer";
        const dentalDisclaimer = "dental disclaimer";
        const BasicLTDDisclaimer = "Basic Life LTD disclaimer";
        it("should return vision disclaimer for vision plans", () => {
            component.secondaryLanguages["secondary.portal.benefitsOffering.reliancePlansVisionDisclaimer"] = visionDisclaimer;
            component.allPlans.data = [{ productName: "Vision" }];
            expect(component.updatePlanSpecificDisclaimer()).toBe(visionDisclaimer);
        });
        it("should return vision disclaimer for dental plans", () => {
            component.secondaryLanguages["secondary.portal.benefitsOffering.reliancePlansDentalDisclaimer"] = dentalDisclaimer;
            component.allPlans.data = [{ productName: "Dental" }];
            expect(component.updatePlanSpecificDisclaimer()).toBe(dentalDisclaimer);
        });
        it("should return vision disclaimer for LTD plans", () => {
            component.secondaryLanguages["secondary.portal.benefitsOffering.reliancePlansBasicLTDDisclaimer"] = BasicLTDDisclaimer;
            component.allPlans.data = [{ productName: "Long-Term Disability" }];
            expect(component.updatePlanSpecificDisclaimer()).toBe(BasicLTDDisclaimer);
        });
        it("should return vision disclaimer for Basic plans", () => {
            component.secondaryLanguages["secondary.portal.benefitsOffering.reliancePlansBasicLTDDisclaimer"] = BasicLTDDisclaimer;
            component.allPlans.data = [{ productName: "Basic Life" }];
            expect(component.updatePlanSpecificDisclaimer()).toBe(BasicLTDDisclaimer);
        });
    });

    describe("isMinAflacProductSelection", () => {
        it("should show default error message", () => {
            component.isEmpFunded = true;
            component.productsSelected.length = 0;
            component.minimumAflacToSelect = 1;
            component.isMinAflacProductSelection();
            expect(component.errorMessage).toBe(component.langStrings["primary.portal.benefitsOffering.productVas"]);
        });
    });

    describe("resetValues", () => {
        it("should set isEmpFunded to false", () => {
            component.resetValues("45");
            expect(component.isEmpFunded).toBe(false);
        });
    });

    describe("getPlansData()", () => {
        it("should update plansList with plans for selected products", () => {
            const spy = jest.spyOn(store, "selectSnapshot").mockReturnValue([
                {
                    product: {
                        id: 23,
                        name: "Cancer",
                    },
                    carrier: [
                        {
                            id: 1,
                            name: "Aflac",
                        },
                    ],
                    individualEligibility: true,
                    groupEligibility: false,
                    productChoice: null,
                    plans: [],
                },
                {
                    product: {
                        id: 1,
                        name: "Accident",
                    },
                    carrier: [
                        {
                            id: 1,
                            name: "Aflac",
                        },
                    ],
                    individualEligibility: true,
                    groupEligibility: false,
                    productChoice: {
                        id: 1,
                        individual: true,
                        group: undefined,
                    },
                    plans: [
                        {
                            plan: {
                                adminName: "Aflac Accident Advantage | 24-Hour Accident-Only Insurance | Option 1",
                                agentAssisted: true,
                                agentAssistedDisabled: false,
                                cafeteriaEligible: false,
                                carrierId: 1,
                                carrierNameOverride: "Aflac",
                                characteristics: [],
                                dependentPlanIds: [1530, 1505],
                                description: "Aflac Accident Advantage | 24-Hour coverage",
                                displayOrder: 8,
                                enrollable: true,
                                id: 1463,
                                missingEmployerFlyer: false,
                                mutuallyExclusivePlanIds: [],
                                name: "Aflac Accident Advantage | 24-Hour Accident-Only Insurance | Option 1",
                                planEligibility: {
                                    planId: 1463,
                                    eligibility: "ELIGIBLE",
                                    allowedStates: [],
                                },
                                planSeriesId: 2,
                                policyOwnershipType: "INDIVIDUAL",
                                policySeries: "A36100",
                                pricingEditable: false,
                                pricingModel: "UNIVERSAL",
                                productId: 1,
                                rider: false,
                                riders: [{ name: "Additional Accidental-Death Benefit Rider" }, { name: "Aflac Plus Rider" }],
                                shortName: "Option 1",
                                taxStatus: "PRETAX",
                                taxStatusReadOnly: false,
                            },
                            planChoice: {
                                agentAssisted: true,
                                continuous: false,
                                id: 6,
                                plan: {},
                                requiredSetup: ["ENROLLMENT", "CARRIER_APPROVAL", "NOT_SUBMITTED"],
                                taxStatus: "PRETAX",
                            },
                            states: [],
                            planEligibilty: {
                                allowedStates: [],
                                eligibility: "ELIGIBLE",
                                planId: 1463,
                            },
                        },
                        {
                            plan: {
                                adminName: "Aflac Accident Advantage | 24-Hour Accident-Only Insurance | Option 2",
                                agentAssisted: true,
                                agentAssistedDisabled: false,
                                cafeteriaEligible: false,
                                carrierId: 1,
                                carrierNameOverride: "Aflac",
                                characteristics: [],
                                dependentPlanIds: [1531, 1508],
                                description: "Aflac Accident Advantage | 24-Hour coverage",
                                displayOrder: 8,
                                enrollable: true,
                                id: 1464,
                                missingEmployerFlyer: false,
                                mutuallyExclusivePlanIds: [],
                                name: "Aflac Accident Advantage | 24-Hour Accident-Only Insurance | Option 2",
                                planEligibility: {
                                    planId: 1464,
                                    eligibility: "ELIGIBLE",
                                    allowedStates: [],
                                },
                                planSeriesId: 2,
                                policyOwnershipType: "INDIVIDUAL",
                                policySeries: "A36200",
                                pricingEditable: false,
                                pricingModel: "UNIVERSAL",
                                productId: 1,
                                rider: false,
                                riders: [{ name: "Additional Accidental-Death Benefit Rider" }, { name: "Aflac Plus Rider" }],
                                shortName: "Option 2",
                                taxStatus: "PRETAX",
                                taxStatusReadOnly: false,
                            },
                            planChoice: null,
                            states: [],
                            planEligibilty: {
                                allowedStates: [],
                                eligibility: "ELIGIBLE",
                                planId: 1464,
                            },
                        },
                    ],
                },
            ]);
            component.getPlansData();
            expect(spy).toBeCalled();
            expect(component.plansList).toStrictEqual([
                {
                    agentAssisted: true,
                    agentAssistedDisabled: false,
                    cafeteria: undefined,
                    cafeteriaEligible: false,
                    carrier: "Aflac",
                    carrierId: 1,
                    continous: false,
                    defaultTaxStatus: "PRETAX",
                    eligibility: true,
                    enrollmentEndDate: null,
                    isAutoEnrollable: false,
                    planChoiceId: 6,
                    planId: 1463,
                    planName: "Aflac Accident Advantage | 24-Hour Accident-Only Insurance | Option 1",
                    policyOwnershipType: "INDIVIDUAL",
                    preTaxEligible: true,
                    productId: 1,
                    productIdNumber: "1",
                    productName: "Accident",
                    riders: [{ name: "Additional Accidental-Death Benefit Rider" }, { name: "Aflac Plus Rider" }],
                    selected: true,
                    states: [],
                    taxStatus: "PRETAX",
                    taxStatusReadOnly: false,
                    vasFunding: undefined,
                },
                {
                    agentAssisted: true,
                    agentAssistedDisabled: false,
                    cafeteria: false,
                    cafeteriaEligible: false,
                    carrier: "Aflac",
                    carrierId: 1,
                    continous: null,
                    defaultTaxStatus: "PRETAX",
                    eligibility: true,
                    enrollmentEndDate: null,
                    isAutoEnrollable: false,
                    planChoiceId: null,
                    planId: 1464,
                    planName: "Aflac Accident Advantage | 24-Hour Accident-Only Insurance | Option 2",
                    policyOwnershipType: "INDIVIDUAL",
                    preTaxEligible: true,
                    productId: 1,
                    productIdNumber: "1",
                    productName: "Accident",
                    riders: [{ name: "Additional Accidental-Death Benefit Rider" }, { name: "Aflac Plus Rider" }],
                    selected: false,
                    states: [],
                    taxStatus: "PRETAX",
                    taxStatusReadOnly: false,
                    vasFunding: undefined,
                },
            ]);
        });
    });

    describe("getCarrierIds", () => {
        it("should return carriers id", () => {
            component.carrierMaps = [
                {
                    carrier: "DELTA_DENTAL_CARRIER_ID",
                    ids: [5, 17, 20],
                },
                {
                    carrier: "ADV_CARRIER_ID",
                    ids: [70],
                },
            ];
            const actualValue = component.getCarrierIds("ADV_CARRIER_ID");
            expect(actualValue).toStrictEqual([70]);
        });
    });

    describe("deselectAdvPlans()", () => {
        it("should not run getCarrierIds if 'None' is selected", () => {
            component.isNoneSelected = true;
            const getADVId = component.getCarrierIds("ADV");
            component.deselectAdvPlans();
            expect(getADVId).toBe(undefined);
        });

        it("should deselect the ADV plan if ADV carrier is not selected", () => {
            component.isNoneSelected = false;
            component.selectedCarriers.length = 1;
            const spy = jest.spyOn(component, "getCarrierIds").mockReturnValue([70]);
            component.selectedCarrierArr = [16, 5];
            component.selectedCarriers = [16];
            component.plansList = [{ planId: 1, selected: true, carrierId: 70 }] as PlanPanel[];
            component.deselectAdvPlans();
            const selectedPlansArr = component.plansList.filter((plan) => plan.selected);
            expect(selectedPlansArr).toEqual([]);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

            fixture.destroy();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
