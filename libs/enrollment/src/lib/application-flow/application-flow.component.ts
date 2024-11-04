import { Component, OnInit, ChangeDetectorRef, AfterViewChecked, OnDestroy } from "@angular/core";
import { Store } from "@ngxs/store";

import {
    LoadApplicationFlowData,
    LoadApplicationResponses,
    LoadAllPlans,
    MapApplicationResponse,
    SetMPGroup,
    SetMemberId,
    SetMemberData,
    SetSSNData,
    SetMemberContact,
    SetEmployeeId,
    MakeAppFlowStoreEmpty,
    SetPartnerAccountType,
    SetDependentMember,
    CarrierRiskClass,
    SetFlowType,
    SetProductOfferings,
    SetAllPlanOfferings,
    EnrollmentState,
    MemberBeneficiaryService,
    SharedState,
    DualPlanYearState,
    QleOeShopModel,
    SetRegex,
    AppFlowService,
    StaticUtilService,
    DualPlanYearService,
    TPIState,
} from "@empowered/ngxs-store";
import { StaticService, ShoppingCartDisplayService, ShoppingService, AccountService } from "@empowered/api";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin } from "rxjs";

import { takeUntil, switchMap, filter, tap } from "rxjs/operators";
import { Subject, combineLatest } from "rxjs";
import { OverlayRef, PositionStrategy } from "@angular/cdk/overlay";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { UserService } from "@empowered/user";
import {
    ConfigName,
    BasePlanApplicationPanel,
    StaticStep,
    TpiSSOModel,
    PdaData,
    AppSettings,
    AccountProducer,
    DualPlanYearSettings,
    ProducerCredential,
    SYMBOLS,
    GetAncillary,
    CustomSection,
    StepType,
} from "@empowered/constants";
import { TpiServices, SharedService } from "@empowered/common-services";

const CONFIRMATION_STEP = 4;
const PRIMARY_PRODUCER = "PRIMARY_PRODUCER";

@Component({
    selector: "empowered-application-flow",
    templateUrl: "./application-flow.component.html",
    styleUrls: ["./application-flow.component.scss"],
})
export class ApplicationFlowComponent implements OnInit, AfterViewChecked, OnDestroy {
    planObject;
    display = true;
    overlayRef: OverlayRef;
    overlayPosition: PositionStrategy;
    stepperComponentPortal;
    showSpinner = true;
    applicationData;
    mpGroup;
    memberId;
    stepIndex: number;
    sectionId: number;
    planId: number;
    actualStep = "";
    staticStep = StaticStep;
    init = true;
    isPda = false;
    isReinstate = false;
    signRequest;
    isMemberPortal = false;
    portal: string;
    private unsubscribe$ = new Subject<void>();
    carrierIds: number[] = [];
    isQleShop: boolean;
    isOeShop: boolean;
    isDualPlanYear: boolean;
    qleYear: string;
    oeYear: string;
    dualPlanYearData: QleOeShopModel;
    isQleDuringOeEnrollment: boolean;
    isQleAfterOeEnrollment: boolean;
    memberShopLink = "member/wizard/enrollment/shop";
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.applyCoverage",
        "primary.portal.applicationFlow.returnShop",
        "primary.portal.applicationFlow.backToShop",
        "primary.portal.shop.dualPlanYear.lifeEventEnrollmentApply",
        "primary.portal.shop.dualPlanYear.openEnrollmentsApply",
        "primary.portal.tpiEnrollment.exit",
        "primary.portal.common.back",
        "primary.portal.tpiEnrollment.applyCoverage",
        "primary.portal.tpi.appFlow.backToReview",
        "primary.portal.shop.dualPlanYear.lifeEventCurrentEnrollmentApply",
        "primary.portal.shop.dualPlanYear.lifeEventFutureEnrollmentApply",
    ]);
    isTpi = false;
    tpiLnlMode = false;
    isSsoToPlan = false;
    isSsoToProduct = false;
    isSsoToShop = false;
    tpiSSODetails: TpiSSOModel;
    backToShope = false;
    inConfirmPage = true;
    samePlanYear: boolean;
    data: PdaData;
    producerId: number;
    readonly PAGE = "page";
    readonly APP_FLOW = "appFlow";
    isPrPDAConfigEnabled: boolean;
    isEBSPaymentConfigEnabled: boolean;
    isEBSAccount: boolean;
    preliminaryStatementData: CustomSection[] = [];
    cartIds: number[] = [];
    showPreliminaryStatement = false;
    constructor(
        private readonly router: Router,
        private readonly store: Store,
        private readonly memberService: MemberBeneficiaryService,
        private readonly staticService: StaticService,
        private readonly route: ActivatedRoute,
        private readonly appFlowService: AppFlowService,
        private readonly shoppingCartDisplayService: ShoppingCartDisplayService,
        private readonly cdr: ChangeDetectorRef,
        private readonly language: LanguageService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly tpiService: TpiServices,
        private readonly shoppingService: ShoppingService,
        private readonly userService: UserService,
        private readonly sharedService: SharedService,
        private readonly accountService: AccountService,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    /**
     * Life cycle hook for angular to initialize the component
     */
    ngOnInit(): void {
        this.staticService
            .getConfigurations(ConfigName.PR_PDA_TEMPLATE + SYMBOLS.COMMA + ConfigName.EBS_PAYMENT_FEATURE_ENABLE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((configs) => {
                this.isPrPDAConfigEnabled = Boolean(configs[0].value);
                this.isEBSPaymentConfigEnabled = Boolean(configs[1].value);
            });
        this.sharedService.tpiAppFlowPDA$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.appFlowService.lastCompleteStaticStep.next(CONFIRMATION_STEP);
                this.appFlowService.planChanged$.next({
                    nextClicked: true,
                    discard: false,
                });
            }
        });
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: ProducerCredential) => {
            this.producerId = credential.producerId;
        });

        this.appFlowService.setcallCenterPin("");
        this.appFlowService.updateReturnToShop$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp: boolean) => {
            if (resp) {
                this.isPda = resp;
            }
        });
        this.appFlowService.hideBackButton$
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((resp) => this.isTpi || this.tpiLnlMode),
            )
            .subscribe(() => {
                this.inConfirmPage = false;
            });
        this.isEBSAccount = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
        if (this.router.url.indexOf(AppSettings.TPI) >= 0) {
            this.tpiSSODetails = this.store.selectSnapshot(TPIState.tpiSsoDetail);
            this.producerId = this.tpiSSODetails.user.producerId;
            if (!this.producerId && this.isPrPDAConfigEnabled) {
                let primaryProducer: AccountProducer;
                this.accountService
                    .getAccountProducers(this.tpiSSODetails.user.groupId.toString())
                    .pipe(
                        filter((producer) => {
                            primaryProducer = producer.find((primary) => primary.role === PRIMARY_PRODUCER);
                            return !!primaryProducer;
                        }),
                        tap(() => {
                            this.data.producerId = primaryProducer.producer.id;
                        }),
                        takeUntil(this.unsubscribe$),
                    )
                    .subscribe();
            }
            this.isTpi = true;
            this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
            if (this.tpiSSODetails.planId) {
                this.isSsoToPlan = true;
            } else if (this.tpiSSODetails.productId) {
                this.isSsoToProduct = true;
            } else {
                this.isSsoToShop = true;
            }
        }
        this.store.dispatch(new MakeAppFlowStoreEmpty());
        this.store.dispatch(new SetRegex());
        this.memberId = this.route.snapshot.params.memberId;
        this.mpGroup = this.route.snapshot.params.mpGroupId;
        this.portal = this.store.selectSnapshot(SharedState.portal);
        if (this.portal === AppSettings.PORTAL_MEMBER) {
            this.isMemberPortal = true;
        }
        this.appFlowService.fetchEnrollments(this.mpGroup, this.memberId);
        this.appFlowService.fetchMemberDependents(this.memberId, this.mpGroup);
        forkJoin([
            this.store.dispatch(new SetMPGroup(this.mpGroup)),
            this.store.dispatch(new SetFlowType(this.router.url.indexOf("direct") >= 0)),
            this.store.dispatch(new SetMemberId(this.memberId)),
            this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.*")),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.store.dispatch(new SetMemberData());
                this.store.dispatch(new SetSSNData());
                this.store.dispatch(new SetMemberContact());
                this.store.dispatch(new SetEmployeeId());
                this.store.dispatch(new SetDependentMember());
                this.updateAccountType();
            });
        this.appFlowService.showStaticStep.subscribe((resp) => {
            this.actualStep = resp;
            if (this.actualStep === StaticStep.PDA) {
                this.appFlowService.showNextProductFooter$.next({ nextClick: true, data: StaticStep.PDA });
            }
        });

        this.appFlowService.planChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((res) => {
            this.getApplicationFromStore();
        });

        this.appFlowService.requestForSignatureSent$.pipe(takeUntil(this.unsubscribe$)).subscribe((res) => {
            this.signRequest = res;
        });
        this.isDualPlanYear = false;
        this.dualPlanYearScenario();
        if ((!this.isPda && !this.isTpi) || (!this.isPda && this.tpiLnlMode && this.isTpi && (this.isSsoToPlan || this.isSsoToProduct))) {
            this.backToShope = true;
            this.inConfirmPage = true;
        }
        if (this.isMemberPortal) {
            this.getProductPlanOfferings();
        }
        this.data = {
            mpGroupId: this.mpGroup,
            memberId: this.memberId,
            producerId: this.producerId,
            isDocument: false,
            state: this.store.selectSnapshot(EnrollmentState.GetEnrollmentState),
            enrollmentType: this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod),
            isOwnAccount: true,
        };
    }
    /**
     * Method to get product and plan offerings and store it in state
     */
    getProductPlanOfferings(): void {
        const referenceDate: string = this.dualPlanYearService.getReferenceDate();
        const enrollmentState: string = this.store.selectSnapshot(EnrollmentState.GetEnrollmentState);
        const enrollmentMethod: string = this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod);
        forkJoin(
            this.shoppingService.getProductOfferingsSorted(this.mpGroup),
            this.shoppingService.getPlanOfferings(
                null,
                enrollmentMethod,
                enrollmentState,
                {},
                this.memberId,
                this.mpGroup,
                "",
                referenceDate,
            ),
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([productOfferings, planOfferings]) => {
                this.store.dispatch(new SetProductOfferings(productOfferings));
                this.store.dispatch(new SetAllPlanOfferings(planOfferings));
            });
    }
    /**
     * Method to check for dual plan year scenario
     */
    dualPlanYearScenario(): void {
        this.dualPlanYearData = this.store.selectSnapshot(DualPlanYearState);
        if (this.dualPlanYearData.isDualPlanYear) {
            this.isDualPlanYear = true;
            this.isQleDuringOeEnrollment = this.dualPlanYearData.isQleDuringOeEnrollment;
            this.isQleAfterOeEnrollment = this.dualPlanYearData.isQleAfterOeEnrollment;
            if (this.dualPlanYearData.selectedShop === DualPlanYearSettings.QLE_SHOP) {
                this.qleYear = this.dualPlanYearData.qleYear;
                this.isQleShop = true;
                this.isOeShop = false;
            } else if (
                this.dualPlanYearData.selectedShop === DualPlanYearSettings.OE_SHOP ||
                this.dualPlanYearData.selectedShop === DualPlanYearSettings.NEW_PY_QLE_SHOP
            ) {
                this.isQleShop = false;
                this.isOeShop = true;
                this.oeYear = this.dualPlanYearData.oeYear;
            }
            if (this.isQleAfterOeEnrollment) {
                this.samePlanYear = this.dualPlanYearData.oeYear === this.dualPlanYearData.qleYear;
            }
        }
    }
    updateAccountType(): void {
        this.store.dispatch(new SetPartnerAccountType()).subscribe(
            (resp) => {
                this.loadApplicationdata();
            },
            // If any error comes from this api other process should not get stop
            (error) => {
                this.loadApplicationdata();
            },
        );
    }

    ngAfterViewChecked(): void {
        this.cdr.detectChanges();
    }

    checkStepConstraintsOnNext(): void {
        const steps = this.planObject.application.appData.sections[this.sectionId].steps;
        if (
            steps[this.stepIndex].length &&
            this.appFlowService.skipOnConstraints(
                steps[this.stepIndex][0].constraintAggregates,
                this.planId,
                this.planObject,
                this.planObject.application.cartData,
            )
        ) {
            if (this.stepIndex < steps.length - 1) {
                this.stepIndex += 1;
                this.checkStepConstraintsOnNext();
            } else if (this.stepIndex === steps.length - 1) {
                this.appFlowService.sectionChanged$.next({
                    planId: this.planId,
                    nextClicked: true,
                });
            }
        } else {
            this.planObject.steps = steps[this.stepIndex];
            this.planObject.stepIndex = this.stepIndex;
            if ((this.planObject.stepType = steps[this.stepIndex].length)) {
                this.planObject.stepType = steps[this.stepIndex][0].type;
            }
        }
    }

    checkStepConstraintsOnBack(): void {
        const steps = this.planObject.application.appData.sections[this.sectionId].steps;
        if (
            steps[this.stepIndex].length &&
            this.appFlowService.skipOnConstraints(
                steps[this.stepIndex][0].constraintAggregates,
                this.planId,
                this.planObject,
                this.planObject.application.cartData,
            )
        ) {
            if (this.stepIndex) {
                this.stepIndex -= 1;
                this.checkStepConstraintsOnBack();
            } else if (this.stepIndex === 0) {
                this.appFlowService.sectionChanged$.next({
                    planId: this.planId,
                    nextClicked: false,
                });
            }
        } else {
            this.planObject.steps = steps[this.stepIndex];
            this.planObject.stepIndex = this.stepIndex;
            if ((this.planObject.stepType = steps[this.stepIndex].length)) {
                this.planObject.stepType = steps[this.stepIndex][0].type;
            }
            // this.appFlowService.handleSameSection$.next(true);
        }
    }

    loadApplicationdata(): void {
        this.memberService.mpGroup.next(this.mpGroup);
        this.memberService.memberId.next(this.memberId);
        this.staticService
            .getConfigurations("portal.member.form.beneficiary.*", this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.memberService.validators.next(Response);
            });
        this.store.dispatch(new LoadApplicationFlowData(this.memberId, this.mpGroup)).subscribe((res) => {
            this.store.dispatch(new LoadApplicationResponses()).subscribe(
                (resp) => {
                    this.loadAllPlans();
                },
                (error) => {
                    // If any error comes in getting response another functionality should not get stopped.
                    this.loadAllPlans();
                },
            );
        });
    }

    onPlanChange(planObject: any): void {
        const planObjectData = JSON.parse(JSON.stringify(planObject));
        const index = planObject.application.appData.sections.findIndex(
            (section) => section.steps[0].step[0].type === StepType.MARKET_CONDUCT_QUESTION,
        );
        if (index > -1) {
            planObjectData.application.appData.sections.splice(index, 1);
        }
        this.planObject = planObjectData;
    }
    loadAllPlans(): void {
        this.store
            .dispatch(new LoadAllPlans())
            .pipe(
                switchMap((response) => this.store.dispatch(new CarrierRiskClass())),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((response) => {
                this.store.dispatch(MapApplicationResponse);
                this.getApplicationFromStore();
            });
    }
    /**
     * Method to route to shop from application flow
     */
    routeToShop(): void {
        if (this.store.selectSnapshot(SharedState.portal) === AppSettings.PORTAL_MEMBER && !this.isTpi) {
            this.router.navigate([this.memberShopLink]);
        } else if (this.router.url.indexOf(AppSettings.PAYROLL) >= 0 || this.router.url.indexOf(AppSettings.DIRECT) >= 0) {
            this.router.navigate([`../../../quote-shop/${this.mpGroup}/specific/${this.memberId}`], {
                relativeTo: this.route,
            });
        } else {
            this.router.navigate(["/tpi/shop"]);
        }
        this.sharedService.setIsOccupationClassA(false);
    }

    getApplicationFromStore(): void {
        combineLatest([
            this.store.select(EnrollmentState.GetApplicationPanel),
            this.staticUtilService.cacheConfigEnabled(ConfigName.NY_MARKET_CONDUCT),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([resp, showPreliminaryStatement]) => {
                this.showPreliminaryStatement = showPreliminaryStatement;
                const applicationData = JSON.parse(JSON.stringify(resp));
                const preliminarySectionData = [];
                const cartItems = [];
                applicationData.forEach((application) => {
                    const index = application.appData.sections.findIndex(
                        (section) => section.steps[0].step[0].type === StepType.MARKET_CONDUCT_QUESTION,
                    );
                    if (index > -1) {
                        // removed preliminary section from sections array to not display it as part of plan flow ste
                        const preliminarySection = application.appData.sections.splice(index, 1);
                        if (!this.preliminaryStatementData.length) {
                            preliminarySectionData.push(...preliminarySection);
                            cartItems.push(application.cartData.id);
                        }
                    }
                });
                if (!this.preliminaryStatementData.length && preliminarySectionData.length) {
                    // using preliminaryStatementData to display preliminary section as a separate app flow step
                    this.preliminaryStatementData = preliminarySectionData;
                    this.cartIds = cartItems;
                }
                if (this.preliminaryStatementData.length && showPreliminaryStatement) {
                    this.appFlowService.showPreliminaryStatementStep$.next(true);
                } else {
                    this.appFlowService.showPreliminaryStatementStep$.next(false);
                }
                this.applicationData = applicationData;
                if (applicationData?.length) {
                    if (this.init) {
                        this.getAncillaryInformation(applicationData);
                    } else {
                        this.applicationData = applicationData;
                    }
                }
            });
    }
    /**
     * This method will extract carriers from direct payment. Which is stored in ngxs store.
     * @returns void
     */
    getCarriers(): void {
        const payments = this.store.selectSnapshot(EnrollmentState.GetDirectPayment);
        const carriers: number[] = payments.map((plan) => plan.carrierId);
        this.carrierIds = [...new Set(carriers)];
    }

    /**
     * Get information for ancillary.
     * @param applicationData {BasePlanApplicationPanel[]} application data fetched from ngxs store.
     * @returns Void
     */
    getAncillaryInformation(applicationData: BasePlanApplicationPanel[]): void {
        this.init = false;
        const apiCalls$ = [];
        applicationData.forEach((application) => {
            apiCalls$.push(
                this.shoppingCartDisplayService.getAncillaryInformation(
                    this.memberId,
                    application.cartData.id,
                    this.mpGroup,
                    application.appData.planId,
                ),
            );
        });
        forkJoin(apiCalls$)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((responses: GetAncillary[]) => {
                responses.forEach((response, i) => {
                    this.appFlowService.patchConstraint(applicationData[i].appData.id, "", response);
                });
                this.showSpinner = false;
                this.getCarriers();
                this.applicationData = applicationData;
            });
    }

    /**
     * Function to route back to Review and Apply page
     */
    backToReview(): void {
        this.router.navigate(["tpi/shop"], { queryParams: { review: true } });
    }

    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
