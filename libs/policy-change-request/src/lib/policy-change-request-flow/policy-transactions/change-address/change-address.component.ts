import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import {
    PolicyChangeRequestCancelPopupComponent,
    PolicyChangeRequestConfirmationPopupComponent,
    AddressVerificationComponent,
} from "@empowered/ui";
import { StaticService, PolicyTransactionForms, FindPolicyholderModel, MemberService } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { Observable, Subscription, of } from "rxjs";
import { LanguageService } from "@empowered/language";
import { PolicyChangeRequestState, SetAddressChangeRequest, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { SideNavService } from "./../../side-nav/services/side-nav.service";
import { PolicyChangeRequestComponent } from "../../../policy-change-request.component";
import { switchMap, tap, catchError } from "rxjs/operators";
import {
    ADDRESS_OPTIONS,
    PhoneNumber,
    PolicyChangeRequestList,
    AppSettings,
    Address,
    PersonalAddress,
    CountryState,
} from "@empowered/constants";
import { EmpoweredModalService } from "@empowered/common-services";

@Component({
    selector: "empowered-change-address",
    templateUrl: "./change-address.component.html",
    styleUrls: ["./change-address.component.scss"],
})
export class ChangeAddressComponent implements OnInit, OnDestroy {
    changeAddressForm: FormGroup;
    states$: Observable<CountryState[]>;
    validationRegex: any;
    showSpinner: boolean;
    subscriptions: Subscription[] = [];
    addressChangeRequestInitialData: any;
    maxLength = 10;
    addressResp: boolean;
    addressMessage: string[] = [];
    suggestedAddress: Address;
    tempMemberAddress: PersonalAddress;
    readonly PHONE_NUMBER_MAX_LENGTH = PhoneNumber.MAX_LENGTH;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.policyChangeRequest.transactions.changeAddress.header",
        "primary.portal.policyChangeRequest.transactions.cancel",
        "primary.portal.policyChangeRequest.transactions.continue",
        "primary.portal.policyChangeRequest.transactions.back",
        "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
        "primary.portal.dashboard.policyChangeRequestFlow.nextStep",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessage",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved",
        "primary.portal.policyChangeRequest.transactions.changeAddress.streetAddress",
        "primary.portal.policyChangeRequest.transactions.changeAddress.streetAddress2",
        "primary.portal.policyChangeRequest.transactions.changeAddress.city",
        "primary.portal.policyChangeRequest.transactions.changeAddress.zip",
        "primary.portal.policyChangeRequest.transactions.changeAddress.ext",
        "primary.portal.policyChangeRequest.transactions.changeAddress.phone",
        "primary.portal.common.next",
    ]);
    readonly IS_OVERALL_ADDRESS_VERIFICATION = "general.feature.enable.aflac.api.address_validation";
    isOverallAddressVerification: boolean;
    isAddressValidationFailed = true;

    @Select(SharedState.regex) regex$: Observable<any>;
    @Select(PolicyChangeRequestState.GetmemberInfo) memberInfo$: Observable<FindPolicyholderModel>;
    @Select(PolicyChangeRequestState.GetChangeAddressRequest) addressRequest$: Observable<any>;

    constructor(
        private readonly fb: FormBuilder,
        private readonly dialog: MatDialog,
        private readonly store: Store,
        private readonly languageService: LanguageService,
        private readonly staticService: StaticService,
        private readonly sideNavService: SideNavService,
        private readonly memberService: MemberService,
        private readonly empoweredModalService: EmpoweredModalService,
        private cancelDialogRef: MatDialogRef<PolicyChangeRequestCancelPopupComponent>,
        private readonly PCRDialogRef: MatDialogRef<PolicyChangeRequestComponent>,
        private readonly staticUtilService: StaticUtilService,
    ) {
        this.subscriptions.push(
            this.regex$.subscribe((data) => {
                if (data) {
                    this.validationRegex = data;
                }
            }),
        );
    }

    ngOnInit(): void {
        this.states$ = this.staticService.getStates();
        this.createFormControl();
        this.addressChangeRequestInitialData = { ...this.changeAddressForm.value };

        this.subscriptions.push(
            this.addressRequest$.subscribe((addressRequest) => {
                if (addressRequest) {
                    this.addressChangeRequestInitialData = {
                        ...this.store.selectSnapshot(PolicyChangeRequestState.GetInitialAddressData),
                    };
                    this.changeAddressForm.patchValue(addressRequest);
                    this.showSpinner = false;
                } else {
                    this.getData();
                }
            }),
        );
        this.subscriptions.push(
            this.staticUtilService.cacheConfigValue(this.IS_OVERALL_ADDRESS_VERIFICATION).subscribe((result) => {
                this.isOverallAddressVerification = result && result.toLowerCase() === AppSettings.TRUE.toLowerCase();
            }),
        );
    }

    getData(): void {
        this.subscriptions.push(
            this.memberInfo$.subscribe((memberInfo) => {
                if (memberInfo && memberInfo.memberAddress) {
                    const splitZip = memberInfo.memberAddress.zip.split("-");
                    this.changeAddressForm.patchValue({
                        address1: memberInfo.memberAddress.address1,
                        address2: memberInfo.memberAddress.address2,
                        city: memberInfo.memberAddress.city,
                        state: memberInfo.memberAddress.state,
                        zip: splitZip[0],
                        ext: splitZip[1] ? splitZip[1] : "",
                    });
                    this.addressChangeRequestInitialData = {
                        ...this.changeAddressForm.value,
                    };
                }
            }),
        );
    }

    /**
     * Create form control
     */
    createFormControl(): void {
        this.changeAddressForm = this.fb.group({
            address1: [
                "",
                Validators.compose([
                    Validators.required,
                    Validators.maxLength(100),
                    Validators.pattern(new RegExp(this.validationRegex.ADDRESS)),
                ]),
            ],
            address2: ["", Validators.compose([Validators.maxLength(100), Validators.pattern(new RegExp(this.validationRegex.ADDRESS))])],
            city: [
                "",
                Validators.compose([
                    Validators.required,
                    Validators.maxLength(100),
                    Validators.pattern(new RegExp(this.validationRegex.ADDRESS)),
                ]),
            ],
            state: ["", Validators.required],
            zip: ["", Validators.compose([Validators.required, Validators.pattern(new RegExp(this.validationRegex.ZIP_CODE))])],
            ext: ["", Validators.compose([Validators.pattern(new RegExp(this.validationRegex.NUMERIC))])],
            phoneNumber: ["", Validators.compose([Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE))])],
            type: Object.keys(PolicyTransactionForms)[0],
        });
    }

    /**
     * Get form controls
     */
    get formControl(): unknown {
        return this.changeAddressForm.controls;
    }

    /**
     * Submit change address request
     */
    ChangeAddress(): void {
        if (!this.changeAddressForm.dirty && !this.store.selectSnapshot(PolicyChangeRequestState.GetChangeAddressRequest)) {
            this.openConfirmationPopup();
        } else {
            this.validateAllFormFields(this.changeAddressForm);
            this.validateAddressRequest();
        }
    }
    /**
     * Validate all fiels on form submit
     */
    validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field);
            if (control["controls"]) {
                for (const subField in control["controls"]) {
                    if (subField) {
                        control["controls"][subField].markAsTouched({ onlySelf: true });
                    }
                }
            } else {
                control.markAsTouched({ onlySelf: true });
            }
        });
    }
    /**
     * function to validate provided address
     */
    validateAddressRequest(): void {
        if (this.changeAddressForm.valid) {
            this.showSpinner = true;
            this.tempMemberAddress = {
                address1: this.changeAddressForm.controls.address1.value,
                address2: this.changeAddressForm.controls.address2.value,
                city: this.changeAddressForm.controls.city.value,
                state: this.changeAddressForm.controls.state.value,
                zip: this.changeAddressForm.controls.ext.value
                    ? `${this.changeAddressForm.controls.zip.value}-${this.changeAddressForm.controls.ext.value}`
                    : this.changeAddressForm.controls.zip.value,
            };
            if (this.isOverallAddressVerification) {
                this.verifyAdressDetails(this.tempMemberAddress);
            } else {
                this.nextAfterVerifyAdress();
            }
        }
    }

    /**
     * This method will update the verified address .
     * @param tempMemberAddress  user provided address.
     * @returns void
     */
    verifyAdressDetails(tempMemberAddress: PersonalAddress): void {
        this.addressMessage = [];
        this.subscriptions.push(
            this.memberService
                .verifyMemberAddress(tempMemberAddress)
                .pipe(
                    tap((resp) => {
                        this.addressResp = false;
                        this.showSpinner = false;
                        this.suggestedAddress = resp.suggestedAddress;
                        this.isAddressValidationFailed = false;
                    }),
                    switchMap((resp) => {
                        if (resp.matched) {
                            this.nextAfterVerifyAdress();
                            return of(true);
                        }
                        return this.openModal(AppSettings.ADDRESS_BOTH_OPTION).pipe(tap((res) => of(res)));
                    }),
                    catchError((error) => {
                        this.addressResp = true;
                        this.showSpinner = false;
                        if (error.status === AppSettings.API_RESP_400) {
                            this.isAddressValidationFailed = false;
                            if (error.error && error.error.details.length > 0) {
                                error.error.details.map((item) => this.addressMessage.push(item.message));
                            } else {
                                this.addressMessage.push(
                                    this.languageService.fetchSecondaryLanguageValue("secondary.portal.directAccount.invalidAdressdata"),
                                );
                            }
                        } else {
                            this.addressMessage.push(
                                this.languageService.fetchSecondaryLanguageValue(
                                    "secondary.api." + error.error.status + "." + error.error.code,
                                ),
                            );
                        }
                        return this.openModal(ADDRESS_OPTIONS.SINGLE, error.status).pipe(tap((res) => of(res)));
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * This method will open the address-verify modal.
     * @param option type of modal
     * @param errorStatus API error status
     * @returns Observable of boolean according to closed confirm address dialog response
     */
    openModal(option: string, errorStatus?: number): Observable<boolean> {
        const addressDialog = this.empoweredModalService.openDialog(AddressVerificationComponent, {
            data: {
                suggestedAddress: this.suggestedAddress,
                providedAddress: this.tempMemberAddress,
                addressResp: this.addressResp,
                addressMessage: this.addressMessage,
                option: option,
                errorStatus: errorStatus,
            },
        });
        return addressDialog.afterClosed().pipe(
            switchMap((elementData) => {
                if (elementData && elementData.data.isVerifyAddress) {
                    if (elementData.data.selectedAddress === AppSettings.SUGGESTED_ADDRESS) {
                        const splitZip = this.suggestedAddress.zip.split("-");
                        const extValue = splitZip[1];
                        this.suggestedAddress.zip = splitZip[0];
                        this.changeAddressForm.patchValue(this.suggestedAddress);
                        if (extValue) {
                            this.changeAddressForm.controls.ext.patchValue(extValue);
                        }
                    }
                    this.nextAfterVerifyAdress();
                    return of(true);
                }
                this.closeModal();
                return of(false);
            }),
        );
    }
    /**
     * This method will close address-verify modal.
     */
    closeModal(): void {
        this.addressResp = false;
    }
    /**
     * This method will be trigger when user will click on next in verify address popup.
     * @returns void
     */
    nextAfterVerifyAdress(): void {
        this.changeAddressForm.value["type"] = Object.keys(PolicyTransactionForms)[0];
        this.changeAddressForm.value["addressValidationFailed"] = this.isAddressValidationFailed;
        this.store.dispatch(new SetAddressChangeRequest(this.changeAddressForm.value, this.addressChangeRequestInitialData));
        this.sideNavService.onNextClick(1);
    }

    /**
     * Show policy change confirmation popup
     */
    openConfirmationPopup(): void {
        const dialogRef = this.dialog.open(PolicyChangeRequestConfirmationPopupComponent, {
            width: "667px",
            data: {
                cancelButton: this.languageStrings["primary.portal.policyChangeRequest.transactions.cancel"],
                continueButton: this.languageStrings["primary.portal.policyChangeRequest.transactions.continue"],
                requestType: this.languageStrings["primary.portal.policyChangeRequest.transactions.changeAddress.header"],
            },
        });
        this.subscriptions.push(
            dialogRef.afterClosed().subscribe((result) => {
                if (result === AppSettings.CONTINUE) {
                    this.sideNavService.onNextClick(1);
                } else {
                    dialogRef.close();
                }
            }),
        );
    }

    cancel(): void {
        this.cancelDialogRef = this.dialog.open(PolicyChangeRequestCancelPopupComponent, {
            width: "667px",
            data: {
                cancelModalDisplayType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.pcrFlow"],
                cancelButton: this.languageStrings["primary.portal.common.cancel"],
                backButton: this.languageStrings["primary.portal.common.back"],
                requestType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.cancelMessage"],
                description: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved"],
            },
        });
        this.subscriptions.push(
            this.cancelDialogRef.afterClosed().subscribe((result) => {
                if (result === AppSettings.CANCEL) {
                    this.sideNavService.removeTransactionScreenFromStore(true);
                    this.store.dispatch(new SetAddressChangeRequest(null, null));
                    this.PCRDialogRef.close(PolicyChangeRequestList.cancel);
                }
            }),
        );
    }

    back(): void {
        this.sideNavService.onBackClick();
    }

    /**
     * Function to validate Zip code
     */
    validateZipCode(): void {
        if (this.formControl["zip"].dirty && this.formControl["zip"].value && this.formControl["state"].value) {
            this.showSpinner = true;
            this.subscriptions.push(
                this.staticService.validateStateZip(this.formControl["state"].value, this.formControl["zip"].value).subscribe(
                    (resp) => {
                        this.showSpinner = false;
                        this.formControl["zip"].setErrors(null);
                        this.formControl["state"].setErrors(null);
                    },
                    (error) => {
                        this.showSpinner = false;
                        this.formControl["zip"].setErrors({ zipValid: true });
                        this.formControl["state"].setErrors({
                            zipValid: true,
                        });
                    },
                ),
            );
        }
    }
    /**
     * This method will unsubscribe all the api subscriptions.
     */
    ngOnDestroy(): void {
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}
