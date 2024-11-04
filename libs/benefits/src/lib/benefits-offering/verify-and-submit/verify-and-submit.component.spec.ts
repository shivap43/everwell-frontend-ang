import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LanguageService } from "@empowered/language";
import { NgxsModule } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { DatePipe } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { VerifyAndSubmitComponent } from "./verify-and-submit.component";
import { MatDialog } from "@angular/material/dialog";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatMenuModule } from "@angular/material/menu";
import { OfferingSteps, SideNavService } from "@empowered/ngxs-store";
import { MockReplaceTagPipe, mockSideNavService } from "@empowered/testing";
import { Subject } from "rxjs";
import { AgRefreshService } from "@empowered/ui";
import { HttpErrorResponse } from "@angular/common/http";
import { MatTableModule } from "@angular/material/table";
import {
    AllowedState,
    Carrier,
    CountryState,
    EnrollmentPeriod,
    PanelModel,
    Plan,
    PlanChoice,
    PlanPanelModel,
    PlanYear,
    PlanYearType,
    PolicyOwnershipType,
    TaxStatus,
} from "@empowered/constants";
import { StoreModule } from "@ngrx/store";

@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

@Directive({
    selector: "[configEnabled]",
})
class MockConfigEnableDirective {
    @Input("configEnabled") configKey: string;
}

describe("VerifyAndSubmitComponent", () => {
    let component: VerifyAndSubmitComponent;
    let fixture: ComponentFixture<VerifyAndSubmitComponent>;
    let agRefreshService: AgRefreshService;
    let languageService: LanguageService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VerifyAndSubmitComponent, MockReplaceTagPipe, MockRichTooltipDirective, MockConfigEnableDirective],
            providers: [
                LanguageService,
                DatePipe,
                {
                    provide: MatDialog,
                    useValue: {},
                },
                {
                    provide: MatBottomSheet,
                    useValue: {},
                },
                {
                    provide: SideNavService,
                    useValue: mockSideNavService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            imports: [
                NgxsModule.forRoot(),
                HttpClientTestingModule,
                MatTableModule,
                RouterTestingModule,
                ReactiveFormsModule,
                MatMenuModule,
                StoreModule.forRoot({}),
            ],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(VerifyAndSubmitComponent);
        component = fixture.componentInstance;
        agRefreshService = TestBed.inject(AgRefreshService);
        languageService = TestBed.inject(LanguageService);

        component.initialOfferingSteps = {
            SETTINGS: 0,
            PRODUCTS: 1,
            PLANS: 2,
            COVERAGE_DATES: 3,
            PRICES_ELIGIBILITY: 4,
            CARRIER_FORMS: 5,
            REVIEW_SUBMIT: 6,
        } as OfferingSteps;
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("setSpecificContinousPlans()", () => {
        it("should add data object to coveragePeriodContinuousPlansPanelList array and call carrierFormsStatus()", () => {
            const carrierSpecificContinuousPlans = [
                {
                    plan: {
                        id: 1,
                        name: "test",
                        adminName: "test",
                        carrierId: 1,
                        missingEmployerFlyer: false,
                        displayOrder: 1,
                        description: "test",
                        policyOwnershipType: PolicyOwnershipType.INDIVIDUAL,
                    } as Plan,
                    planChoice: {
                        id: 1,
                        planId: 1,
                        taxStatus: TaxStatus.POSTTAX,
                        agentAssisted: false,
                        enrollmentPeriod: { effectiveStarting: "2024-01-01" } as EnrollmentPeriod,
                    } as PlanChoice,
                    states: [] as CountryState[],
                    planEligibilty: {
                        planId: 1,
                        eligibility: "ELIGIBLE",
                        allowedStates: [] as AllowedState[],
                    },
                },
            ] as PlanPanelModel[];
            const specificCarrier = {
                id: 1,
                name: "Aflac",
            } as Carrier;
            const productPannelItem = {
                carrier: [],
                groupEligibility: true,
                individualEligibility: true,
                product: {
                    id: 1,
                    name: "test",
                },
            } as PanelModel;
            component.coveragePeriodContinuousPlansPanelList = [];
            component.carriersForApproval = ["1"];
            component.carrierFormsFromStore = [
                {
                    id: 1,
                    name: "test",
                    status: {},
                    pages: [],
                },
            ];

            const spy = jest.spyOn(component, "carrierFormsStatus");
            component.setSpecificContinousPlans(carrierSpecificContinuousPlans, specificCarrier, productPannelItem);

            expect(component.coveragePeriodContinuousPlansPanelList).toStrictEqual([
                {
                    carrier: specificCarrier,
                    plans: carrierSpecificContinuousPlans,
                    product: productPannelItem.product,
                    planYearDatesTooltip: component.planYearDatesTooltipContinuous,
                    policyOwnershipType: carrierSpecificContinuousPlans[0].plan.policyOwnershipType,
                },
            ]);
            expect(spy).toBeCalled();
        });
    });
    describe("setSpecificPRPlans()", () => {
        it("should add data object to coveragePeriodPRPlansPanelList array and call carrierFormsStatus()", () => {
            const carrierSpecificPRPlans = [
                {
                    plan: {
                        id: 1,
                        name: "test",
                        adminName: "test",
                        carrierId: 1,
                        missingEmployerFlyer: false,
                        displayOrder: 1,
                        description: "test",
                        policyOwnershipType: PolicyOwnershipType.INDIVIDUAL,
                    } as Plan,
                    planChoice: {
                        id: 1,
                        planId: 1,
                        taxStatus: TaxStatus.POSTTAX,
                        agentAssisted: false,
                        enrollmentPeriod: { effectiveStarting: "2024-01-01" } as EnrollmentPeriod,
                    } as PlanChoice,
                    states: [] as CountryState[],
                    planEligibilty: {
                        planId: 1,
                        eligibility: "ELIGIBLE",
                        allowedStates: [] as AllowedState[],
                    },
                },
            ] as PlanPanelModel[];
            const specificCarrier = {
                id: 1,
                name: "Aflac",
            } as Carrier;
            const productPannelItem = {
                carrier: [],
                groupEligibility: true,
                individualEligibility: true,
                product: {
                    id: 1,
                    name: "test",
                },
            } as PanelModel;
            component.coveragePeriodPRPlansPanelList = [];
            component.planYearDetails = [
                {
                    type: PlanYearType.AFLAC_INDIVIDUAL,
                    name: "test",
                    coveragePeriod: { effectiveStarting: "2024-01-01" },
                    enrollmentPeriod: { effectiveStarting: "2024-01-01" },
                },
            ] as PlanYear[];
            component.carriersForApproval = ["1"];
            component.carrierFormsFromStore = [
                {
                    id: 1,
                    name: "test",
                    status: {},
                    pages: [],
                },
            ];

            const spy = jest.spyOn(component, "carrierFormsStatus");
            component.setSpecificPRPlans(carrierSpecificPRPlans, specificCarrier, productPannelItem);

            expect(component.coveragePeriodPRPlansPanelList).toStrictEqual([
                {
                    carrier: specificCarrier,
                    plans: carrierSpecificPRPlans,
                    product: productPannelItem.product,
                    planYear: component.planYearDetail,
                    planYearTooltip: component.planYearDatesTooltip,
                    policyOwnershipType: carrierSpecificPRPlans[0].plan.policyOwnershipType,
                },
            ]);
            expect(spy).toBeCalled();
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
    describe("getBenefitDollarCount()", () => {
        it("should set benefit dollar length", () => {
            const event = 3;
            component.getBenefitDollarCount(event);
            expect(component.benefitDollarCount).toEqual(event);
        });
    });
    describe("editProducts()", () => {
        it("should navigate to products step", () => {
            const spy = jest.spyOn(component, "navigateToRespectiveStep");
            component.editProducts();
            expect(spy).toBeCalledWith(component.initialOfferingSteps.PRODUCTS);
        });
    });
    describe("editPlans()", () => {
        it("should navigate to plans step", () => {
            const spy = jest.spyOn(component, "navigateToRespectiveStep");
            component.editPlans();
            expect(spy).toBeCalledWith(component.initialOfferingSteps.PLANS);
        });
    });
    describe("editCoverageDates()", () => {
        it("should navigate to coverage dates step", () => {
            const spy = jest.spyOn(component, "navigateToRespectiveStep");
            component.editCoverageDates();
            expect(spy).toBeCalledWith(component.initialOfferingSteps.COVERAGE_DATES);
        });
    });
    describe("editPrices()", () => {
        it("should navigate to pricing and eligibility step", () => {
            const spy = jest.spyOn(component, "navigateToRespectiveStep");
            component.editPrices();
            expect(spy).toBeCalledWith(component.initialOfferingSteps.PRICES_ELIGIBILITY);
        });
    });
    describe("editCarrierForms()", () => {
        it("should navigate to carrier forms step", () => {
            const spy = jest.spyOn(component, "navigateToRespectiveStep");
            component.editCarrierForms();
            expect(spy).toBeCalledWith(component.initialOfferingSteps.CARRIER_FORMS, true);
        });
    });
    describe("editSettings()", () => {
        it("should navigate to settings step", () => {
            const spy = jest.spyOn(component, "navigateToRespectiveStep");
            component.editSettings();
            expect(spy).toBeCalledWith(component.initialOfferingSteps.SETTINGS);
        });
    });
    describe("fetchAccountStatus()", () => {
        it("should check the account status", () => {
            const isAccountDeactivated = true;
            const spy = jest.spyOn(mockSideNavService, "fetchAccountStatus").mockReturnValue(isAccountDeactivated);
            component.fetchAccountStatus();
            expect(component.isAccountDeactivated).toEqual(isAccountDeactivated);
        });
    });
    describe("onConfirmDialogAction()", () => {
        it("should define popup button action and executes the 'if condition' if 'isSave' is false", () => {
            component.allowNavigation$ = new Subject<boolean>();
            const spy = jest.spyOn(mockSideNavService["stepClicked$"], "next");
            const spy1 = jest.spyOn(component["allowNavigation$"], "next");
            const spy2 = jest.spyOn(component["allowNavigation$"], "complete");
            component.onConfirmDialogAction(false);
            expect(spy).toBeCalledWith(component.initialOfferingSteps.REVIEW_SUBMIT);
            expect(spy1).toBeCalledWith(false);
            expect(spy2).toBeCalled();
        });
        it("should define popup button action without executing the condition if 'isSave' is true", () => {
            component.allowNavigation$ = new Subject<boolean>();
            const spy1 = jest.spyOn(component["allowNavigation$"], "next");
            const spy2 = jest.spyOn(component["allowNavigation$"], "complete");
            component.onConfirmDialogAction(false);
            expect(spy1).toBeCalledWith(false);
            expect(spy2).toBeCalled();
        });
    });
    describe("checkIsAdminApprovalRequired()", () => {
        it("should check admin approval", () => {
            component.coveragePeriodPRPlansPanelList = [{ carrier: { id: 2 } }];
            component.carriersForApproval = [2, 5, 6];
            expect(component.checkIsAdminApprovalRequired()).toBe(true);
        });
    });

    describe("onBack()", () => {
        it("should back to carrier-forms step  ", () => {
            const spy = jest.spyOn(mockSideNavService["stepClicked$"], "next");
            component.onBack();
            expect(spy).toBeCalledWith(component.initialOfferingSteps.CARRIER_FORMS);
        });
    });

    describe("displayErrorMessage()", () => {
        it("should update errorMessage with invalid state language string if error status is 409 and error code is invalidState", () => {
            jest.spyOn(languageService, "fetchSecondaryLanguageValue").mockReturnValue(
                "secondary.portal.benefitsOffering.reviewSubmit.invalidState",
            );
            component.displayErrorMessage({ status: 409, error: { code: "invalidState" } } as unknown as HttpErrorResponse);
            expect(component.errorMessage).toStrictEqual(["secondary.portal.benefitsOffering.reviewSubmit.invalidState"]);
        });

        it("should update errorMessage with conflict language string if error status is 409 and error code is conflict", () => {
            jest.spyOn(languageService, "fetchSecondaryLanguageValue").mockReturnValue(
                "secondary.portal.benefitsOffering.reviewSubmit.conflict",
            );
            component.displayErrorMessage({ status: 409, error: { code: "conflict" } } as unknown as HttpErrorResponse);
            expect(component.errorMessage).toStrictEqual(["secondary.portal.benefitsOffering.reviewSubmit.conflict"]);
        });

        it("should update errorMessage with locked language string if error status is 409 and error code is locked", () => {
            jest.spyOn(languageService, "fetchSecondaryLanguageValue").mockReturnValue(
                "secondary.portal.benefitsOffering.reviewSubmit.locked",
            );
            component.displayErrorMessage({ status: 409, error: { code: "locked" } } as unknown as HttpErrorResponse);
            expect(component.errorMessage).toStrictEqual(["secondary.portal.benefitsOffering.reviewSubmit.locked"]);
        });

        it("should update errorMessage with error message if error status is 500 and error code is badData", () => {
            jest.spyOn(agRefreshService, "getServerErrorMessageForAg");
            component.displayErrorMessage({
                error: { code: "badData", status: 500, message: "error message" },
            } as unknown as HttpErrorResponse);
            expect(component.errorMessage).toStrictEqual(["error message"]);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });
});
