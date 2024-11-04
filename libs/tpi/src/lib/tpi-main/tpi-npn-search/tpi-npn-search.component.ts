import { Component, OnDestroy, HostBinding, OnInit } from "@angular/core";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { AccountService } from "@empowered/api";
import { Store } from "@ngxs/store";
import { TPIState } from "@empowered/ngxs-store";
import { Router } from "@angular/router";
import { Subject, Observable, throwError } from "rxjs";
import { catchError, tap, switchMap, takeUntil } from "rxjs/operators";
import { SetTPIProducerId, SetTPISSODetail, UtilService } from "@empowered/ngxs-store";
import { HttpResponse, HttpErrorResponse } from "@angular/common/http";
import { TpiSSOModel, AppSettings, AccountProducer, ClientErrorResponseCode, TpiUserDetail } from "@empowered/constants";
import { FormControl } from "@angular/forms";
import { TpiServices } from "@empowered/common-services";

// Component Level Constants
const BLANK = "";
const COMMISSION_SPLIT = "commission-split";
const ENROLLMENT_METHOD = "enrollment-method";
const EXIT = "exit";
const HEADERS = "headers";
const SLASH = "/";
const LOCATION = "location";
const IdIndex = 6;
const PARSE_INT = 10;

@Component({
    selector: "empowered-tpi-npn-search",
    templateUrl: "./tpi-npn-search.component.html",
    styleUrls: ["./tpi-npn-search.component.scss"],
})
export class TpiNpnSearchComponent implements OnInit, OnDestroy {
    npn = new FormControl(BLANK);
    email = new FormControl(BLANK);
    errorMessage = BLANK;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.tpiEnrollment.provideAgentNPN",
        "primary.portal.tpiEnrollment.emailRegistration",
        "primary.portal.tpiEnrollment.agentNPN",
        "primary.portal.tpiEnrollment.agentEmail",
        "primary.portal.common.continue",
        "primary.portal.tpiEnrollment.exit",
        "primary.portal.tpiEnrollment.welcomeText",
    ]);
    langStrings: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.tpiEnrollment.inconvenienceMessage",
        "secondary.portal.tpiEnrollment.agentNPNEmailRequired",
        "secondary.portal.tpiEnrollment.invalidNPNEmail",
        "secondary.portal.tpiEnrollment.invalidWritingNumber",
        "secondary.portal.tpiEnrollment.notEligible",
        "secondary.portal.tpiEnrollment.incorrectLicense.message",
        "secondary.portal.tpiEnrollment.wrongNPNEmail.message",
        "secondary.portal.tpiEnrollment.wrongEmail.message",
        "secondary.portal.tpiEnrollment.wrongNPN.message",
        "secondary.portal.tpi.genericError",
    ]);
    @HostBinding("class") classes = "tpi-content-wrapper";
    genericError = this.langStrings["secondary.portal.tpi.genericError"];
    mpGroup: number;
    nextScreen: string;
    private readonly unsubscribe$: Subject<void> = new Subject();
    isSpinnerLoading = false;
    tpiLnlMode = false;
    isValidNpn = true;
    producerId: string;

    constructor(
        private readonly language: LanguageService,
        private readonly accountService: AccountService,
        private readonly store: Store,
        private readonly router: Router,
        private readonly tpiService: TpiServices,
        private readonly utilService: UtilService,
    ) {
        this.mpGroup = this.store.selectSnapshot(TPIState.tpiSsoDetail)?.user?.groupId;
    }

    /**
     * Implements Angular's OnInit Life Cycle hook
     */
    ngOnInit(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
    }

    /**
     * Method to make API call for NPN search and return response
     * If NPN or email exist it will make an API call for NPN search from onContinue() method if any error occurs it will return the error
     * @returns http response
     */
    onContinueHandleError(): Observable<HttpErrorResponse | HttpResponse<void> | AccountProducer> {
        return this.accountService.importProducerViaTPI(this.npn.value, this.email.value, this.mpGroup).pipe(
            takeUntil(this.unsubscribe$),
            tap((response) => {
                this.isSpinnerLoading = false;
                this.nextScreen = COMMISSION_SPLIT;
                this.producerId = response[HEADERS].get(LOCATION).split(SLASH)[IdIndex];
                this.store.dispatch(new SetTPIProducerId(+this.producerId));
            }),
            catchError((error) => {
                if (error.error.status === AppSettings.API_RESP_409 && error.error.code !== AppSettings.INVALIDSTATE) {
                    const newProducerId = error[HEADERS].get(LOCATION).split(SLASH)[IdIndex];
                    this.producerId = newProducerId;
                    this.store.dispatch(new SetTPIProducerId(+this.producerId));
                    return this.checkPendingJoiningFlag(newProducerId).pipe(
                        tap((response) => {
                            this.nextScreen = response.pendingInvite ? COMMISSION_SPLIT : ENROLLMENT_METHOD;
                            if (this.nextScreen === ENROLLMENT_METHOD) {
                                this.tpiService.setStep(null);
                            }
                        }),
                    );
                }
                return throwError(error);
            }),
        );
    }
    /**
     * Function called on click of 'Continue' button
     * If NPN or Email any of one is valid it will navigate to the next screen
     */
    onContinue(): void {
        this.isSpinnerLoading = true;
        if (this.npn.value || this.email.value) {
            this.errorMessage = BLANK;
            this.producerId = null;
            this.onContinueHandleError()
                .pipe(
                    takeUntil(this.unsubscribe$),
                    catchError((error) => {
                        if (error.error.status === AppSettings.API_RESP_400 && this.npn.value && this.email.value) {
                            return this.onContinueHandleError();
                        }
                        return throwError(error);
                    }),
                    switchMap(() => this.enableProducerAssistedTpiSSO(parseInt(this.producerId, PARSE_INT))),
                )
                .subscribe(
                    (response) => {
                        const tpiData: TpiSSOModel = this.utilService.copy(this.store.selectSnapshot(TPIState).tpiSSODetail);
                        tpiData.user = response;
                        this.store.dispatch(new SetTPISSODetail(tpiData));
                        this.errorMessage = BLANK;
                        this.router.navigate([`tpi/${this.nextScreen}`]);
                    },
                    (error) => {
                        if (error.error.status === ClientErrorResponseCode.RESP_400) {
                            if (this.npn.value && !this.email.value) {
                                this.npn.setErrors({ invalidNPN: true });
                                this.errorMessage = this.langStrings["secondary.portal.tpiEnrollment.wrongNPN.message"];
                            } else if (!this.npn.value && this.email.value) {
                                this.email.setErrors({ invalidEmail: true });
                                this.errorMessage = this.langStrings["secondary.portal.tpiEnrollment.wrongEmail.message"];
                            } else {
                                this.npn.setErrors({ invalidNPNEmail: true });
                                this.email.setErrors({ invalidNPNEmail: true });
                                this.errorMessage = this.langStrings["secondary.portal.tpiEnrollment.wrongNPNEmail.message"];
                            }
                        } else if (error.error.status === AppSettings.API_RESP_409 && error.error.code === AppSettings.INVALIDSTATE) {
                            this.errorMessage = this.langStrings["secondary.portal.tpiEnrollment.invalidWritingNumber"];
                        } else if (error.error.status === ClientErrorResponseCode.RESP_403) {
                            this.npn.setErrors({ invalidNPN: true });
                            this.errorMessage = this.langStrings["secondary.portal.tpiEnrollment.incorrectLicense.message"];
                        } else if (error.error.status === AppSettings.API_RESP_500) {
                            this.errorMessage = this.langStrings["secondary.portal.tpiEnrollment.inconvenienceMessage"];
                        } else {
                            this.errorMessage = this.genericError;
                        }
                        this.isSpinnerLoading = false;
                    },
                );
        } else {
            this.isSpinnerLoading = false;
            this.npn.setErrors({ required: true });
            this.email.setErrors({ required: true });
            this.errorMessage = this.langStrings["secondary.portal.tpiEnrollment.agentNPNEmailRequired"];
        }
    }

    /**
     * API to fetch the pending joining flag. If true then proceed to commission split else enrollment method
     * @param producerId
     * @returns Observable of AccountProducer interface
     */
    checkPendingJoiningFlag(producerId: string): Observable<AccountProducer> {
        return this.accountService.getAccountProducer(producerId, this.mpGroup);
    }
    /**
     * Function to switch the enabling authentication from selfservice to agent assisted flow
     * @param producerId - The producer id which get returns from header location
     * @returns Observable of TpiUserDetail
     */
    enableProducerAssistedTpiSSO(producerId: number): Observable<TpiUserDetail> {
        return this.accountService.enableProducerAssistedTpiSSO(producerId);
    }
    /**
     * Function called on click of 'Exit' button
     */
    onExit(): void {
        this.router.navigate([`tpi/${EXIT}`]);
    }
    /**
     * Implements Angular's OnDestroy Life Cycle hook
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
