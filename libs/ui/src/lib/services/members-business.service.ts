import { LanguageService } from "@empowered/language";
import { Injectable } from "@angular/core";
import { MemberService } from "@empowered/api";
import {
    AddressConfig,
    ADDRESS_OPTIONS,
    ClientErrorResponseCode,
    ServerErrorResponseCode,
    Address,
    MemberListItem,
    MemberListItemStatus,
    VerifiedAddress,
} from "@empowered/constants";
import { Observable, iif, of, defer, Subject } from "rxjs";
import { switchMap, map, catchError, tap } from "rxjs/operators";
import { EmpoweredModalService } from "@empowered/common-services";
import { AddressVerificationComponent } from "../business/address-verification/address-verification.component";
import { HttpErrorResponse } from "@angular/common/http";
import { StaticUtilService } from "@empowered/ngxs-store";

const PROVIDED_ADDRESS = "providedAddress";

@Injectable({
    providedIn: "root",
})
export class MembersBusinessService {
    private readonly isLoading$ = new Subject<boolean>();
    showSpinner$ = this.isLoading$.asObservable();
    constructor(private readonly memberService: MemberService) {}

    /**
     * This method is used to start or stop spinner
     * @param isSpinner boolean value
     */
    changeShowSpinner(isSpinner: boolean): void {
        this.isLoading$.next(isSpinner);
    }
    /**
     * fetch spinner status
     * @returns observable of spinner status
     */
    getSpinnerStatus(): Observable<boolean> {
        return this.showSpinner$;
    }
    /**
     * Verifies provided address against postal service records.
     * @param providedAddress address provided by the user
     * @param memberService an instance of MemberService
     * @param modalService an instance of EmpoweredModalService
     * @param language an instance of LanguageService
     * @param staticUtil an instance of StaticUtilService
     * @param skipAddressValidation whether to skip validation
     * @returns address - either USPS-verified or the one the user selects in the address correction modal
     */
    verifyAddress(
        providedAddress: Address,
        memberService: MemberService,
        modalService: EmpoweredModalService,
        language: LanguageService,
        staticUtil: StaticUtilService,
        skipAddressValidation = false,
    ): Observable<Address> {
        if (skipAddressValidation) {
            return of(providedAddress);
        }
        return staticUtil.cacheConfigEnabled(AddressConfig.ADDRESS_VALIDATION).pipe(
            switchMap((addressValidationEnabled) =>
                iif(
                    () => addressValidationEnabled,
                    memberService.verifyMemberAddress(providedAddress).pipe(
                        switchMap((verifiedAddress) =>
                            iif(
                                () => verifiedAddress && verifiedAddress.matched,
                                of(providedAddress),
                                defer(() => this.confirmAddress(modalService, language, providedAddress, verifiedAddress)),
                            ),
                        ),
                        catchError((error) => this.confirmAddress(modalService, language, providedAddress, null, error)),
                    ),
                    of(providedAddress),
                ),
            ),
        );
    }

    /**
     * Generates a list of error messages from an error response.
     * @param error an http error object
     * @param language an instance of LanguageService
     * @returns a list of error messages to be displayed
     */
    getErrorMessages(error: HttpErrorResponse, language: LanguageService): string[] {
        let errorMessages: string[];
        if (error.status === ClientErrorResponseCode.RESP_400) {
            errorMessages = (error &&
                error.error.details &&
                error.error.details.length &&
                error.error.details.map((item) => item.message)) || [
                language.fetchSecondaryLanguageValue("secondary.portal.common.addressVerification.errors.invalidAddress"),
            ];
        } else if (error.status === ServerErrorResponseCode.RESP_500) {
            errorMessages = [language.fetchSecondaryLanguageValue("secondary.portal.common.internalServerError")];
        } else if (error.error && error.error.detail && error.error.details.length) {
            errorMessages = error.error.details.map((item) => item.message);
        }
        return errorMessages;
    }

    /**
     * Opens the address correction modal which displays any warnings / errors
     * and allows the user to either correct the input or proceed as is.
     * @param modalService an instance of EmpoweredModalService
     * @param language an instance of LanguageService
     * @param providedAddress address provided by the user
     * @param verifiedAddress optional, non-null when some correction is required to the provided address
     * @param error optional, an http error object
     * @returns observable of address
     */
    confirmAddress(
        modalService: EmpoweredModalService,
        language: LanguageService,
        providedAddress: Address,
        verifiedAddress?: VerifiedAddress,
        error?: HttpErrorResponse,
    ): Observable<Address> {
        this.changeShowSpinner(false);
        return modalService
            .openDialog(AddressVerificationComponent, {
                data: {
                    providedAddress,
                    addressResp: Boolean(error),
                    option: verifiedAddress ? ADDRESS_OPTIONS.BOTH : ADDRESS_OPTIONS.SINGLE,
                    suggestedAddress: verifiedAddress && verifiedAddress.suggestedAddress,
                    addressMessage: error && this.getErrorMessages(error, language),
                    errorStatus: error && error.status,
                },
            })
            .afterClosed()
            .pipe(
                tap((result) => this.changeShowSpinner(false)),
                map((result) => {
                    if (result && result.data && result.data.isVerifyAddress) {
                        return result.data.selectedAddress === PROVIDED_ADDRESS
                            ? providedAddress
                            : verifiedAddress && verifiedAddress.suggestedAddress;
                    }
                    return null;
                }),
            );
    }

    /**
     * Returns a list of active employees on an account.
     *
     * @param mpGroup group id
     * @returns list of active employees on an account
     */
    getActiveMembers(mpGroup: number): Observable<MemberListItem[]> {
        return this.memberService.searchMembers({ payload: mpGroup }).pipe(
            map((membersResponse) => membersResponse.content?.filter((member) => member.status === MemberListItemStatus.ACTIVE)),
            catchError((membersResponse) => of([])),
        );
    }
}
