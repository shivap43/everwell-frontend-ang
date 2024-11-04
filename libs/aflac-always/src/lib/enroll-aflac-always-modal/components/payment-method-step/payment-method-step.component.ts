import { Component, Input } from "@angular/core";
import { FormGroup } from "@angular/forms";

export interface PaymentMethodFormKeys {
    paymentMethod: string;
}

export interface PaymentMethodLanguageKeys {
    bankDraft: string;
    creditDebitCard: string;
    addAccount: string;
    authorizedSigner: string;
    paymentMethodHeader: string;
    eligiblePoliciesTable: string;
    pleaseSelectPayment: string;
    signerAgreement: string;
}

@Component({
    selector: "empowered-payment-method-step",
    templateUrl: "./payment-method-step.component.html",
    styleUrls: ["./payment-method-step.component.scss"],
})
export class PaymentMethodStepComponent {
    readonly languageStrings: Record<string, string>;
    readonly languageKeys: Record<keyof PaymentMethodLanguageKeys, string>;
    readonly formKeys: Record<keyof PaymentMethodFormKeys, string>;

    formGroup: FormGroup;
    isReinstate = false;
    isAflacAlwaysQuasiModal = true;

    @Input() isModalMode = false;
    @Input() isBilling?: boolean;
}
