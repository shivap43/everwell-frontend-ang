import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";

export interface AddNewAccountModalLanguageKeys {
    cancel: string;
    clear: string;
    save: string;
    close: string;
    accountType: string;
    accountHolderName: string;
    accountNumber: string;
    confirmAccountNumber: string;
    routingNumber: string;
    bankName: string;
    addNewAccount: string;
    allFieldsAreRequired: string;
}

export interface AddNewAccountFormControls {
    accountType: string;
    accountHolderName: string;
    accountNumber: string;
    confirmAccountNumber: string;
    routingNumber: string;
}

@Component({
    selector: "empowered-add-new-account-modal",
    templateUrl: "./add-new-account-modal.component.html",
    styleUrls: ["./add-new-account-modal.component.scss"],
})
export class AddNewAccountModalComponent implements OnInit {
    formGroup: FormGroup;
    bankName: string;
    formKeys: Record<keyof AddNewAccountFormControls, string>;
    languageKeys: Record<keyof AddNewAccountModalLanguageKeys, string>;
    languageStrings: Record<string, string>;

    constructor(private readonly dialogRef: MatDialogRef<AddNewAccountModalComponent>, private readonly language: LanguageService) {
        this.languageKeys = this.buildLanguageKeys();
        this.languageStrings = this.buildLanguageStrings();
        this.formKeys = this.buildFormKeys();

        this.languageStrings[this.languageKeys.addNewAccount] = "Add new account";
        this.languageStrings[this.languageKeys.allFieldsAreRequired] = "All fields are required";
        this.languageStrings[this.languageKeys.accountType] = "Account type";
        this.languageStrings[this.languageKeys.accountHolderName] = "Account holder name";
        this.languageStrings[this.languageKeys.accountNumber] = "Account number";
        this.languageStrings[this.languageKeys.confirmAccountNumber] = "Confirm account number";
        this.languageStrings[this.languageKeys.routingNumber] = "Routing number";
        this.languageStrings[this.languageKeys.bankName] = "Bank name";
    }

    /**
     * @description Initializes the component
     * @returns void
     * @memberof AddNewAccountModalComponent
     */
    ngOnInit(): void {
        this.formGroup = this.buildFormGroup();
    }

    /**
     * @description Closes the modal
     * @returns void
     * @memberof AddNewAccountModalComponent
     */
    onCancel() {
        this.dialogRef.close();
    }

    /**
     * @description Saves the form
     * @returns void
     * @memberof AddNewAccountModalComponent
     */
    onSave() {
        throw new Error("Not implemented yet.");
    }

    /**
     * @description Clears the form
     * @returns void
     * @memberof AddNewAccountModalComponent
     */
    onClear(): void {
        this.formGroup.reset();
    }

    /**
     * @description Builds the form group
     * @returns FormGroup
     * @memberof AddNewAccountModalComponent
     */
    private buildFormGroup(): FormGroup {
        return new FormGroup({
            [this.formKeys.accountType]: new FormControl(),
            [this.formKeys.accountNumber]: new FormControl(),
            [this.formKeys.confirmAccountNumber]: new FormControl(),
            [this.formKeys.accountHolderName]: new FormControl(),
            [this.formKeys.routingNumber]: new FormControl(),
        });
    }

    /**
     * @description Builds the form keys
     * @returns AddNewAccountFormControls
     * @memberof AddNewAccountModalComponent
     */
    private buildFormKeys(): AddNewAccountFormControls {
        return {
            accountType: "accountType",
            accountNumber: "accountNumber",
            confirmAccountNumber: "confirmAccountNumber",
            accountHolderName: "accountHolderName",
            routingNumber: "routingNumber",
        };
    }

    /**
     * @description Builds the language keys
     * @returns Record<keyof AddNewAccountModalLanguageKeys, string>
     * @memberof AddNewAccountModalComponent
     */
    private buildLanguageKeys(): Record<keyof AddNewAccountModalLanguageKeys, string> {
        return {
            cancel: "primary.portal.common.cancel",
            clear: "primary.portal.common.clear",
            save: "primary.portal.common.save",
            close: "primary.portal.common.close",
            accountType: "primary.portal.account.accountType",
            accountHolderName: "primary.portal.account.accountHolderName",
            accountNumber: "primary.portal.account.accountNumber",
            confirmAccountNumber: "primary.portal.account.confirmAccountNumber",
            routingNumber: "primary.portal.account.routingNumber",
            bankName: "primary.portal.account.bankName",
            addNewAccount: "primary.portal.account.addNewAccount",
            allFieldsAreRequired: "primary.portal.account.allFieldsAreRequired",
        };
    }

    /**
     * @description Builds the language strings
     * @returns Record<string, string>
     * @memberof AddNewAccountModalComponent
     */
    private buildLanguageStrings(): Record<string, string> {
        return this.language.fetchPrimaryLanguageValues([
            this.languageKeys.cancel,
            this.languageKeys.clear,
            this.languageKeys.save,
            this.languageKeys.close,
            this.languageKeys.accountType,
            this.languageKeys.accountHolderName,
            this.languageKeys.accountNumber,
            this.languageKeys.confirmAccountNumber,
            this.languageKeys.routingNumber,
            this.languageKeys.bankName,
            this.languageKeys.addNewAccount,
            this.languageKeys.allFieldsAreRequired,
        ]);
    }
}
