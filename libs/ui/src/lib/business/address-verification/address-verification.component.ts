import { Subscription } from "rxjs";

import { Component, OnInit, Inject, ChangeDetectionStrategy } from "@angular/core";
import { Validators, FormGroup, FormBuilder, AbstractControl } from "@angular/forms";

import { LanguageService } from "@empowered/language";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { StaticService } from "@empowered/api";
import { finalize } from "rxjs/operators";
import { SharedService } from "@empowered/common-services";
import {
    ServerErrorResponseCode,
    ZIP_CODE_MAX_LENGTH,
    ZIP_CODE_MIN_LENGTH,
    AppSettings,
    Address,
    ZIP_CODE_NUM_ONLY_MAX_LENGTH,
} from "@empowered/constants";

/**
 * This function is used to validate state and zip code
 * @param state state abbreviation
 * @param zip zip code value
 * @param formControl zip form control
 * @param staticService static service.
 * @param sharedService shared service.
 * @returns Subscription
 */
export function validateStateAndZipCode(
    state: string,
    zip: string,
    formControl: AbstractControl,
    staticService: StaticService,
    sharedService: SharedService,
): Subscription {
    if (
        (zip.length === ZIP_CODE_MAX_LENGTH || zip.length === ZIP_CODE_NUM_ONLY_MAX_LENGTH || zip.length === ZIP_CODE_MIN_LENGTH) &&
        state !== ""
    ) {
        sharedService.setStateZipFlag(true);
        const subscription = staticService
            .validateStateZip(state, zip)
            .pipe(
                finalize(() => {
                    sharedService.setStateZipFlag(false);
                }),
            )
            .subscribe(
                (response) => {
                    if (response.status === AppSettings.API_RESP_204) {
                        formControl.setErrors(null);
                    }
                },
                (error) => {
                    if (error.status === AppSettings.API_RESP_400) {
                        formControl.setErrors({ zipMismatch: true });
                        formControl.markAsTouched();
                    }
                },
            );

        return subscription;
    }
    return Subscription.EMPTY;
}

/**
 * Component Metadata.
 */
@Component({
    selector: "empowered-address-verification",
    templateUrl: "./address-verification.component.html",
    styleUrls: ["./address-verification.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * This class is used for address verification by aflac system to provide both suggested and user provided address.
 */
export class AddressVerificationComponent implements OnInit {
    verifyAddressForm: FormGroup;
    bothOption = AppSettings.ADDRESS_BOTH_OPTION;
    errorStatus: boolean;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.direct.addCustomer.streetAddress1",
        "primary.portal.direct.addCustomer.streetAddress2",
        "primary.portal.direct.addCustomer.city",
        "primary.portal.direct.addCustomer.addCustomer",
        "primary.portal.direct.addCustomer.employerName",
        "primary.portal.direct.addCustomer.jobTitle",
        "primary.portal.direct.addCustomer.verifyAddress",
        "primary.portal.direct.addCustomer.verifyAddressMsg",
        "primary.portal.direct.addCustomer.suggestedAddress",
        "primary.portal.direct.addCustomer.providedAddress",
        "primary.portal.direct.addCustomer.planInfo",
        "primary.portal.direct.addCustomer.paper",
        "primary.portal.direct.addCustomer.electronic",
        "primary.portal.direct.addCustomer.sendTo",
        "primary.portal.direct.addCustomer.useSelectedAddress",
        "primary.portal.direct.addCustomer.continueWithoutChanges",
        "primary.portal.common.optional",
        "primary.portal.common.select",
        "primary.portal.common.close",
        "primary.portal.common.next",
        "primary.portal.common.back",
        "primary.portal.common.selectOption",
        "primary.portal.direct.addCustomer.warningTittle",
        "primary.portal.verifyAddress.serviceUnavailable.title",
        "primary.portal.verifyAddress.serviceUnavailable.description",
        "primary.portal.verifyAddress.serviceUnavailable.buttonText",
    ]);

    /**
     * @param fb  form builder object to create form group.
     * @param language  language service to call language strings.
     * @param dialogRef  reference to Matdialog component.
     * @param data  input data from the component which is using it.
     * @returns void
     */
    constructor(
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<AddressVerificationComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: AddressData,
    ) {}

    /**
     * Initialize component.
     * @returns void
     */
    ngOnInit(): void {
        this.initializeVerificationForm(
            this.data.option === AppSettings.ADDRESS_BOTH_OPTION ? AppSettings.SUGGESTED_ADDRESS : AppSettings.TEMPORARY_ADDRESS,
        );
        this.errorStatus = this.data.errorStatus === ServerErrorResponseCode.RESP_503;
    }

    /**
     * Initialize formGroup.
     * @returns void
     */
    initializeVerificationForm(option?: string): void {
        this.verifyAddressForm = this.fb.group({
            selectAddress: [option, Validators.required],
        });
    }

    /**
     * This method will close address-verify modal.
     * @returns void
     */
    close(): void {
        this.data.addressResp = false;
        this.dialogRef.close({
            data: { isVerifyAddress: false, selectedAddress: this.verifyAddressForm.value.selectAddress },
        });
    }

    /**
     * This method will trigger when user will click on next in verify address popup.
     * @returns void
     */
    afterVerifyAddress(): void {
        this.dialogRef.close({
            data: { isVerifyAddress: true, selectedAddress: this.verifyAddressForm.value.selectAddress },
        });
    }
}

/**
 * This interface is used for custom typing.
 */
export interface AddressData {
    suggestedAddress: Address;
    providedAddress: Address;
    addressResp: boolean;
    addressMessage: string;
    option: string;
    errorStatus?: number;
}
