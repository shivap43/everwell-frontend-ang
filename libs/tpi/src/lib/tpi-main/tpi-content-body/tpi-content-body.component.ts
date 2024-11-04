import { Component, OnInit, OnDestroy } from "@angular/core";
import {
    AflacService,
    ShoppingService,
    AccountService,
    AdminService,
    BenefitsOfferingService,
    CoreService,
    MemberService,
    ProductSelection,
} from "@empowered/api";
import { Subject, throwError, iif, Observable, of, Subscription } from "rxjs";
import { takeUntil, switchMap, catchError, tap, filter } from "rxjs/operators";
import { Select, Store } from "@ngxs/store";
import { HttpErrorResponse, HttpClient } from "@angular/common/http";
import { LanguageService, LanguageState, LoadSecondaryLandingLanguage } from "@empowered/language";
import {
    TPIState,
    IsQleShop,
    SetPermissions,
    SetPortal,
    SetOfferingState,
    SetAllCarriersTPI,
    DualPlanYearService,
} from "@empowered/ngxs-store";
import { Router } from "@angular/router";
import { EnrollmentState, SetErrorForShop, SetEnrollmentMethod } from "@empowered/ngxs-store";
import { TpiServices, SharedService } from "@empowered/common-services";

// Component Level constants
import {
    ApiError,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    TpiSSOModel,
    ProducerDetails,
    AppSettings,
    EnrollmentMethod,
    Portals,
    PlanOffering,
    Product,
    ProductOffering,
    CompanyCode,
    GroupAttributeEnum,
    GroupAttributeName,
} from "@empowered/constants";

const EXPAND_ID = "plan.productId";
const ENROLLMENT_SCREEN_PAGE_ID = 1;
const ENROLLMENT_INIT_PATH = "tpi/enrollment-initiate";
const COMMISSION_SPLIT = "tpi/commission-split";
const CONSENT_STATEMENT = "tpi/consent-statement";
const ENROLLMENT_METHOD = "tpi/enrollment-method";
const CONFIRM_ADDRESS = "tpi/confirm-address";
const EXIT = "tpi/exit";
const INVALID_GROUP_KEY = "secondary.portal.tpiEnrollment.invalidGroup";
const TPI_HOME = "/tpi";
const COVERAGE = "tpi/coverage-summary";
const DETAILS = "details";
const ERROR = "error";
const INVALID_ENROLLMENT_STATE_PRODUCER_ERROR_KEY = "error.detail.displayText.getPlanOfferings.400.producer.state";
const INVALID_ENROLLMENT_STATE_MEMBER_ERROR_KEY = "error.detail.displayText.getPlanOfferings.400.member.state";
const INVALID_AGE_ERROR_KEY_PRODUCER_PORTAL = "error.detail.displayText.getPlanOfferings.400.producer.tooOld";
const INVALID_AGE_ERROR_KEY_MEMBER_PORTAL = "error.detail.displayText.getPlanOfferings.400.member.tooOld";
const BENEFIT_OFFERING_ERROR_PRODUCER = "error.detail.displayText.getPlanOfferings.409.producer.benefitOffering";
const BENEFIT_OFFERING_ERROR_MEMBER = "error.detail.displayText.getPlanOfferings.409.member.benefitOffering";

@Component({
    selector: "empowered-tpi-content-body",
    templateUrl: "./tpi-content-body.component.html",
    styleUrls: ["./tpi-content-body.component.scss"],
})
export class TpiContentBodyComponent implements OnInit, OnDestroy {
    memberId: number;
    mpGroup: number;
    producerId: number;
    listOfAgentAssistedProduct: PlanOffering[] = [];
    listOfSelfServiceProduct: PlanOffering[] = [];
    planOffered: PlanOffering[] = [];
    errorMessage: string;
    ssoDetails: TpiSSOModel;
    loadSpinner = false;
    isPlanOfferingsLoaded = false;
    primaryProducerInfo: ProducerDetails;
    ssoAuthData: TpiSSOModel;
    invalidEnrollmentStateErrorMessage: string;
    agInfoMessage: string;
    productChoices: ProductSelection[];
    referenceDate: string;
    invalidEnrollmentAgeErrorMessage: string;
    private readonly unsubscribe$: Subject<void> = new Subject();
    benefitOfferingError = "";

    primaryLangStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.assist.enrollment",
        "primary.portal.tpi.MemberPortalInfoMessage",
    ]);

    langStrings: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.tpiEnrollment.inconvenienceMessage",
        "secondary.portal.tpiEnrollment.invalidWritingNumber",
        "secondary.portal.tpiEnrollment.notEligible",
        "secondary.portal.tpiEnrollment.stateNotAvailable",
        "secondary.portal.tpiEnrollment.member.tooOld.singleProduct",
        "secondary.portal.tpiEnrollment.member.tooOld.allProducts",
        INVALID_GROUP_KEY,
        "secondary.getPlanOfferings.409.producer.benefitOffering.error",
        "secondary.getPlanOfferings.409.member.benefitOffering.error",
        "secondary.portal.tpiEnrollment.producer.tooOld.singleProduct",
        "secondary.portal.tpiEnrollment.producer.tooOld.allProducts",
    ]);
    productDetail: Product;
    isNpnPartOfGroup = false;
    planOfferingsData: PlanOffering[];
    subscriptions: Subscription[] = [];
    @Select(LanguageState.getApiErrorLanguage) errorMessage$: Observable<ApiError>;
    constructor(
        private readonly aflacService: AflacService,
        private readonly store: Store,
        private readonly tpiService: TpiServices,
        private readonly shoppingService: ShoppingService,
        private readonly language: LanguageService,
        private readonly accountService: AccountService,
        private readonly adminService: AdminService,
        private readonly router: Router,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly coreService: CoreService,
        private readonly httpClient: HttpClient,
        private readonly memberService: MemberService,
        private readonly sharedService: SharedService,
    ) {}
    /**
     * Implements Angular's OnInit Life Cycle hook
     */
    ngOnInit(): void {
        this.ssoAuthData = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        this.sharedService
            .getPrimaryProducer(this.ssoAuthData.user?.groupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((producerInfo) => {
                this.primaryProducerInfo = producerInfo;
            });
        this.ssoDetails = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        if (this.ssoDetails.productId) {
            this.getProductDetails(this.ssoDetails.productId);
        }
        this.memberId = this.ssoDetails.user?.memberId;
        this.mpGroup = this.ssoDetails.user?.groupId;
        this.producerId = this.ssoDetails.user?.producerId;
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.store.dispatch(new SetPermissions());
        this.loadPlanOfferingsData();
        this.errorMessage$.pipe(takeUntil(this.unsubscribe$)).subscribe((errorMessage) => {
            const apiErrorObject = this.store.selectSnapshot(EnrollmentState.GetApiError);
            if (
                errorMessage &&
                apiErrorObject &&
                errorMessage.errorKey &&
                apiErrorObject.errorKey &&
                errorMessage.errorKey === apiErrorObject.errorKey
            ) {
                if (errorMessage.errorKey === BENEFIT_OFFERING_ERROR_PRODUCER || errorMessage.errorKey === BENEFIT_OFFERING_ERROR_MEMBER) {
                    this.tpiService.setSSOError(true);
                    this.benefitOfferingError = this.producerId
                        ? this.langStrings["secondary.getPlanOfferings.409.producer.benefitOffering.error"]
                        : this.langStrings["secondary.getPlanOfferings.409.member.benefitOffering.error"];
                } else if (errorMessage.errorKey === INVALID_AGE_ERROR_KEY_PRODUCER_PORTAL) {
                    this.setAgeErrorMessageForAgent();
                } else if (errorMessage.errorKey === INVALID_AGE_ERROR_KEY_MEMBER_PORTAL) {
                    this.setAgeErrorMessageForMember();
                } else {
                    this.errorMessage = errorMessage.value;
                }
            }
        });
        // Setting a list of all carriers to global state for the TPI flow
        this.subscriptions.push(
            this.accountService
                .getGroupAttributesByName([GroupAttributeEnum.COMPANY_CODE], +this.mpGroup)
                .pipe(
                    tap((result) => {
                        let stateCode = null;
                        if (result?.length) {
                            stateCode = result[0].value === CompanyCode.US ? stateCode : CompanyCode.NY;
                        }
                        this.store.dispatch(new SetAllCarriersTPI(stateCode)).pipe();
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * load plan offerings data
     * this function will set the sso errors before navigating to tpi shop
     */
    loadPlanOfferingsData(): void {
        this.loadSpinner = false;
        this.referenceDate = this.dualPlanYearService.getReferenceDate();
        this.shoppingService
            .getPlanOfferings(
                undefined,
                EnrollmentMethod.SELF_SERVICE,
                undefined,
                {},
                this.memberId,
                this.mpGroup,
                EXPAND_ID,
                this.referenceDate,
            )
            .pipe(
                tap((planOfferings) => {
                    this.isPlanOfferingsLoaded = true;
                    this.planOfferingsData = planOfferings;
                    if (this.producerId) {
                        this.checkEmployeeStatus();
                    } else {
                        this.getPlanYears();
                    }
                }),
                catchError((error) => {
                    this.loadSpinner = false;
                    if (error.error?.language?.languageTag === INVALID_AGE_ERROR_KEY_MEMBER_PORTAL) {
                        this.setAgeErrorMessageForMember();
                    } else if (error.error?.language?.languageTag === INVALID_AGE_ERROR_KEY_PRODUCER_PORTAL) {
                        this.setAgeErrorMessageForAgent();
                    } else {
                        this.getPlanOfferingError(error.error);
                        this.showErrorAlertMessage(error);
                    }
                    return of(error);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * Method to call getMember service and check if employee is terminated
     * @returns void
     */
    checkEmployeeStatus(): void {
        this.subscriptions.push(
            this.memberService.getMember(this.memberId, true, this.mpGroup?.toString()).subscribe(
                (response) => {
                    const memberInfo = response.body;
                    if (memberInfo.workInformation.termination.terminationDate) {
                        this.router.navigate([COVERAGE]);
                    } else {
                        this.getPlanYears();
                    }
                },
                () => {
                    this.getPlanYears();
                },
            ),
        );
    }

    /**
     *  Function will provide the product detail based on product id
     *  @param productId product id passed in TPI URL
     *  @returns void
     */
    getProductDetails(productId: number): void {
        this.coreService
            .getProduct(productId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((productDetail) => {
                this.productDetail = productDetail;
            });
    }
    /**
     * Method to call getPlanYears service and store its response
     * Calling checkBenefitsOffering method
     */
    getPlanYears(): void {
        this.benefitsOfferingService
            .getPlanYears(this.mpGroup, false)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((planYearsData) => this.store.dispatch(new IsQleShop({ planYearsData })));
        this.checkBenefitOffering();
        if (this.router.url === TPI_HOME) {
            this.checkProducerId().pipe(takeUntil(this.unsubscribe$)).subscribe();
        }
    }

    /**
     * Function for agent assisted flow when producer id is available
     * @returns boolean, for member consent
     */
    checkProducerId(): Observable<boolean> {
        if (this.producerId) {
            let pendingInviteFLag: boolean;
            return this.accountService.getAccountProducer(this.producerId.toString(), this.mpGroup).pipe(
                tap((res) => {
                    this.tpiService.setStep(ENROLLMENT_SCREEN_PAGE_ID);
                    if (res.pendingInvite) {
                        pendingInviteFLag = true;
                        this.router.navigate([COMMISSION_SPLIT]);
                    }
                }),
                catchError((error) =>
                    this.adminService.getAdmin(this.producerId).pipe(
                        takeUntil(this.unsubscribe$),
                        switchMap((response) =>
                            this.accountService.importProducerViaTPI(response.npn, response.emailAddress, this.mpGroup),
                        ),
                        tap(
                            () => {
                                this.isNpnPartOfGroup = true;
                                this.router.navigate([COMMISSION_SPLIT]);
                            },
                            (errorMsg) => {
                                if (errorMsg.error.status === AppSettings.API_RESP_409) {
                                    this.errorMessage = this.langStrings["secondary.portal.tpiEnrollment.invalidWritingNumber"];
                                } else if (errorMsg.error.status === AppSettings.API_RESP_403) {
                                    this.errorMessage = this.langStrings["secondary.portal.tpiEnrollment.notEligible"];
                                } else if (error.error.status === AppSettings.API_RESP_500) {
                                    this.errorMessage = this.langStrings["secondary.portal.tpiEnrollment.inconvenienceMessage"];
                                }
                            },
                        ),
                    ),
                ),
                switchMap(() =>
                    iif(
                        () => !pendingInviteFLag && !this.isNpnPartOfGroup,
                        this.aflacService.getMemberConsent(this.memberId, this.mpGroup.toString()),
                        of(null),
                    ),
                ),
                takeUntil(this.unsubscribe$),
                tap(
                    (value: boolean) => {
                        if (!value) {
                            this.tpiService.setStep(ENROLLMENT_SCREEN_PAGE_ID);
                            this.router.navigate([CONSENT_STATEMENT]);
                        } else {
                            this.postConsentOperation();
                        }
                    },
                    (_error: HttpErrorResponse) => {
                        this.router.navigate([ENROLLMENT_INIT_PATH]);
                    },
                ),
            );
        }
        return this.getMemberConsentValue();
    }

    /**
     * Function to get member consent boolean value
     * @returns boolean, for member consent
     */
    getMemberConsentValue(): Observable<boolean> {
        return this.aflacService.getMemberConsent(this.memberId, this.mpGroup.toString()).pipe(
            takeUntil(this.unsubscribe$),
            tap(
                (value: boolean) => {
                    if (!value) {
                        this.tpiService.setStep(ENROLLMENT_SCREEN_PAGE_ID);
                        this.router.navigate([CONSENT_STATEMENT]);
                    } else {
                        this.postConsentOperation();
                    }
                },
                (_error: HttpErrorResponse) => {
                    this.router.navigate([ENROLLMENT_INIT_PATH]);
                },
            ),
        );
    }

    /**
     * Function to close the modal on click of 'Exit' button
     */
    onExit(): void {
        this.router.navigate([EXIT]);
    }
    /**
     * This function will check whether flow is self service or agent assisted
     */
    postConsentOperation(): void {
        if (!this.ssoDetails.user.producerId) {
            // This is self service
            this.store.dispatch(new SetPortal(Portals.MEMBER));
            this.getPlanOffering();
        } else {
            this.store.dispatch(new SetPortal(Portals.PRODUCER));
            this.tpiService.setStep(null);
            this.router.navigate([ENROLLMENT_METHOD]);
        }
    }
    /**
     * This function will fetch the product offering from DB for self service flow
     */
    getPlanOffering(): void {
        this.referenceDate = this.dualPlanYearService.getReferenceDate();
        let getProductInfo$: Observable<ProductSelection[] | null> = of(null);
        if (this.isPlanOfferingsLoaded && this.planOfferingsData) {
            if (this.planOfferingsData.length > 0) {
                if (this.isPlanOrProductPartOfGroup(this.planOfferingsData)) {
                    this.tpiService.setStep(null);
                    getProductInfo$ = this.benefitsOfferingService.getProductChoices(this.mpGroup, false);
                } else {
                    this.store.dispatch(new SetOfferingState(this.planOfferingsData));
                    this.planOffered = this.planOfferingsData;
                    this.listOfAgentAssistedProduct = this.planOfferingsData.filter((filteredObj) => filteredObj.agentAssistanceRequired);
                    if (this.listOfAgentAssistedProduct.length === 0) {
                        // products are only self service, hence redirect to confirm address page
                        this.tpiService.setStep(null);
                        this.router.navigate([CONFIRM_ADDRESS]);
                        this.store.dispatch(new SetEnrollmentMethod(EnrollmentMethod.SELF_SERVICE));
                    } else {
                        // there are some agent assisted product, hence redirec to enrollment initiation screen
                        this.tpiService.setStep(ENROLLMENT_SCREEN_PAGE_ID);
                        this.router.navigate([ENROLLMENT_INIT_PATH]);
                    }
                }
            } else {
                this.store.dispatch(new SetOfferingState(this.planOfferingsData));
                if (this.ssoDetails.user?.producerId || !this.ssoAuthData.productId) {
                    this.tpiService.setStep(ENROLLMENT_SCREEN_PAGE_ID);
                    this.router.navigate([ENROLLMENT_INIT_PATH]);
                } else {
                    this.tpiService.setStep(null);
                    this.router.navigate([CONFIRM_ADDRESS]);
                }
            }
        }
        getProductInfo$
            .pipe(
                filter((productChoices) => !!productChoices),
                tap((productChoices) => {
                    this.loadSpinner = false;
                    this.productChoices = productChoices;
                }),
                switchMap(() => this.shoppingService.getProductOfferings(this.mpGroup)),
                switchMap((productOfferings: ProductOffering[]) => {
                    const productOfferingId = productOfferings.find((product) => product.product.id === this.ssoAuthData.productId).id;
                    return this.shoppingService.getPlanOfferings(
                        productOfferingId.toString(),
                        EnrollmentMethod.SELF_SERVICE,
                        undefined,
                        {},
                        this.memberId,
                        this.mpGroup,
                        EXPAND_ID,
                        this.referenceDate,
                    );
                }),
                tap(() => this.setAgOrStateErrorMessage()),
                catchError((error) => {
                    this.loadSpinner = false;
                    if (error.error?.language?.languageTag === INVALID_AGE_ERROR_KEY_MEMBER_PORTAL) {
                        this.setAgeErrorMessageForMember();
                    } else if (error.error?.language?.languageTag === INVALID_AGE_ERROR_KEY_PRODUCER_PORTAL) {
                        this.setAgeErrorMessageForAgent();
                    } else if (this.isPlanOfferingsLoaded) {
                        this.setAgOrStateErrorMessage();
                    } else {
                        this.getPlanOfferingError(error.error);
                        this.showErrorAlertMessage(error);
                    }
                    return of(error);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * method to set error messages related to aflac group or state
     * @returns void
     */
    setAgOrStateErrorMessage(): void {
        const chosenProductChoice = this.productChoices.find((productChoice) => productChoice.id === this.ssoDetails.productId);
        if (chosenProductChoice?.group) {
            this.agInfoMessage = this.primaryLangStrings["primary.portal.tpi.MemberPortalInfoMessage"];
        } else {
            this.router.navigate([CONFIRM_ADDRESS]);
            this.store.dispatch(new SetEnrollmentMethod(EnrollmentMethod.SELF_SERVICE));
        }
    }
    /**
     * Function will map the error dynamically from DB based on the API error code and status
     * @param err error object return in case of failure of API
     */
    showErrorAlertMessage(err: Error): void {
        const error = err[ERROR];
        this.errorMessage$.pipe(takeUntil(this.unsubscribe$)).subscribe((errorMessage) => {
            const apiErrorObject = this.store.selectSnapshot(EnrollmentState.GetApiError);
            if (
                apiErrorObject.errorKey === INVALID_ENROLLMENT_STATE_PRODUCER_ERROR_KEY ||
                apiErrorObject.errorKey === INVALID_ENROLLMENT_STATE_MEMBER_ERROR_KEY
            ) {
                this.invalidEnrollmentStateErrorMessage = this.primaryLangStrings["primary.portal.assist.enrollment"]
                    .replace("##producerFName##", this.primaryProducerInfo.name.firstName)
                    .replace("##producerLName##", this.primaryProducerInfo.name.lastName)
                    .replace("##phoneNumber##", this.primaryProducerInfo.phoneNumber)
                    .replace("##emailAddress##", this.primaryProducerInfo.emailAddress);
            } else {
                if (errorMessage?.errorKey && apiErrorObject?.errorKey && errorMessage.errorKey === apiErrorObject.errorKey) {
                    if (errorMessage.errorKey === INVALID_AGE_ERROR_KEY_MEMBER_PORTAL) {
                        this.setAgeErrorMessageForMember();
                    } else if (errorMessage.errorKey === INVALID_AGE_ERROR_KEY_PRODUCER_PORTAL) {
                        this.setAgeErrorMessageForAgent();
                    } else {
                        this.errorMessage = errorMessage.value;
                    }
                }
            }
        });
        if (error.status === ClientErrorResponseCode.RESP_400 && error[DETAILS].length > 0) {
            for (const detail of error[DETAILS]) {
                this.errorMessage = this.language.fetchSecondaryLanguageValue(
                    `secondary.portal.members.api.${error.status}.${error.code}.${detail.field}`,
                );
            }
        } else if (error.code === ClientErrorResponseType.DUPLICATE) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.portal.members.api.${error.status}.${error.code}`);
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }

    /**
     * method to set error related to age for self service
     * @returns void
     */
    setAgeErrorMessageForMember(): void {
        this.tpiService.setIsAgeError(true);
        if (this.ssoDetails?.productId) {
            this.invalidEnrollmentAgeErrorMessage = this.langStrings["secondary.portal.tpiEnrollment.member.tooOld.singleProduct"];
        } else {
            this.invalidEnrollmentAgeErrorMessage = this.langStrings["secondary.portal.tpiEnrollment.member.tooOld.allProducts"];
        }
    }

    /**
     * method to set error related to age for agent assisted
     * @returns void
     */
    setAgeErrorMessageForAgent(): void {
        this.tpiService.setIsAgeError(true);
        if (this.ssoDetails?.productId) {
            this.invalidEnrollmentAgeErrorMessage = this.langStrings["secondary.portal.tpiEnrollment.producer.tooOld.singleProduct"];
        } else {
            this.invalidEnrollmentAgeErrorMessage = this.langStrings["secondary.portal.tpiEnrollment.producer.tooOld.allProducts"];
        }
    }

    /**
     * method to handle getPlanOffering API error
     * @param {ApiError} error error object
     */
    getPlanOfferingError(error: ApiError): void {
        if (error) {
            this.store.dispatch(new SetErrorForShop(error));
        }
    }

    /**
     * Function to check whether the product Id is present in plan offered API response or not
     * @param planResponse Planoffering response of get Plan offered API
     * @return boolean is the product is available in plan offering or not
     */
    isPlanOrProductPartOfGroup(planResponse: PlanOffering[]): boolean {
        return this.ssoDetails.productId && !planResponse.find((planOffer) => planOffer.plan.product.id === this.ssoDetails.productId);
    }

    /**
     * Function to check benefit offering is set up or not before third party enrollment
     */
    checkBenefitOffering(): void {
        this.aflacService
            .importAflacPolicies(this.memberId, this.mpGroup)
            .pipe(
                takeUntil(this.unsubscribe$),
                catchError((error) => throwError(error)),
            )
            .subscribe();
    }
    /**
     * Function to consume the keep-alive api on change of any event
     * @returns void
     */
    keepAlive(): void {
        if ((this.ssoDetails || ({} as TpiSSOModel)).keepalive) {
            this.httpClient
                .get(this.ssoDetails.keepalive)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    catchError((error) => of(error)),
                )
                .subscribe();
        }
    }
    /**
     * Implements Angular's OnDestroy Life Cycle hook
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subs) => subs.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
