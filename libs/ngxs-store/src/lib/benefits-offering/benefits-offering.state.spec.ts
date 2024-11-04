import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { CarrierFormSetupStatus } from "@empowered/api";
import { ResetState } from "@empowered/user/state/actions";
import { NgxsModule, Store } from "@ngxs/store";
import { UpdateCurrentPlanYearId } from "./benefits-offering.action";
import { BenefitsOfferingState } from "./benefits-offering.state";
import { InitialBenefitsOfferingSteps } from "./constants/initial-offering-steps-data";
import { StoreModule } from "@ngrx/store";
describe("BenefitsOfferingState", () => {
    let store: Store;
    let benefitsOfferingState: BenefitsOfferingState;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot([BenefitsOfferingState]), HttpClientTestingModule, StoreModule.forRoot({})],
            providers: [DatePipe],
        });

        store = TestBed.inject(Store);
        benefitsOfferingState = TestBed.inject(BenefitsOfferingState);
    });

    it("should be truthy", () => {
        expect(benefitsOfferingState).toBeTruthy();
    });

    describe("ResetState()", () => {
        it("it should reset data", () => {
            store.dispatch(new ResetState());
            const resetData = store.selectSnapshot((state) => state);

            expect(resetData).toStrictEqual({
                productOffering: {
                    allProducts: [],
                    allCarriers: [],
                    eligiblePlans: [],
                    panelProducts: [],
                    planChoices: [],
                    planEligibilty: [],
                    planCarriers: [],
                    mpGroup: null,
                    benefitOferingStates: [],
                    productChoices: [],
                    defaultStep: 0,
                    approvedCarrierForms: null,
                    unApprovedCarrierForms: null,
                    region: [],
                    combinations: [],
                    unApprovedPlanChoices: [],
                    unApprovedProductChoices: [],
                    unapprovedPanelProducts: [],
                    userNewPlanYearChoice: null,
                    newPlanYearId: null,
                    newplanYearPanel: [],
                    newPlanYearProductChoice: [],
                    userPlanChoices: [],
                    carrierSetupStatuses: [],
                    managePlanYearChoice: null,
                    productsTabView: [],
                    newPlanYearDetail: null,
                    defaultStates: [],
                    hasApprovalAppeared: [],
                    offeringSteps: InitialBenefitsOfferingSteps.withPricing,
                    eligibleEmployees: null,
                    newPlanYearSelection: null,
                    approvedProductChoices: [],
                    rsliEligibility: null,
                    submitApprovalToasterStatus: [],
                    isAccountTPP: null,
                    thirdPartyRequirement: null,
                    attributeId: null,
                    currentPlanYearId: null,
                    isNewPlanYear: null,
                },
            });
        });
    });

    describe("UpdateCurrentPlanYearId()", () => {
        it("it should Update Current PlanYearId", () => {
            store.dispatch(new UpdateCurrentPlanYearId(1));
            const currentPlanYearId = store.selectSnapshot((state) => state.productOffering.currentPlanYearId);
            expect(currentPlanYearId).toEqual(1);
        });
    });

    describe("checkForCarrierFormStatus()", () => {
        it("it should return CarrierFormSetupStatus.APPROVED when status is CarrierFormSetupStatus.APPROVED_AUTO, initial flow is true/ false", () => {
            expect(benefitsOfferingState.checkForCarrierFormStatus(true, CarrierFormSetupStatus.APPROVED_AUTO)).toBe(
                CarrierFormSetupStatus.APPROVED,
            );
            expect(benefitsOfferingState.checkForCarrierFormStatus(false, CarrierFormSetupStatus.APPROVED_AUTO)).toBe(
                CarrierFormSetupStatus.APPROVED,
            );
        });
        it("it should return CarrierFormSetupStatus.APPROVED when status is CarrierFormSetupStatus.APPROVED_BY_CARRIER, initial flow is true/ false", () => {
            expect(benefitsOfferingState.checkForCarrierFormStatus(true, CarrierFormSetupStatus.APPROVED_BY_CARRIER)).toBe(
                CarrierFormSetupStatus.APPROVED,
            );
            expect(benefitsOfferingState.checkForCarrierFormStatus(false, CarrierFormSetupStatus.APPROVED_BY_CARRIER)).toBe(
                CarrierFormSetupStatus.APPROVED,
            );
        });
        it("it should return CarrierFormSetupStatus.APPROVED when status is CarrierFormSetupStatus.SIGNED_BY_GROUP, initial flow is true", () => {
            expect(benefitsOfferingState.checkForCarrierFormStatus(true, CarrierFormSetupStatus.SIGNED_BY_GROUP)).toBe(
                CarrierFormSetupStatus.APPROVED,
            );
        });
        it("it should return CarrierFormSetupStatus.PENDING when status is CarrierFormSetupStatus.SIGNED_BY_GROUP, initial flow is false", () => {
            expect(benefitsOfferingState.checkForCarrierFormStatus(false, CarrierFormSetupStatus.SIGNED_BY_GROUP)).toBe(
                CarrierFormSetupStatus.PENDING,
            );
        });
        it("it should return CarrierFormSetupStatus.INCOMPLETE when status is other than APPROVED_AUTO,APPROVED_BY_CARRIER, SIGNED_BY_GROUP", () => {
            expect(benefitsOfferingState.checkForCarrierFormStatus(false, CarrierFormSetupStatus.SIGNED_BY_BROKER)).toBe(
                CarrierFormSetupStatus.INCOMPLETE,
            );
        });
    });
});
