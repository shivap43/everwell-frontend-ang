import { Component, Input, CUSTOM_ELEMENTS_SCHEMA, Directive, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { of, Subject } from "rxjs";
import { LanguageService } from "@empowered/language";
import { PlanQuasiComponent } from "./plan-quasi.component";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { ComponentType } from "@angular/cdk/portal";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DatePipe } from "@angular/common";
import { ProductsPlansQuasiService } from "../services/products-plans-quasi.service";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import {
    AccountInfoState,
    BenefitsOfferingState,
    MapPlanChoicesToNewPlanYearPanel,
    MapPlanChoicesToPlans,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { Permission, PlanChoice, TaxStatus, PolicyOwnershipType, PlanPanel, VasFunding } from "@empowered/constants";
import { mockMatDialog, mockStaticUtilService } from "@empowered/testing";
import { TruncatePipe } from "@empowered/ui";
import { StoreModule } from "@ngrx/store";

@Component({
    template: "",
    selector: "empowered-mon-spinner",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockRouteParams = new Subject<Params>();
const mockRoute = {
    snapshot: { params: mockRouteParams.asObservable() },
    parent: { parent: { parent: { parent: { params: mockRouteParams.asObservable() } } } },
};
const mockRouter = {
    url: "some route",
};

const datas = {
    opensFrom: "products",
};
@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}
@Pipe({
    name: "truncate",
})
export class mockTruncatePipe implements PipeTransform {
    transform(value: any): string {
        return `${value}`;
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

describe("PlanQuasiComponent", () => {
    let component: PlanQuasiComponent;
    let fixture: ComponentFixture<PlanQuasiComponent>;
    let store: Store;
    let productsPlanQuasiService: ProductsPlansQuasiService;
    let matDialog: MatDialog;
    let staticService: StaticUtilService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlanQuasiComponent, MockRichTooltipDirective, MockLanguageDirective, mockTruncatePipe],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: mockRoute,
                },
                RouterTestingModule,
                FormBuilder,
                DatePipe,
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: datas,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: TruncatePipe,
                    useValue: mockTruncatePipe,
                },
            ],
            imports: [
                NgxsModule.forRoot([BenefitsOfferingState, AccountInfoState]),
                HttpClientTestingModule,
                ReactiveFormsModule,
                MatTableModule,
                StoreModule.forRoot({}),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlanQuasiComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        fixture.detectChanges();
        productsPlanQuasiService = TestBed.inject(ProductsPlansQuasiService);
        matDialog = TestBed.inject(MatDialog);
        staticService = TestBed.inject(StaticUtilService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getUserPermission()", () => {
        it("should get the user Permission", () => {
            component.getUserPermission();
            expect(component.isRole20User).toBe(true);
        });
    });

    describe("checkArgusSelectedPlans()", () => {
        it("should call @method checkArgusSelectedPlans from quasiService", () => {
            component.argusDentalCarrierMaps = [];
            component.argusVisionCarrierMaps = [];
            component.situsState = "";
            component.employeesFromGroupAttribute = 0;
            component.allPlans.data = [];
            component.isRestrictedToSinglePlan = false;
            component.selectedCarriers = [];
            component.disableArgusTierPlans = { planId: { disableStatus: false } };
            component.productIdNumber = "";
            component.argusDentalTiers = {
                dentalPlansTier1All: [],
                dentalPlansTier2All: [],
                dentalPlansTier1Fl: [],
                dentalPlansTier2Fl: [],
                dentalPlansTier1PPO: [],
                dentalPlansTier1MAC: [],
                dentalPlansTier2PPO: [],
                dentalPlansTier2MAC: [],
                dentalPlansTier1PPOER: [],
                dentalPlansTier1MACER: [],
                dentalPlansTier2PPOER: [],
                dentalPlansTier2MACER: [],
                dentalPlansTier1FLPPO: [],
                dentalPlansTier1FLMAC: [],
                dentalPlansTier2FLPPO: [],
                dentalPlansTier2FLMAC: [],
                dentalPlansTier1FLPPOER: [],
                dentalPlansTier1FLMACER: [],
                dentalPlansTier2FLPPOER: [],
                dentalPlansTier2FLMACER: [],
                dentalPlansFLDHMO: [],
                visionPlansTier1EP: [],
                visionPlansTier2EP: [],
                visionPlansTier1ER: [],
                visionPlansTier2ER: [],
            };

            component.selectedPlan = {
                selected: false,
                isPlanDisabled: false,
                managePlanYear: false,
                productId: "0",
                productIdNumber: "",
                productName: "",
                planId: 0,
                planName: "",
                planChoiceId: 0,
                planYearId: 0,
                continous: false,
                enrollmentEndDate: "",
                carrierId: 0,
                carrier: "",
                riders: [],
                states: [],
                cafeteria: false,
                cafeteriaEligible: false,
                preTaxEligible: false,
                taxStatus: TaxStatus.PRETAX,
                defaultTaxStatus: TaxStatus.PRETAX,
                taxStatusReadOnly: false,
                agentAssisted: false,
                agentAssistedDisabled: false,
                vasFunding: VasFunding.HQ,
                policyOwnershipType: PolicyOwnershipType.INDIVIDUAL,
                eligibility: false,
                isRelianceStdPlan: false,
                isEmpFundedPlanDisabled: false,
                isAutoEnrollable: false,
            };
            const spy = jest.spyOn(productsPlanQuasiService, "checkArgusSelectedPlans");
            component.checkArgusSelectedPlans();
            expect(spy).toBeCalledWith(
                [],
                [],
                "",
                0,
                [],
                false,
                [],
                { planId: { disableStatus: false } },
                "",
                {
                    dentalPlansTier1All: [],
                    dentalPlansTier2All: [],
                    dentalPlansTier1Fl: [],
                    dentalPlansTier2Fl: [],
                    dentalPlansTier1PPO: [],
                    dentalPlansTier1MAC: [],
                    dentalPlansTier2PPO: [],
                    dentalPlansTier2MAC: [],
                    dentalPlansTier1PPOER: [],
                    dentalPlansTier1MACER: [],
                    dentalPlansTier2PPOER: [],
                    dentalPlansTier2MACER: [],
                    dentalPlansTier1FLPPO: [],
                    dentalPlansTier1FLMAC: [],
                    dentalPlansTier2FLPPO: [],
                    dentalPlansTier2FLMAC: [],
                    dentalPlansTier1FLPPOER: [],
                    dentalPlansTier1FLMACER: [],
                    dentalPlansTier2FLPPOER: [],
                    dentalPlansTier2FLMACER: [],
                    dentalPlansFLDHMO: [],
                    visionPlansTier1EP: [],
                    visionPlansTier2EP: [],
                    visionPlansTier1ER: [],
                    visionPlansTier2ER: [],
                },
                {
                    selected: false,
                    isPlanDisabled: false,
                    managePlanYear: false,
                    productId: "0",
                    productIdNumber: "",
                    productName: "",
                    planId: 0,
                    planName: "",
                    planChoiceId: 0,
                    planYearId: 0,
                    continous: false,
                    enrollmentEndDate: "",
                    carrierId: 0,
                    carrier: "",
                    riders: [],
                    states: [],
                    cafeteria: false,
                    cafeteriaEligible: false,
                    preTaxEligible: false,
                    taxStatus: TaxStatus.PRETAX,
                    defaultTaxStatus: TaxStatus.PRETAX,
                    taxStatusReadOnly: false,
                    agentAssisted: false,
                    agentAssistedDisabled: false,
                    vasFunding: VasFunding.HQ,
                    policyOwnershipType: PolicyOwnershipType.INDIVIDUAL,
                    eligibility: false,
                    isRelianceStdPlan: false,
                    isEmpFundedPlanDisabled: false,
                    isAutoEnrollable: false,
                },
            );
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("resetValues()", () => {
        it("should resets the values", () => {
            component.resetValues();
            expect(component.isEmpFunded).toBe(false);
            expect(component.isHQFunded).toBe(false);
            expect(component.isNoneSelected).toBe(false);
            expect(component.isReceivingHQ).toBe(true);
            expect(component.displayedPlansColumns).toStrictEqual([]);
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
    describe("getPostTaxFlagToDisable()", () => {
        it("method should return true if plans are post-tax", () => {
            component.allPlans = { data: [{ defaultTaxStatus: "POSTTAX" }] } as MatTableDataSource<any>;
            const result = component.getPostTaxFlagToDisable();
            expect(result).toEqual(true);
        });
    });
    describe("getFlagToDisable()", () => {
        it("method should return false if taxStatusReadOnly value is false", () => {
            component.allPlans = { data: [{ taxStatusReadOnly: false }] } as MatTableDataSource<any>;
            const result = component.getFlagToDisable();
            expect(result).toEqual(false);
        });
    });

    describe("agentAssistancestatus()", () => {
        it("method should return true if plans are not selected", () => {
            component.plans = [{ selected: false }];
            const result = component.agentAssistancestatus();
            expect(result).toEqual(true);
        });

        it("method should return selected plan object if plans are selected", () => {
            component.plans = [{ selected: true, agentAssisted: true }];
            const result = component.agentAssistancestatus();
            expect(result).toStrictEqual({ agentAssisted: true, selected: true });
        });
    });

    describe("initializeCarrierMaps()", () => {
        it("should set managePlanYearChoice to true if not equal to new_plan", () => {
            component.managePlanYearChoice = false;
            store.reset({
                ...store.snapshot(),
                productOffering: {
                    managePlanYearChoice: "old_plan",
                },
            });
            component.initializeCarrierMaps();
            expect(component.managePlanYearChoice).toBe(true);
        });
        it("should set managePlanYearChoice to false if equal to new_plan", () => {
            component.managePlanYearChoice = true;
            store.reset({
                ...store.snapshot(),
                productOffering: {
                    managePlanYearChoice: "new_plan",
                },
            });
            component.initializeCarrierMaps();
            expect(component.managePlanYearChoice).toBe(false);
        });
        it("should set MP group from store if MP group does not exist", () => {
            component.mpGroup = null;
            store.reset({
                ...store.snapshot(),
                productOffering: {
                    mpGroup: 12345,
                },
                accountInfo: { accountInfo: { situs: { state: { abbreviation: "GA" } } } },
            });
            component.initializeCarrierMaps();
            expect(component.mpGroup).toEqual(12345);
        });
        it("should return undefined if MP group does not exist in store", () => {
            component.mpGroup = null;
            store.reset({
                ...store.snapshot(),
                productOffering: {
                    mpGroup: undefined,
                },
            });
            expect(component.initializeCarrierMaps()).toBeUndefined();
        });
    });

    describe("generateCarrierMaps()", () => {
        it("should format and map carrier and carrier ids from carrier response", () => {
            const carriers = ["carrier:[1,2,3]"];
            const returnValue = component.generateCarrierMaps(carriers, ":");
            expect(returnValue[0]).toStrictEqual({ carrier: "carrier", ids: ["1", "2", "3"] });
        });
    });

    describe("getUserPermission()", () => {
        it("should be true if user has permission ", (done) => {
            expect.assertions(1);
            jest.spyOn(staticService, "hasPermission").mockReturnValue(of(true));
            component.getUserPermission();
            staticService.hasPermission(Permission.MANAGE_AGENT_ASSISTED).subscribe((res) => {
                expect(component.isRole20User).toEqual(true);
                done();
            });
        });
    });
    describe("checkPretaxForSelectedPlan()", () => {
        it("should return true if check-box is checked", () => {
            component.preTaxSetPerPlan = false;
            component.preTaxCheckbox = {
                checked: true,
            };
            const res = component.checkPretaxForSelectedPlan(true);
            expect(res).toEqual(true);
        });

        it("should return false if check-box is un-checked", () => {
            component.preTaxSetPerPlan = false;
            component.preTaxCheckbox = {
                checked: false,
            };
            const res = component.checkPretaxForSelectedPlan(true);
            expect(res).toEqual(false);
        });
    });

    describe("checkRSLIPlanExist()", () => {
        it("should return true if RSLI product present ", () => {
            component.allPlans = {
                data: [{ carrier: "Reliance Standard Life Insurance Company", selected: true }],
            } as MatTableDataSource<any>;
            const spy = jest.spyOn(component, "updatePlanSpecificDisclaimer");
            const result = component.checkRSLIPlanExist();
            expect(result).toEqual(true);
            expect(spy).toBeCalledTimes(1);
        });

        it("should return false if RSLI product not present ", () => {
            component.allPlans = { data: [{ carrier: "Aflac", selected: true }] } as MatTableDataSource<any>;
            const result = component.checkRSLIPlanExist();
            expect(result).toEqual(false);
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
    describe("onSubmit()", () => {
        it("should call onNext to update plan choices if wagework is not missing and there is no VAS exception", () => {
            const fromNext = false;
            const spy = jest.spyOn(component, "isWageWorksBillingMissing").mockReturnValue(false);
            const spy2 = jest.spyOn(component, "onNext").mockImplementation();
            component.isVasException = false;
            component.onSubmit(fromNext);
            expect(component.isVasMaxValid).toBe(false);
            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledWith(fromNext);
        });
        it("should add billing contact if wage work billing is missing", () => {
            const fromNext = false;
            const spy = jest.spyOn(component, "isWageWorksBillingMissing").mockReturnValue(true);
            const spy2 = jest.spyOn(component, "addBillingContact").mockImplementation();
            component.onSubmit(fromNext);
            expect(component.isVasMaxValid).toBe(false);
            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
        it("should set vas max valid to true when vas exception is there and no wage work billing", () => {
            const fromNext = false;
            component.isVasException = true;
            component.isHQFunded = true;
            component.maxPlansValue = 1;
            component.selection["selected"] = { selected: [{}, {}] };
            const spy = jest.spyOn(component, "isWageWorksBillingMissing").mockReturnValue(false);
            component.onSubmit(fromNext);
            expect(spy).toBeCalledTimes(1);
            expect(component.isVasMaxValid).toBe(true);
        });
        it("should call onNext to update plan choices", () => {
            const fromNext = false;
            component.isVasException = true;
            component.isHQFunded = true;
            component.maxPlansValue = 1;
            component.selection["selected"] = { selected: [{}] };
            const spy = jest.spyOn(component, "isWageWorksBillingMissing").mockReturnValue(false);
            const spy2 = jest.spyOn(component, "onNext").mockImplementation();
            component.onSubmit(fromNext);
            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledWith(fromNext);
            expect(component.isVasMaxValid).toBe(false);
        });
    });
    describe("validateDefaultTaxStatus()", () => {
        it("should set isPreTax to true when taxStatus is PRETAX", () => {
            component.allPlans.data = [{ taxStatus: "PRETAX" }];
            component.validateDefaultTaxStatus();
            expect(component.isPreTax).toEqual(true);
        });
        it("should set isPostTax to true when taxStatus is POSTTAX", () => {
            component.allPlans.data = [{ taxStatus: "POSTTAX" }];
            component.validateDefaultTaxStatus();
            expect(component.isPostTax).toEqual(true);
        });
        it("should set isVariable to true when taxStatus is VARIABLE", () => {
            component.allPlans.data = [{ taxStatus: "VARIABLE" }];
            component.validateDefaultTaxStatus();
            expect(component.isVariable).toEqual(true);
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
    describe("updateSelectedPlansTaxStatus()", () => {
        it("should set tax status for every selected plans", () => {
            component.allPlans.data = [{ taxStatusReadOnly: false, taxStatus: "" }];
            const taxStatus = TaxStatus.PRETAX;
            const spy = jest.spyOn(component, "validateAllPlansTaxStatus").mockReturnValue(false);
            component.updateSelectedPlansTaxStatus(taxStatus);
            expect(component.allPlans.data[0].taxStatus).toBe(taxStatus);
            expect(spy).toBeCalledTimes(1);
        });
    });
    describe("changeProduct()", () => {
        it("action should be dispatched when changeProduct method gets called and parameter passed is true", () => {
            component.isSideNavSelected = true;
            const spy = jest.spyOn(productsPlanQuasiService["changeProduct$"], "next");
            component.changeProduct(true);
            expect(spy).toBeCalledWith(true);
        });
    });
    describe("closeModal()", () => {
        it("should call closeAll method of dialog when closeModal gets called", () => {
            const spy = jest.spyOn(matDialog, "closeAll");
            component.closeModal();
            expect(spy).toBeCalled();
        });
    });
    describe("updatePlanChoicesValue()", () => {
        it("should dispatch action MapPlanChoicesToNewPlanYearPanel when planYearChoice is not null", () => {
            const spy1 = jest.spyOn(store, "dispatch");
            component.planYearChoice = true;
            const planChoiceToUpdate = [{ id: 1 }] as PlanChoice[];
            component.updatePlanChoicesValue(planChoiceToUpdate, [{ selected: true, planId: 1 }] as PlanPanel[], true);
        });
        it("should dispatch action MapPlanChoicesToPlans when planYearChoice is null", () => {
            const spy1 = jest.spyOn(store, "dispatch");
            component.planYearChoice = null;
            const planChoiceToUpdate = [{ id: 1 }] as PlanChoice[];
            component.updatePlanChoicesValue(planChoiceToUpdate, [{ selected: true, planId: 1 }] as PlanPanel[], true);
            expect(spy1).toBeCalledWith(new MapPlanChoicesToPlans(planChoiceToUpdate));
        });
    });
    describe("updateHQPlan()", () => {
        it("should update vasSelection model with currently selected HQ plan", () => {
            component.allPlans = {
                data: [
                    { planId: 1, selected: false },
                    { planId: 2, selected: false },
                ],
            } as MatTableDataSource<any>;
            const allPlansData = [
                { planId: 1, selected: false },
                { planId: 2, selected: true },
            ];
            component.updateHQPlan({ planId: 2 });
            expect(component.plans).toStrictEqual(allPlansData);
        });
    });

    describe("createOrUpdatePlanChoices()", () => {
        it("should remove id from planChoiceIdToUpdate if planId matches", () => {
            component.plansSelected = [{ planChoiceId: 1234, taxStatus: "PRETAX" }] as PlanPanel[];
            component.planChoiceIdToUpdate = [2, 3, 4, 1234] as number[];
            const spy = jest.spyOn(component, "createPlanChoice");
            const planChoice = { id: 1, planId: 1234 } as PlanChoice;
            const planChoiceMade = { planChoiceId: 1234, taxStatus: "POSTTAX" } as PlanPanel;
            const editedPlanChoices = [{ planChoiceId: 1234, taxStatus: "POSTTAX" }] as PlanPanel[];
            component.createOrUpdatePlanChoices(planChoice, planChoiceMade, editedPlanChoices);
            expect(component.planChoiceIdToUpdate).toStrictEqual([2, 3, 4]);
            expect(spy).toBeCalledWith(planChoice, editedPlanChoices);
        });
        it("should update id value in planChoiceIdToUpdate if planId doesn't matches", () => {
            component.plansSelected = [{ planChoiceId: 1234, taxStatus: "PRETAX" }] as PlanPanel[];
            component.planChoiceIdToUpdate = [2, 3, 4, 1234] as number[];
            const planChoice = { id: 1, planId: 1234 } as PlanChoice;
            const planChoiceMade = { planChoiceId: 1235, taxStatus: "POSTTAX" } as PlanPanel;
            const editedPlanChoices = [{ planChoiceId: 1234, taxStatus: "POSTTAX" }] as PlanPanel[];
            component.createOrUpdatePlanChoices(planChoice, planChoiceMade, editedPlanChoices);
            expect(component.planChoiceIdToUpdate).toStrictEqual([2, 3, 4, 1234, 1235]);
        });
        it("should call createPlanChoice method if planChoiceId is not there in planChoiceMade", () => {
            const spy = jest.spyOn(component, "createPlanChoice");
            const planChoice = { id: 1, planId: 1234 } as PlanChoice;
            const planChoiceMade = { taxStatus: "POSTTAX" } as PlanPanel;
            const editedPlanChoices = [{ planChoiceId: 1234, taxStatus: "POSTTAX" }] as PlanPanel[];
            const res = component.createOrUpdatePlanChoices(planChoice, planChoiceMade, editedPlanChoices);
            expect(spy).toBeCalledWith(planChoice, editedPlanChoices);
        });
    });

    describe("getCreatePlanChoiceObject()", () => {
        it("should return planChoice object with planYearId if continuous plans not selected", () => {
            const existingPlanChoice = {
                id: 1,
                planId: 123,
                continuous: false,
                taxStatus: "PRETAX",
                agentAssisted: true,
                planYearId: 1,
            } as PlanChoice;
            const res = component.getCreatePlanChoiceObject(existingPlanChoice);
            expect(res).toStrictEqual({
                id: 1,
                planId: 123,
                continuous: false,
                taxStatus: "PRETAX",
                agentAssisted: true,
                planYearId: 1,
            });
        });
        it("should return planChoice object with enrollmentPeriod and coverageStartFunction  if continuous plans are selected", () => {
            const existingPlanChoice = {
                id: 1,
                plan: {
                    id: 123,
                },
                continuous: true,
                taxStatus: "PRETAX",
                agentAssisted: true,
                planYearId: 1,
                enrollmentPeriod: {
                    effectiveStarting: "11/03/2022",
                    expiresAfter: "15/06/2025",
                },
                coverageStartFunction: "coverage",
            } as PlanChoice;
            const res = component.getCreatePlanChoiceObject(existingPlanChoice);
            expect(res).toStrictEqual({
                id: 1,
                planId: 123,
                continuous: true,
                taxStatus: "PRETAX",
                agentAssisted: true,
                enrollmentPeriod: {
                    effectiveStarting: "11/03/2022",
                    expiresAfter: "15/06/2025",
                },
                coverageStartFunction: "coverage",
            });
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
