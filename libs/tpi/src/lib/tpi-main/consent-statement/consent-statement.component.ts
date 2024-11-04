import { Component, OnInit, OnDestroy, HostBinding } from "@angular/core";
import { AflacService, ShoppingService } from "@empowered/api";
import { LanguageService, LanguageState } from "@empowered/language";
import { Select, Store } from "@ngxs/store";
import { takeUntil, tap, switchMap } from "rxjs/operators";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Subject, Observable, of } from "rxjs";
import { Router } from "@angular/router";
import { EnrollmentState, SetErrorForShop, SetPortal, TPIState, SetOfferingState, DualPlanYearService } from "@empowered/ngxs-store";
import {
    ApiError,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    TpiSSOModel,
    ProducerDetails,
    EnrollmentMethod,
    Portals,
    PlanOffering,
} from "@empowered/constants";
import { TpiServices, SharedService } from "@empowered/common-services";

const EXPAND_ID = "plan.productId";
const STEP_ONE = 1;
const ENROLLMENT_INITIATE = "tpi/enrollment-initiate";
const CONFIRM_ADDRESS = "tpi/confirm-address";
const EXIT = "tpi/exit";
const ENROLLMENT_METHOD = "tpi/enrollment-method";
const DETAILS = "details";
const ERROR = "error";
const INVALID_ENROLLMENT_STATE_PRODUCER_ERROR_KEY = "error.detail.displayText.getPlanOfferings.400.producer.state";
const INVALID_ENROLLMENT_STATE_MEMBER_ERROR_KEY = "error.detail.displayText.getPlanOfferings.400.member.state";
const INVALID_AGE_ERROR_KEY_MEMBER_PORTAL = "error.detail.displayText.getPlanOfferings.400.member.tooOld";
@Component({
    selector: "empowered-consent-statement",
    templateUrl: "./consent-statement.component.html",
    styleUrls: ["./consent-statement.component.scss"],
})
export class ConsentStatementComponent implements OnInit, OnDestroy {
    @HostBinding("class") classes = "tpi-content-wrapper";
    memberId: number;
    mpGroup: number;
    loadSpinner = false;
    private readonly unsubscribe$ = new Subject<void>();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.tpiEnrollment.consentStatement",
        "primary.portal.tpiEnrollment.consent.content",
        "primary.portal.tpiEnrollment.exit",
        "primary.portal.common.iAgree",
        "primary.portal.common.cancel",
        "primary.portal.headset.subtitle",
        "primary.portal.common.iAgreeAria",
        "primary.portal.assist.enrollment",
    ]);
    consentContent: SafeHtml;
    tpiSsoDetail: TpiSSOModel;
    listOfAgentAssistedProduct: PlanOffering[] = [];
    planOffered: PlanOffering[] = [];
    errorMessage: string;
    tpiLnlMode = false;
    primaryProducerInfo: ProducerDetails;
    ssoAuthData: TpiSSOModel;
    invalidEnrollmentStateErrorMessage: string;
    @Select(LanguageState.getApiErrorLanguage) errorMessage$: Observable<ApiError>;

    constructor(
        private readonly aflacService: AflacService,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly domSanitizer: DomSanitizer,
        private readonly router: Router,
        private readonly tpiService: TpiServices,
        private readonly shoppingService: ShoppingService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly sharedService: SharedService,
    ) {}

    /**
     * It contains method to call memberConsent and language for consent content
     * Also taking snapshot of TPI state to get data from the store
     */
    ngOnInit(): void {
        this.ssoAuthData = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        this.sharedService
            .getPrimaryProducer(this.ssoAuthData.user.groupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((producerInfo) => {
                this.primaryProducerInfo = producerInfo;
            });
        this.tpiSsoDetail = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
        this.memberId = this.tpiSsoDetail.user.memberId;
        this.mpGroup = this.tpiSsoDetail.user.groupId;
        this.consentContent = this.domSanitizer.bypassSecurityTrustHtml(
            this.languageStrings["primary.portal.tpiEnrollment.consent.content"],
        );
    }
    /**
     * This method is called when consent is agreed
     */
    onContinue(): void {
        this.loadSpinner = true;
        this.aflacService
            .acceptMemberConsent(this.memberId, this.mpGroup.toString())
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((_response) => {
                    if (this.tpiSsoDetail.user.producerId) {
                        this.tpiService.setStep(null);
                        this.store.dispatch(new SetPortal(Portals.PRODUCER));
                        this.loadSpinner = false;
                        this.router.navigate([ENROLLMENT_METHOD]);
                    }
                }),
                switchMap((res) => {
                    if (!this.tpiSsoDetail.user.producerId) {
                        this.store.dispatch(new SetPortal(Portals.MEMBER));
                        return this.getPlanOffering();
                    }
                    return of(null);
                }),
            )
            .subscribe(
                (resp) => {
                    this.loadSpinner = false;
                    if (resp.length > 0) {
                        this.store.dispatch(new SetOfferingState(resp));
                        this.planOffered = resp;
                        this.listOfAgentAssistedProduct = resp.filter((filteredObj) => filteredObj.agentAssistanceRequired);
                        if (this.listOfAgentAssistedProduct.length === 0) {
                            // redirect to address page
                            this.tpiService.setStep(null);
                            this.router.navigate([CONFIRM_ADDRESS]);
                        } else {
                            this.tpiService.setStep(STEP_ONE);
                            this.router.navigate([ENROLLMENT_INITIATE]);
                        }
                    } else {
                        this.store.dispatch(new SetOfferingState(resp));
                        this.tpiService.setStep(STEP_ONE);
                        this.router.navigate([ENROLLMENT_INITIATE]);
                    }
                },
                (error) => {
                    this.loadSpinner = false;
                    this.getPlanOfferingError(error.error);
                    this.showErrorAlertMessage(error);
                },
            );
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
                this.invalidEnrollmentStateErrorMessage = this.languageStrings["primary.portal.assist.enrollment"]
                    .replace("##producerFName##", this.primaryProducerInfo.name.firstName)
                    .replace("##producerLName##", this.primaryProducerInfo.name.lastName)
                    .replace("##phoneNumber##", this.primaryProducerInfo.phoneNumber)
                    .replace("##emailAddress##", this.primaryProducerInfo.emailAddress);
            } else {
                // hiding age error message since it is being displayed in tpi-content-body component
                if (error?.language?.languageTag === INVALID_AGE_ERROR_KEY_MEMBER_PORTAL) {
                    this.errorMessage = "";
                } else if (errorMessage?.errorKey && apiErrorObject?.errorKey && errorMessage.errorKey === apiErrorObject.errorKey) {
                    this.errorMessage = errorMessage.value;
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
     * method to handle getPlanOffering API error
     * @param {ApiError} error error object
     */
    getPlanOfferingError(error: ApiError): void {
        if (error) {
            this.store.dispatch(new SetErrorForShop(error));
        }
    }

    /**
     * Function called on click of 'Cancel' button
     */
    onCancel(): void {
        this.router.navigate([EXIT]);
    }

    /**
     * This function will fetch the product offering from DB for self service flow
     */
    getPlanOffering(): Observable<PlanOffering[]> {
        const referenceDate = this.dualPlanYearService.getReferenceDate();
        this.loadSpinner = true;
        return this.shoppingService
            .getPlanOfferings(
                undefined,
                EnrollmentMethod.SELF_SERVICE,
                undefined,
                {},
                this.memberId,
                this.mpGroup,
                EXPAND_ID,
                referenceDate,
            )
            .pipe(takeUntil(this.unsubscribe$));
    }

    /**
     * Implements Angular's OnDestroy Life Cycle hook
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
