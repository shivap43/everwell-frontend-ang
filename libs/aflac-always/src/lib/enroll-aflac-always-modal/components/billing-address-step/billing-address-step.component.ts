import { Component } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { LanguageService } from "@empowered/language";

export interface BillingAddressStepFormKeys {
    firstName: string;
    middleInitial: string;
    lastName: string;
    suffix: string;
    streetAddress1: string;
    streetAddress2: string;
    city: string;
    state: string;
    zip: string;
    sameAsApplicant: string;
}

export interface BillingAddressStepLanguageKeys {
    accountOwnerBilling: string;
    sameAsApplicant: string;
    firstName: string;
    middleInitial: string;
    lastName: string;
    suffix: string;
    streetAddress1: string;
    streetAddress2: string;
    city: string;
    state: string;
    zip: string;
}

@Component({
    selector: "empowered-billing-address-step",
    templateUrl: "./billing-address-step.component.html",
    styleUrls: ["./billing-address-step.component.scss"],
})
export class BillingAddressStepComponent {
    languageStrings: Record<string, string>;
    languageKeys: Record<keyof BillingAddressStepLanguageKeys, string>;
    formKeys: Record<keyof BillingAddressStepFormKeys, string>;
    formGroup: FormGroup;
    isReinstate = false;
    isAflacAlwaysQuasiModal = true;

    constructor(private readonly language: LanguageService) {
        this.formKeys = this.buildFormKeys();
        this.languageKeys = this.buildLanguageKeys();
        this.languageStrings = this.buildLanguageStrings();
        this.formGroup = this.buildBillingAddressForm();

        this.languageStrings[this.languageKeys.accountOwnerBilling] = "Account owner's billing address";
        this.languageStrings[this.languageKeys.sameAsApplicant] = "Same as applicant";
        this.languageStrings[this.languageKeys.firstName] = "First name";
        this.languageStrings[this.languageKeys.middleInitial] = "Middle initial";
        this.languageStrings[this.languageKeys.lastName] = "Last name";
        this.languageStrings[this.languageKeys.suffix] = "Suffix";
        this.languageStrings[this.languageKeys.streetAddress1] = "Street address 1";
        this.languageStrings[this.languageKeys.streetAddress2] = "Street address 2";
        this.languageStrings[this.languageKeys.city] = "City";
        this.languageStrings[this.languageKeys.state] = "State";
        this.languageStrings[this.languageKeys.zip] = "Zip";
    }

    /**
     * @description Builds the billing address form
     * @returns FormGroup
     * @memberof BillingAddressStepComponent
     * @private
     */
    private buildBillingAddressForm(): FormGroup {
        return new FormGroup({
            [this.formKeys.firstName]: new FormControl(""),
            [this.formKeys.middleInitial]: new FormControl(""),
            [this.formKeys.lastName]: new FormControl(""),
            [this.formKeys.suffix]: new FormControl(""),
            [this.formKeys.streetAddress1]: new FormControl(""),
            [this.formKeys.streetAddress2]: new FormControl(""),
            [this.formKeys.city]: new FormControl(""),
            [this.formKeys.state]: new FormControl(""),
            [this.formKeys.zip]: new FormControl(""),
            [this.formKeys.sameAsApplicant]: new FormControl(false),
        });
    }

    /**
     * @description Builds the form keys
     * @returns EnrollAflacAlwaysModalFormKeys
     * @memberof BillingAddressStepComponent
     * @private
     */
    private buildFormKeys(): Record<keyof BillingAddressStepFormKeys, string> {
        return {
            firstName: "firstName",
            middleInitial: "middleInitial",
            lastName: "lastName",
            suffix: "suffix",
            streetAddress1: "streetAddress1",
            streetAddress2: "streetAddress2",
            city: "city",
            state: "state",
            zip: "zip",
            sameAsApplicant: "sameAsApplicant",
        };
    }

    /**
     * @description Builds the language keys
     * @returns Record<string, string>
     * @memberof BillingAddressStepComponent
     * @private
     */
    private buildLanguageKeys(): Record<keyof BillingAddressStepLanguageKeys, string> {
        return {
            accountOwnerBilling: "primary.portal.aflac.always.modal.body.billing.address.accountOwnerBilling",
            sameAsApplicant: "primary.portal.aflac.always.modal.body.billing.address.sameAsApplicant",
            firstName: "primary.portal.aflac.always.modal.body.billing.address.firstName",
            middleInitial: "primary.portal.aflac.always.modal.body.billing.address.middleInitial",
            lastName: "primary.portal.aflac.always.modal.body.billing.address.lastName",
            suffix: "primary.portal.aflac.always.modal.body.billing.address.suffix",
            streetAddress1: "primary.portal.aflac.always.modal.body.billing.address.streetAddress1",
            streetAddress2: "primary.portal.aflac.always.modal.body.billing.address.streetAddress2",
            city: "primary.portal.aflac.always.modal.body.billing.address.city",
            state: "primary.portal.aflac.always.modal.body.billing.address.state",
            zip: "primary.portal.aflac.always.modal.body.billing.address.zip",
        };
    }

    /**
     * @description Builds the language strings
     * @returns Record<string, string>
     * @memberof BillingAddressStepComponent
     * @private
     */
    private buildLanguageStrings(): Record<string, string> {
        return this.language.fetchPrimaryLanguageValues([
            this.languageKeys.accountOwnerBilling,
            this.languageKeys.sameAsApplicant,
            this.languageKeys.firstName,
            this.languageKeys.middleInitial,
            this.languageKeys.lastName,
            this.languageKeys.suffix,
            this.languageKeys.streetAddress1,
            this.languageKeys.streetAddress2,
            this.languageKeys.city,
            this.languageKeys.state,
            this.languageKeys.zip,
        ]);
    }
}
