import { takeUntil, map } from "rxjs/operators";
import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { EnrollmentState, UpdateSkippedStepResponses, AppFlowService, StaticUtilService } from "@empowered/ngxs-store";

import { LanguageService } from "@empowered/language";
import { ShoppingCartDisplayService, EnrollmentService } from "@empowered/api";
import { Store } from "@ngxs/store";
import { Subject, Observable, of, merge } from "rxjs";

import {
    ConfigName,
    CarrierId,
    PayFrequency,
    StepData,
    RiderCart,
    Step,
    GetCartItems,
    ApplicationResponse,
    StepType,
    MemberCoverageDetails,
} from "@empowered/constants";

const HQ_MSG_FLAG = "isHQMsgEnabled$";
const FRAUD_MSG_FLAG = "isFraudProtectionMsgEnabled$";

@Component({
    selector: "empowered-text",
    templateUrl: "./text.component.html",
    styleUrls: ["./text.component.scss"],
})
export class TextComponent implements OnInit, OnDestroy {
    @Input() planObject: StepData;
    planFlowId: number;
    planFlowStepId: number;
    isNotProduction$: Observable<boolean>;
    body: string;
    isConfirmation: boolean;
    hasAflacAlways = false;
    fromDirect = false;
    hasEBSPayment = false;
    stepData: Step;
    headlineLast: string;
    directionsLast: string;
    hasApiError = false;
    errorMessage: string;
    mpGroup: number;
    memberId: number;
    cartData: GetCartItems;
    riderCartData: RiderCart;
    planId: number;
    payFrequency: PayFrequency;
    // value of below observable will be true if current planId falls under "appFlow.fraud.confirmation.message" config values.
    isFraudProtectionMsgEnabled$ = of(false);
    // value of below observable will be true if current planId falls under "appFlow.HQ.fraud.confirmation.message" config values.
    isHQMsgEnabled$ = of(false);
    private readonly unsubscribe$ = new Subject<void>();
    isAgPlan = false;
    tierName$: Observable<string>;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.continue",
        "primary.portal.applicationFlow.debug.planFlow",
        "primary.portal.applicationFlow.debug.planFlowStep",
        "primary.portal.common.confirm",
        "primary.portal.applicationFlow.planOption.confirm",
        "primary.portal.applicationFlow.planOption.continue",
        "primary.portal.applicationFlow.planOption.confirmAflacAlways",
        "primary.portal.applicationFlow.planOption.continueaflacAlways",
        "primary.portal.applicationFlow.planOption.confirmBilling",
        "primary.portal.applicationFlow.planOption.continueBilling",
        "primary.portal.applicationFlow.planOption.confirmApplications",
        "primary.portal.applicationFlow.planOption.continueApplications",
        "primary.portal.applicationFlow.fraudProtection.cost",
        "primary.portal.applicationFlow.fraudProtection.policy",
        "primary.portal.applicationFlow.fraudProtection.tier",
        "primary.portal.applicationFlow.fraudProtection.message",
        "primary.portal.applicationFlow.fraudProtection.HQCost",
        "primary.portal.applicationFlow.fraudProtection.decline",
        "primary.portal.applicationFlow.cost",
        "primary.portal.applicationFlow.tier",
    ]);
    totalCost$: Observable<number> = this.appFlowService.updateCost$;
    memberCoverageDetails: MemberCoverageDetails;

    constructor(
        private readonly appFlowService: AppFlowService,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly shoppingCartDisplayService: ShoppingCartDisplayService,
        private readonly staticUtilService: StaticUtilService,
        private readonly enrollmentService: EnrollmentService,
    ) {}

    /**
     * Implements Angular OnInit Life Cycle hook
     * loads data required for component
     */
    ngOnInit(): void {
        if (this.planObject.steps.length) {
            this.stepData = this.planObject.steps[0];
            if (this.planObject.steps[0].type === StepType.CONFIRMATION) {
                this.isConfirmation = true;
            }
        }
        this.fromDirect = !!this.store.selectSnapshot(EnrollmentState.GetDirectPayment).length;
        this.hasAflacAlways = !!this.store.selectSnapshot(EnrollmentState.GetAflacAlways)?.length;
        this.hasEBSPayment = !!this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        this.payFrequency = this.store.selectSnapshot(EnrollmentState.GetPayFrequency);
        this.cartData = this.planObject.application.cartData;
        this.riderCartData = this.getRiderCartDataFromCart();
        this.planId = this.planObject.application.appData.planId;
        this.body = this.stepData.body;
        this.headlineLast = this.stepData.headlineLast;
        this.directionsLast = this.stepData.directionsLast;
        this.planFlowId = this.planObject.application.appData.id;
        this.planFlowStepId = this.planObject.steps[0].id;
        this.isNotProduction$ = this.appFlowService.isNotProduction();
        if (this.isConfirmation) {
            this.setFraudFlag(FRAUD_MSG_FLAG, ConfigName.FRAUD_PROTECTION_CONFIRMATION);
            this.setFraudFlag(HQ_MSG_FLAG, ConfigName.HQ_PROTECTION_CONFIRMATION);
        }
        this.checkAgPlans();
    }

    /**
     * set the flag for fraud confirmation message.
     * @param flagName {string} Name of the flag.
     * @param configName {string} Name of the config
     * @return void
     */
    setFraudFlag(flagName: string, configName: string): void {
        this[flagName] = this.staticUtilService.cacheConfigValue(configName).pipe(
            map((plans) => {
                if (plans) {
                    const ids = plans.split(/[\s,]+/);
                    return ids.includes(this.planObject.application.planId.toString());
                }
                return false;
            }),
        );
    }

    /**
     * To check if it's Ag plan and display plan info details
     */
    checkAgPlans(): void {
        this.isAgPlan = this.planObject.application.carrierId === CarrierId.AFLAC_GROUP;
        this.tierName$ = merge(
            this.enrollmentService
                .getMemberCoverageDetails(this.memberId, this.planObject.application.cartData.id, null, this.mpGroup)
                .pipe(map((coverageDetails) => (coverageDetails ? coverageDetails.coverageLevel.name : ""))),
            this.appFlowService.updateCoverageLevel,
        );
    }

    /**
     * function that takes to next screen
     */
    goToNextProduct(): void {
        this.hasApiError = false;
        this.saveStepResponse();
    }
    /**
     * Saves response as generic step
     */
    saveStepResponse(): void {
        const stepId: number =
            this.planObject.application.appData.sections[this.planObject.currentSection.sectionId].steps[this.planObject.currentStep]
                .step[0].id;
        const responses: ApplicationResponse[] = [];
        const stepResponse: ApplicationResponse = { stepId: stepId, value: [], type: StepType.GENERICSTEP };
        responses.push(stepResponse);
        this.store.dispatch(new UpdateSkippedStepResponses({ responses: stepResponse, planId: this.planId }));
        this.shoppingCartDisplayService
            .saveApplicationResponse(
                this.memberId,
                this.planObject.rider ? this.riderCartData.cartItemId : this.cartData.id,
                this.mpGroup,
                responses,
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
                },
                (error) => {
                    this.hasApiError = true;
                    this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                },
            );
    }
    /**
     * gets rider cartdata from base plan cart data
     * @param baseCartData cartdata of base plan
     * @return rider CartData
     */
    getRiderCartDataFromCart(): RiderCart {
        return this.cartData && this.cartData.riders && this.cartData.riders.length > 0
            ? this.cartData.riders.filter((rider) => rider.planId === this.planId).pop()
            : null;
    }
    /**
     * function to execute things on destroy of component
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
