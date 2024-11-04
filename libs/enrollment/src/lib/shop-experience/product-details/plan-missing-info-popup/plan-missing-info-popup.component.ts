import { LanguageService } from "@empowered/language";
import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormGroup, Validators, FormBuilder, FormControl } from "@angular/forms";
import { AddressVerificationComponent } from "@empowered/ui";
import { EmpoweredModalService } from "@empowered/common-services";
import { Subscription, Observable, BehaviorSubject, Subject, of, forkJoin } from "rxjs";
import { StaticService, MemberService } from "@empowered/api";
import { tap, switchMap, catchError } from "rxjs/operators";
import {
    ADDRESS_OPTIONS,
    ClientErrorResponseCode,
    ServerErrorResponseCode,
    Address,
    VerifiedAddress,
    PersonalAddress,
    ContactType,
    MemberContact,
} from "@empowered/constants";
import { filterNullValues } from "@empowered/ngxs-store";

interface DialogData {
    memberId: number;
    mpGroup: string;
    productName: string;
}

const WORK_STATE = "workState";
const WORK_ZIP = "workZip";
const SUGGESTED_ADDRESS = "suggestedAddress";
const ADDRESS_BOTH_OPTION = "bothOption";
@Component({
    selector: "empowered-plan-missing-info-popup",
    templateUrl: "./plan-missing-info-popup.component.html",
    styleUrls: ["./plan-missing-info-popup.component.scss"],
})
export class PlanMissingInfoPopupComponent implements OnInit {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.members.planMissing.header",
        "primary.portal.common.save",
        "primary.portal.members.planMissing.floorOrSuite",
        "primary.portal.members.planMissing.workStreetAddress",
        "primary.portal.members.planMissing.workStreetAddressOptional",
        "primary.portal.members.planMissing.description",
        "primary.portal.members.planMissing.workState",
        "primary.portal.members.planMissing.workZip",
    ]);
    employeeStates = [];
    form: FormGroup;
    private readonly stateControlValueSubject$: BehaviorSubject<string> = new BehaviorSubject("");
    readonly stateControlValue$: Observable<string> = this.stateControlValueSubject$.asObservable();
    private readonly unsubscribe$ = new Subject<void>();
    address1: string;
    address2: string;
    workState: string;
    workZip: string;
    tempMemberAddress: PersonalAddress;
    subscriptions: Subscription[] = [];
    addressMessage: string[] = [];
    addressResp: boolean;
    showSpinner: boolean;
    suggestedAddress: Address;
    isAddressValidationFailed: boolean;
    memberContact: MemberContact;

    constructor(
        private readonly dialogRef: MatDialogRef<PlanMissingInfoPopupComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        private readonly fb: FormBuilder,
        private readonly staticService: StaticService,
        private readonly language: LanguageService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly memberService: MemberService,
    ) {}

    /**
     * method to close or cancel popup
     * @returns void
     */
    onCancelClick(): void {
        this.dialogRef.close();
    }

    /**
     * Life cycle hook to initialize the component
     */
    ngOnInit(): void {
        this.form = this.fb.group({
            address1: this.fb.control("", Validators.required),
            address2: this.fb.control(""),
            workState: this.fb.control("", Validators.required),
            workZip: this.fb.control("", Validators.required),
        });
        this.getConfig();
        this.getEmployeeState();
    }

    /**
     * method to get employee state
     * @returns void
     */
    getEmployeeState(): void {
        this.subscriptions.push(
            this.staticService.getStates().subscribe((states) => {
                this.employeeStates = states;
            }),
        );
    }

    /**
     * Retrieve form configurations and apply changes accordingly
     * @returns void
     */
    getConfig(): void {
        this.form.addControl(WORK_STATE, new FormControl());
        this.subscriptions.push(
            this.form.controls.workState.valueChanges.pipe(tap((value: string) => this.stateControlValueSubject$.next(value))).subscribe(),
        );
        this.form.addControl(WORK_ZIP, new FormControl());
        this.checkWorkStateAndZip();
    }

    /**
     * Check validations for address state and zip
     * @returns void
     */
    checkWorkStateAndZip(): void {
        this.form.controls.address1.setValidators(Validators.required);
        this.form.controls.workState.setValidators([Validators.required]);
        this.form.controls.workZip.setValidators(Validators.required);
    }

    /**
     * Function to populate member profile object
     * @returns MemberContact object with address property
     */
    populateMemberProfileObject(): MemberContact {
        const addressObject: Address = {
            address1: this.form.controls["address1"].value,
            address2: this.form.controls["address2"].value,
            state: this.form.controls["workState"].value,
            zip: this.form.controls["workZip"].value,
        };
        return {
            address: addressObject,
        };
    }

    /**
     * Function invokes on submit to update the contact details
     * @return void
     */
    onSubmit(): void {
        this.showSpinner = true;
        this.checkWorkStateAndZip();
        this.tempMemberAddress = {
            address1: this.form.controls.address1.value,
            address2: this.form.controls.address2.value,
            state: this.form.controls.workState.value,
            zip: this.form.controls.workZip.value,
        };
        if (this.form.invalid) {
            this.showSpinner = false;
            return;
        }
        if (this.form.valid) {
            this.subscriptions.push(
                this.verifyAddressDetails(this.tempMemberAddress).subscribe((verifiedData) => {
                    this.showSpinner = false;
                    if (verifiedData) {
                        this.closePopup(verifiedData[0].ok);
                    }
                }),
            );
        }
    }

    /**
     * This method will update the verified address .
     * @param tempMemberAddress  user provided address.
     * @returns Observable of boolean or VerifiedAddress or set of boolean and string
     */
    verifyAddressDetails(
        tempMemberAddress: PersonalAddress,
    ): Observable<boolean | VerifiedAddress | { isVerifyAddress: boolean; selectedAddress: string }> {
        this.addressMessage = [];
        return this.memberService.verifyMemberAddress(tempMemberAddress).pipe(
            tap((resp) => {
                this.addressResp = false;
                this.showSpinner = false;
                this.suggestedAddress = resp.suggestedAddress;
                this.isAddressValidationFailed = false;
            }),
            switchMap((resp) => {
                if (resp.matched) {
                    this.nextAfterVerifyAddress();
                }
                return this.openModal(ADDRESS_BOTH_OPTION);
            }),
            catchError((error) => {
                this.addressResp = true;
                this.showSpinner = false;
                if (error.status === ClientErrorResponseCode.RESP_400) {
                    this.isAddressValidationFailed = false;
                    if (error.error && error.error.details.length > 0) {
                        error.error.details.map((item) => this.addressMessage.push(item.message));
                    } else {
                        this.addressMessage.push(
                            this.language.fetchSecondaryLanguageValue("secondary.portal.directAccount.invalidAdressdata"),
                        );
                    }
                } else if (error.status === ServerErrorResponseCode.RESP_500) {
                    this.addressMessage.push(
                        this.language.fetchSecondaryLanguageValue("secondary.portal.accountPendingEnrollments.internalServer"),
                    );
                } else {
                    this.addressMessage.push(
                        this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`),
                    );
                }
                return this.openModal(ADDRESS_OPTIONS.SINGLE, error.status);
            }),
        );
    }

    /**
     * This method will open the address-verify modal.
     * @param option type of modal
     * @param errorStatus API error status
     * @returns Observable of boolean or set of boolean and string according to closed confirm address dialog response
     */
    openModal(option: string, errorStatus?: number): Observable<boolean | { isVerifyAddress: boolean; selectedAddress: string }> {
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
                    if (elementData.data.selectedAddress === SUGGESTED_ADDRESS) {
                        const splitZip = this.suggestedAddress.zip.split("-");
                        const extValue = splitZip[1];
                        this.suggestedAddress.zip = splitZip[0];
                        this.form.patchValue(this.suggestedAddress);
                        if (extValue) {
                            this.form.controls.ext.patchValue(extValue);
                        }
                    }
                    return this.nextAfterVerifyAddress();
                }
                return of(false);
            }),
        );
    }

    /**
     * This function will be called when a next action is triggered in address verification modal
     * @param {{ isVerifyAddress: boolean; selectedAddress: string }} [modalData]
     * @param {VerifiedAddress} [resp]
     * @returns {Observable<{ isVerifyAddress: boolean; selectedAddress: string }>}
     */
    nextAfterVerifyAddress(
        modalData?: { isVerifyAddress: boolean; selectedAddress: string },
        resp?: VerifiedAddress,
    ): Observable<{ isVerifyAddress: boolean; selectedAddress: string }> {
        const validateStateZip$ = this.staticService.validateStateZip(this.form.controls.workState.value, this.form.controls.workZip.value);
        const memberProfileObj = this.populateMemberProfileObject();
        const saveMemberContact$ = this.memberService
            .saveMemberContact(this.data.memberId, ContactType.WORK, memberProfileObj, this.data.mpGroup)
            .pipe(catchError((_err) => of(undefined)));
        return forkJoin([validateStateZip$, saveMemberContact$]).pipe(
            filterNullValues(),
            tap(([_stateValidityResponse, saveMemberResponse]) => {
                this.showSpinner = false;
            }),
            catchError((err) => {
                this.showSpinner = false;
                this.form.get("workZip").setErrors({ pattern: true });
                return of(err);
            }),
        );
    }

    /**
     * function to close the popup
     * @returns void
     */
    closePopup(isUpdated: boolean): void {
        this.dialogRef.close({
            data: { isUpdated: isUpdated },
        });
    }

    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy = () => {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    };
}
