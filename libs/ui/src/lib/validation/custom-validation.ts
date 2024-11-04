import { AbstractControl } from "@angular/forms";
import { ValidatorFn } from "@angular/forms";
import { Select } from "@ngxs/store";
import { SharedState } from "@empowered/ngxs-store";
import { Observable } from "rxjs";
import { AppSettings } from "@empowered/constants";
import { Injectable } from "@angular/core";

// Fix Me MON-11837
// Do not use any both in params and return type and handle it with switch in a single method

// https://bitbucket.empoweredbenefits.com/bitbucket/projects/MON/repos/portals/pull-requests/214/overview

let REGEXP: any;
const UTF_LAST_CHAR_CODE = 127;
@Injectable({ providedIn: "root" })
export class CustomValidation {
    @Select(SharedState.regex) regex$: Observable<any>;

    constructor() {
        this.regex$.subscribe((regexCollection) => (REGEXP = regexCollection));
    }
    static zipCodeValidator(zip: any): any {
        if (zip.pristine) {
            return null;
        }
        const ZIP_REGEXP = new RegExp(REGEXP.ZIP_CODE);
        if (ZIP_REGEXP.test(zip.value) || zip.value === "") {
            return null;
        }
        return {
            invalidZip: true,
        };
    }

    static checkPhoneValidation(phoneNumber: any): any {
        if (phoneNumber.pristine) {
            return null;
        }
        const PHONE_REGEXP = new RegExp(REGEXP.VALID_PHONE);
        if (PHONE_REGEXP.test(phoneNumber.value) || phoneNumber.value === "") {
            return null;
        }
        return {
            invalidPhone: true,
        };
    }

    static checkEmailValidation(email: any): any {
        if (email.pristine) {
            return null;
        }
        const EMAIL_REGEXP = new RegExp(REGEXP.EMAIL);
        if (EMAIL_REGEXP.test(email.value) || email.value === "") {
            return null;
        }
        return {
            invalidEmail: true,
        };
    }

    /**
     * Validation for card name field
     * @param control formGroup
     * @returns object based on validation
     */
    static checkNameValidation(control: AbstractControl): { [key: string]: any } | null {
        const cardHolderName = control?.value;
        const NAME_REGEXP = new RegExp(REGEXP.NAME_SPECIAL_CHARACTERS_NOT_ALLOWED);
        if (cardHolderName && !cardHolderName.includes(" ")) {
            return { invalid: true, noLastName: true };
        }
        if (CustomValidation.checkNameForInvalidFirstOrLastCharacter(cardHolderName)) {
            return { invalid: true, invalidFirstCharacter: true };
        }
        if (cardHolderName && !NAME_REGEXP.test(cardHolderName)) {
            return { invalid: true, containsInvalidCharacter: true };
        }
        return null;
    }

    static checkAddressValidation(address: any): any {
        if (address.pristine) {
            return null;
        }
        const ADDRESS_REGEXP = new RegExp(REGEXP.ADDRESS);
        if (ADDRESS_REGEXP.test(address.value) || address.value === "") {
            return null;
        }
        return {
            invalidAddress: true,
        };
    }

    static checkCompanyNameValidation(companyName: any): any {
        if (companyName.pristine) {
            return null;
        }
        const NAME_REGEXP = new RegExp(REGEXP.COMPANY_NAME);
        if (companyName.value.length < AppSettings.COMPANY_NAME_MIN_LENGTH) {
            return {
                invalidCompanyNameLength: true,
                requiredLength: AppSettings.COMPANY_NAME_MIN_LENGTH,
            };
        }
        if (NAME_REGEXP.test(companyName.value)) {
            return null;
        }
        return {
            invalidCompanyName: true,
        };
    }

    static checkCityValidation(city: any): any {
        if (city.pristine) {
            return null;
        }
        const CITY_REGEXP = new RegExp(REGEXP.CITY);
        if (CITY_REGEXP.test(city.value)) {
            return null;
        }
        return {
            invalidCity: true,
        };
    }
    // FIXME - Fetch regex from store.
    static ssnValidator = (control: AbstractControl): { [key: string]: any } | null => {
        if (control.value) {
            const SSN_REGEXP = new RegExp(REGEXP.SSN);
            return !SSN_REGEXP.test(control.value) && control.value !== "" ? { invalidSSN: { value: control.value } } : null;
        }
        return null;
    };
    static alphanumericValidator(spacesAllowed: boolean): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } | null => {
            if (control.value) {
                const ALPHANUMERIC_SPACES_REGEXP = spacesAllowed
                    ? new RegExp(REGEXP.ALPHANUMERIC_WITH_SPACES)
                    : new RegExp(REGEXP.ALPHANUMERIC);
                return !ALPHANUMERIC_SPACES_REGEXP.test(control.value) && control.value !== ""
                    ? { invalidAlphanumeric: { value: control.value, spacesAllowed: spacesAllowed } }
                    : null;
            }
            return null;
        };
    }
    static taxIDValidator = (control: AbstractControl): { [key: string]: any } | null => {
        if (control.value) {
            const TAXID_REGEXP = new RegExp(REGEXP.TAX_ID);
            return !TAXID_REGEXP.test(control.value) && control.value !== "" ? { invalidTaxID: { value: control.value } } : null;
        }
        return null;
    };
    static alphabeticalValidator(spacesAllowed: boolean): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } | null => {
            if (control.value) {
                const ALPHA_REGEXP = spacesAllowed ? new RegExp(REGEXP.ALPHA_SPACES) : new RegExp(REGEXP.ALPHA);
                return !ALPHA_REGEXP.test(control.value) && control.value !== ""
                    ? { invalidAlpha: { value: control.value, spacesAllowed: spacesAllowed } }
                    : null;
            }
            return null;
        };
    }
    static numericValidator = (control: AbstractControl): { [key: string]: any } | null => {
        if (control.value) {
            const NUM_REGEXP = new RegExp(REGEXP.NUMERIC);
            return !NUM_REGEXP.test(control.value) && control.value !== "" ? { invalidNum: { value: control.value } } : null;
        }
        return null;
    };
    static alphaHypensApostrophesSpaceValidator = (control: AbstractControl): { [key: string]: any } | null => {
        if (control.value) {
            const REGEX = new RegExp(REGEXP.ALPHA_HYPENS_APOSTROPHES_SPACE);
            return !REGEX.test(control.value) && control.value !== ""
                ? { invalidAlphaHypensApostrophesSpace: { value: control.value } }
                : null;
        }
        return null;
    };
    static alphaHypensApostrophesPeriodSpaceValidator = (control: AbstractControl): { [key: string]: any } | null => {
        if (control.value) {
            const REGEX = new RegExp(REGEXP.ALPHA_HYPENS_APOSTROPHES_PERIOD_SPACE);
            return !REGEX.test(control.value) && control.value !== ""
                ? { invalidAlphaHypensApostrophesPeriodSpace: { value: control.value } }
                : null;
        }
        return null;
    };

    static alphanumericHypensApostrophesSpaceValidator = (control: AbstractControl): { [key: string]: any } | null => {
        if (control.value) {
            const REGEX = new RegExp(REGEXP.ALPHANUMERIC_HYPENS_APOSTROPHES_SPACE);
            return !REGEX.test(control.value) && control.value !== ""
                ? { invalidAlphanumericHypensApostrophesSpace: { value: control.value } }
                : null;
        }
        return null;
    };

    /**
     * Validates a control by testing its value against the regEx for name
     * @param control form control
     * @returns null if the form control value is valid, an object with info about the error otherwise
     */
    static nameValidator = (control: AbstractControl): { invalidName: { value: string; startsWithInvalidCharacter: boolean } } | null => {
        const invalidAsFirstAndLastCharacter = ["'", "-"];
        return (
            control.value &&
            !new RegExp(REGEXP.NAME_WITH_SPACE_ALLOWED).test(control.value) && {
                invalidName: {
                    value: control.value,
                    startsWithInvalidCharacter: invalidAsFirstAndLastCharacter.some(
                        (character) => control.value.startsWith(character) || control.value.endsWith(character),
                    ),
                },
            }
        );
    };
    /**
     * Validates control by testing its value against the regEx for currency
     * @param control form control
     * @returns null if the form control value is valid, an object with info about the error otherwise
     */
    static currencyValidator = (control: AbstractControl): { invalidCurrency: { value: string } } | null =>
        control.value &&
        !new RegExp(REGEXP.CURRENCY_FORMAT_WITH_DOLLAR).test(control.value) && {
            invalidCurrency: {
                value: control.value,
            },
        };

    static duplicateNameValidator(namesList: string[]): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } | null => {
            if (control.value) {
                const forbidden = namesList.map((name) => name.toLowerCase().trim()).includes(control.value.toLowerCase().trim());
                return forbidden ? { duplicateName: { value: control.value } } : null;
            }
            return null;
        };
    }

    /**
     * Validates a control by testing its value against the regEx for account name.
     * @param control form control
     * @returns null if the form control value is valid, an object with info about the error otherwise
     */
    static nameWithHyphensAndApostrophes(
        control: AbstractControl,
    ): { invalidName: { value: string; startsWithInvalidCharacter: boolean } } | null {
        const invalidAsFirstAndLastCharacter = ["'", "-"];
        return (
            control.value &&
            !new RegExp(REGEXP.ACCOUNT_NAME).test(control.value) && {
                invalidName: {
                    value: control.value,
                    startsWithInvalidCharacter: invalidAsFirstAndLastCharacter.some(
                        (character) => control.value.startsWith(character) || control.value.endsWith(character),
                    ),
                },
            }
        );
    }

    /**
     * Validates a control by checking if the value contains only spaces or not UTF charcters.
     * @param control form control
     * @returns null if the form control value is valid, an object with info about the error otherwise
     */
    static checkIfNonUTFOrOnlyWhiteSpace = (control: AbstractControl): { invalidValue: { value: string; invalidChar: boolean } } | null => {
        if (
            control.value &&
            (control.value.trim() === "" || control.value.split("").some((element) => element.charCodeAt(0) > UTF_LAST_CHAR_CODE))
        ) {
            return {
                invalidValue: {
                    value: control.value,
                    invalidChar: true,
                },
            };
        }
        return null;
    };
    /**
     * Checks if name contains invalid first or last character
     * @param cardHolderName
     * @returns true if name has invalid first or last character
     */
    static checkNameForInvalidFirstOrLastCharacter(cardHolderName: string): boolean {
        return (
            cardHolderName &&
            (cardHolderName.startsWith("-") ||
                cardHolderName.startsWith("'") ||
                cardHolderName.startsWith("/") ||
                cardHolderName.startsWith(".") ||
                cardHolderName.endsWith("-") ||
                cardHolderName.endsWith("'") ||
                cardHolderName.endsWith("/") ||
                cardHolderName.endsWith("."))
        );
    }

    /**
     * Validates a control by testing its value against the regEx for account name.
     * @param control form control
     * @returns null if the form control value is valid, an object with info about the error otherwise
     */
    nameWithHyphensAndApostrophesValidator(
        control: AbstractControl,
    ): { invalidName: { value: string; startsWithInvalidCharacter: boolean } } | null {
        return CustomValidation.nameWithHyphensAndApostrophes(control);
    }
}
