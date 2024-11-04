import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of } from "rxjs";
import { Store } from "@ngxs/store";
import { TPIState } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";
import { AccountService, ThirdPartyPlatforms } from "@empowered/api";
import { map, switchMap } from "rxjs/operators";

@Injectable({ providedIn: "root" })
export class TpiServices {
    private readonly stepChange$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
    step$ = this.stepChange$.asObservable();
    private readonly prevStep$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
    previousStep$ = this.prevStep$.asObservable();
    private readonly ageError$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    isAgeError$ = this.ageError$.asObservable();
    private readonly ssoError$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private readonly shopPageFlow$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    isShopPageFlow$ = this.shopPageFlow$.asObservable();
    constructor(
        private readonly store: Store,
        private readonly dateService: DateService,
        private readonly accountService: AccountService,
    ) {}

    /**
     * This will set the step accodingly in subject
     * @param step step number from Enrollment initiate screen
     */
    setStep(step: number): void {
        this.stepChange$.next(step);
    }

    /**
     * This will set the previous step accodingly in subject
     * @param prevStep Previous step {string}
     */
    setPreviousStep(step: string): void {
        this.prevStep$.next(step);
    }

    /**
     * Function to return whether TPI flow is link and launch or Modal mode
     * @return boolean false if modal mode flow else true for link and launch
     */
    isLinkAndLaunchMode(): boolean {
        return !this.store.selectSnapshot(TPIState.tpiSsoDetail).modal;
    }

    /**
     * Closes the modal window of the TPI modal mode
     * PostMessage safely enables cross-origin communication between Everwell 2.0 and TPP
     * This will dispatch MessageEvent to the parent, which  on the TPP website, of the iframe
     * TPP listens to this event and executes the logic of closing the modal window
     */
    closeTPIModal(): void {
        parent.postMessage(["close"], "*");
    }

    /**
     * Function to set isAgeError
     * based on this input header in TPI will be displayed
     */
    setIsAgeError(isAgeError: boolean): void {
        this.ageError$.next(isAgeError);
    }

    /**
     * Function to set any TPI SSO Errors
     * @param isError sso error
     */
    setSSOError(isError: boolean): void {
        this.ssoError$.next(isError);
    }

    /**
     * Function to set any TPI SSO Errors
     * based on this user will be navigate to tpi shop
     * @return boolean value of sso error
     */
    getSSOError(): Observable<boolean> {
        return this.ssoError$.asObservable();
    }

    /**
     * Function to fetch if the member enrollment cancellation allowed for current active TPI
     * @param mpGroup member group id
     * @returns boolean indicates if member enrollment cancellation allowed
     */
    isMemberCancellationAllowed(mpGroup: string): Observable<boolean> {
        return this.accountService.getAccountThirdPartyPlatforms(mpGroup).pipe(
            switchMap((thirdPartyPlatforms: ThirdPartyPlatforms[]) => {
                const activeThirdPartyPlatform = thirdPartyPlatforms.find((tpp) => {
                    if (this.dateService.getIsAfterOrIsEqual(new Date(), tpp.validity.effectiveStarting)) {
                        if (tpp.validity.expiresAfter) {
                            if (this.dateService.isBeforeOrIsEqual(new Date().setHours(0, 0, 0, 0), tpp.validity.expiresAfter)) {
                                return true;
                            } else {
                                return false;
                            }
                        } else {
                            return true;
                        }
                    } else {
                        return false;
                    }
                });
                return of(activeThirdPartyPlatform?.thirdPartyPlatform.memberEnrollmentCancellationAllowed ?? false);
            }),
        );
    }

    /**
     * Returns groupId from the SSO details
     * @returns number - groupId
     */
    getGroupId(): number {
        return this.store.selectSnapshot(TPIState.tpiSsoDetail)?.user?.groupId;
    }

    /**
     * Returns memberId from the SSO details
     * @returns number - memberId
     */
    getMemberId(): number {
        return this.store.selectSnapshot(TPIState.tpiSsoDetail)?.user?.memberId;
    }
    /**
     * Function to set if Aflac Always flow is from shop page or coverage summary
     * @param isError sso error
     */
    setShopPageFlow(isFlowFromShopPage: boolean) {
        this.shopPageFlow$.next(isFlowFromShopPage);
    }
}
