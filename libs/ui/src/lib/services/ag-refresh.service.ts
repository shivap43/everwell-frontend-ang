import { Injectable, OnDestroy } from "@angular/core";
import {
    AccountDetails,
    EligiblePlans,
    BenefitsOfferingService,
    AflacService,
    PartyType,
    CarrierFormStatus,
    CarrierFormSetupStatus,
} from "@empowered/api";
import { Observable, combineLatest, Subject, of, forkJoin, iif } from "rxjs";
import { takeUntil, switchMap, catchError, map, tap } from "rxjs/operators";
import { OpenToast, ToastModel } from "../business/toast";
import { LanguageService } from "@empowered/language";
import { AgRefreshComponent } from "../components/ag-refresh/ag-refresh.component";
import { UtilService, AccountInfoState } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { AgOfferingSubmitPopupComponent } from "../components/ag-offering-submit-popup/ag-offering-submit-popup.component";
import { CarrierId, ServerErrorResponseCode, ToastType, RefreshEligibleInfo } from "@empowered/constants";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { EmpoweredSheetService, EmpoweredModalService } from "@empowered/common-services";
import { AflacGroupOfferingQuasiComponent } from "../components/aflac-group-offering-quasi/aflac-group-offering-quasi.component";

const TOAST_DURATION = 5000;
const RENEW_AG_OFFERING = "renewAgOffering";
const API_STATUS_CODE_BAD_DATA = "badData";

@Injectable({
    providedIn: "root",
})
export class AgRefreshService implements OnDestroy {
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    private readonly refreshAccountSubject$: Subject<void> = new Subject<void>();
    refreshAccount$: Observable<void> = this.refreshAccountSubject$.asObservable();

    constructor(
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly aflacService: AflacService,
        private readonly language: LanguageService,
        private readonly empoweredSheetService: EmpoweredSheetService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly utilService: UtilService,
        private readonly store: Store,
    ) {}
    /**
     * Method checks if offering must be refreshed or renewed based on which AgRefreshComponent is called
     * @param currentAccount account details
     * @param refreshEligibleInfo refresh eligibility info
     * @param isRefreshInfo check if account info has to be refreshed
     * @returns observable of RefreshEligibleInfo
     */
    refreshAgOffering(
        currentAccount: AccountDetails,
        refreshEligibleInfo: RefreshEligibleInfo,
        isRefreshInfo?: boolean,
    ): Observable<RefreshEligibleInfo> {
        this.benefitOfferingService.changeShowSpinner(true);
        let offerablePlans: EligiblePlans;
        let refreshAflacGroupAccountError = false;
        const languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
            "primary.portal.aflacGroup.offering.updateComplete",
            "primary.portal.aflacGroup.unableToUpdateAgInfo",
            "primary.portal.aflacGroup.infoSuccessfullyUpdated",
        ]);
        return this.aflacService.getAflacGroupRefreshStatus(currentAccount.id).pipe(
            switchMap((status) =>
                iif(
                    () => status.refreshAllowed && !status.requiresBenefitOfferingRenewal,
                    this.aflacService.refreshAflacGroupAccount(currentAccount.id).pipe(
                        catchError(() => {
                            refreshAflacGroupAccountError = true;
                            return of(null);
                        }),
                    ),
                    of(null),
                ),
            ),
            switchMap(() =>
                combineLatest([
                    this.benefitOfferingService.refreshAflacGroupOfferablePlans(currentAccount.id),
                    this.aflacService.getAflacGroupPartyInformation(
                        [PartyType.CLIENT_SPECIALIST, PartyType.BROKER_SALES],
                        currentAccount.id,
                    ),
                ]),
            ),
            takeUntil(this.unsubscribe$),
            tap(() => {
                this.benefitOfferingService.changeShowSpinner(false);
                this.onRefreshAccount();
            }),
            catchError(() => {
                this.benefitOfferingService.changeShowSpinner(false);
                if (isRefreshInfo) {
                    const toastData: ToastModel = {
                        message: languageStrings["primary.portal.aflacGroup.unableToUpdateAgInfo"],
                        toastType: ToastType.DANGER,
                        duration: TOAST_DURATION,
                    };
                    return this.store.dispatch(new OpenToast(toastData));
                }
                return of(null);
            }),
            switchMap(([refreshInfo, aflacAgentInformation]) => {
                offerablePlans = refreshInfo.aflacGroupOfferablePlans;
                if (refreshEligibleInfo.refreshAllowed || refreshAflacGroupAccountError) {
                    if (!refreshInfo.aflacGroupOfferingRequiresReview && !refreshInfo.aflacGroupOfferablePlans.aflacGroupOfferingError) {
                        let message = languageStrings["primary.portal.aflacGroup.offering.updateComplete"];
                        if (isRefreshInfo) {
                            message = languageStrings["primary.portal.aflacGroup.infoSuccessfullyUpdated"];
                        }
                        const toastData: ToastModel = {
                            message: message,
                            toastType: ToastType.SUCCESS,
                            duration: TOAST_DURATION,
                        };
                        this.store.dispatch(new OpenToast(toastData));
                        return of(true);
                    }
                    return this.empoweredModalService
                        .openDialog(AgRefreshComponent, {
                            data: {
                                eligiblePlans: this.utilService.copy(refreshInfo.aflacGroupOfferablePlans),
                                aflacAgentInformation: this.utilService.copy(aflacAgentInformation),
                                isInitialOffering: false,
                                isRenewal: false,
                            },
                        })
                        .afterClosed();
                }
                if (refreshEligibleInfo.requiresBenefitOfferingRenewal) {
                    this.benefitOfferingService.changeShowSpinner(false);
                    return this.empoweredModalService
                        .openDialog(AgRefreshComponent, {
                            data: {
                                eligiblePlans: this.utilService.copy(refreshInfo.aflacGroupOfferablePlans),
                                aflacAgentInformation: this.utilService.copy(aflacAgentInformation),
                                isInitialOffering: false,
                                isRenewal: true,
                                newAflacGroupPlanYearRequired: refreshInfo.newAflacGroupPlanYearRequired,
                            },
                        })
                        .afterClosed();
                }
                return undefined;
            }),
            switchMap((resp) => {
                if (resp && resp.isSubmit) {
                    return this.empoweredModalService
                        .openDialog(AgOfferingSubmitPopupComponent, {
                            data: {
                                isSharedAccount: true,
                                isAutoApproved: true,
                            },
                        })
                        .afterClosed();
                }
                if (resp && resp.isRenewal) {
                    return this.empoweredSheetService
                        .openSheet(AflacGroupOfferingQuasiComponent, {
                            data: {
                                eligiblePlansInfo: offerablePlans,
                                opensFrom: RENEW_AG_OFFERING,
                            },
                        })
                        .afterDismissed();
                }
                return of(null);
            }),
            switchMap(() => {
                // spinner needs to be loaded at the end when all dialogs are closed
                this.benefitOfferingService.changeShowSpinner(true);
                return this.aflacService.getAflacGroupRefreshStatus(currentAccount.id);
            }),
        );
    }
    /**
     * Method checks if carrier setup status exists,if not creates the status setup
     * @returns Observable of null or empty array for an error
     */
    checkCarrierStatus(): Observable<HttpResponse<void>> {
        const currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        return forkJoin([
            this.benefitOfferingService.getCarrierSetupStatuses(currentAccount.id, CarrierId.AFLAC_GROUP, true),
            this.benefitOfferingService.getCarrierSetupStatuses(currentAccount.id, CarrierId.AFLAC_GROUP, false),
        ]).pipe(
            catchError(() => of([])),
            map(([unapprovedCarrierSetupStatus, approvedCarrierSetupStatus]) => {
                const carrierSetupStatus: CarrierFormStatus[] = [];
                carrierSetupStatus.push(...unapprovedCarrierSetupStatus);
                carrierSetupStatus.push(...approvedCarrierSetupStatus);
                return carrierSetupStatus;
            }),
            switchMap((carrierSetupStatus: CarrierFormStatus[]) => {
                if (!carrierSetupStatus.length) {
                    return this.benefitOfferingService.saveCarrierSetupStatus(currentAccount.id, CarrierId.AFLAC_GROUP, {
                        status: CarrierFormSetupStatus.INCOMPLETE,
                    });
                }
                return of(null);
            }),
        );
    }
    /**
     * This method is used to get server error message for aflac group
     * @param error is the HttpErrorResponse
     * @returns an error message based on error code
     */
    getServerErrorMessageForAg(error: HttpErrorResponse): string {
        // As per MON-60945 whatever API sends, same error message needs to be shown
        // to user only if error.status is 500 and error.code is badData
        return error.error.code === API_STATUS_CODE_BAD_DATA
            ? error.error.message
            : this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.internalServerError");
    }
    /**
     * This method is used to send default error status and error code defined error messages
     * @param error is the HttpErrorResponse
     * @returns an error message based on error status and error code
     */
    getDefaultErrorMessageForAg(error: HttpErrorResponse): string {
        return error.error.status === ServerErrorResponseCode.RESP_500
            ? this.getServerErrorMessageForAg(error)
            : this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
    }

    /**
     * Notifies observers when an account is refreshed.
     */
    onRefreshAccount(): void {
        this.refreshAccountSubject$.next();
    }
    /**
     * ng life cycle hook
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
