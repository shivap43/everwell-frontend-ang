import { Injectable } from "@angular/core";
import { LanguageService } from "@empowered/language";

@Injectable({
    providedIn: "root",
})
export class AflacAlwaysLanguageService {
    protected readonly languageKeys: Record<keyof EnrollAflacAlwaysLanguageKeys, string>;

    private temp: Record<string, string> = {
        selectPoliciesHeader: "Select policies",
        selectPoliciesText: `
            Aflac Always allows you to keep your coverage at your current rates if you change jobs, retire,
            or if your employer stops paying premiums on your behalf. It's free to enroll and you can access, 
            update or opt out of Aflac Always at any time..
        `,
        middleInitial: "MI",
        sameAsApplicant: "Same as applicant",
        enrollmentMethod: "Enrollment method",
        importPolicyHeader: "Don't see a policy? Import it now (optional)",
        birthDateLabel: "Birthdate",
        policyNumberLabel: "Policy number",
        importButtonLabel: "Import",
        paymentMethodHeader: "Payment method",
        pleaseSelectPayment:
            "Please select a payment method. Payments will only be initiated if the policy stops being paid by your employer",
        confirmAccountNumber: "Confirm Account number must match Account number",
        signerAgreement: `By clicking Next, I authorize Aflac to initiate recurring debit entries or charges electronically to the
            account indicated above for the premiums due on my policy(-ies). I authorize the institution to debit or charge same to
            the account. I agree this authorization shall remain effective and in full force until Aflac and the institution receive
            written notification from me of its termination in such time and in such manner to afford Aflac and the institution a
            reasonable opportunity to  act on it. I authorize Aflac to continue to initiate recurring debit entries or charges to the
            account beyond the expiration  date of the debit or credit card and to automatically update the card information as necessary
            to continue initiating debit  entries or charges.`,

        footerMessage: "Only Aflac Individual policies (except life policies) can be enrolled in Aflac Always",
        selectAll: "Select All",
        importPolicyTableHeader: "Select the eligible policies you want to enroll in Aflac Always:",
        noPoliciesFound: "No eligible policies found",
        aflacAlwaysStatus: "Aflac Always status",
        planName: "Plan name",
        policyStatus: "Policy status",
        policyNumber: "Policy number",
        eligiblePoliciesTable: "Eligible Policies Table",
        invalidPolicyNumber: "Invalid policy number",
        policyNotFoundLabel: "Policy not found",
        creditDebitCard: "Credit/Debit Card",
        aflacAlwaysQuasiModalHeader: "Aflac Always",
        bankDraftAcknowledgement: `Yes, I agree and understand 
        that Aflac will begin drafting my account if my payroll group is no longer deducting and submitting
            premiums to Aflac on my behalf for the policy listed below or for the new policy for which I am applying.,`,
        billingAddress: "Billing address",
        noPolicySelected: "No policy selected",
        closeErrorAlert: "Close error alert",
        quarterly: "Quarterly",
        monthly: "Monthly",
        maxChar200: "Cannot exceed 200 characters",
        leastChar3: "Must be at least 3 characters",
        invalidFirstLastName: "Use letters, spaces, hyphens (-) and apostrophes (') only. First and last must be letters.",
        eSignatureRequired: "Signature required",
        paymentDateRequired: "Payment date required",
        maxChar28: "Cannot exceed 28 characters",
        minChar1: "Must be at least 1 character",
        genericApiError: "Change me to use Flyway",
    };

    constructor(private readonly language: LanguageService) {
        this.languageKeys = this.buildLanguageKeys();
    }

    /**
     * @description Gets a proxy object that provides access to language strings based on property names.
     * @returns {Proxy} - A proxy object that provides access to strings based on property names.
     * @memberof AflacAlwaysLanguageService
     */
    get strings(): Record<keyof EnrollAflacAlwaysLanguageKeys, string> {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        return new Proxy(Object.create(null), {
            get(_, prop: string) {
                if (typeof prop !== "string") {
                    return undefined;
                }

                if (Object.prototype.hasOwnProperty.call(self.temp, prop)) {
                    return self.temp[prop];
                }

                if (Object.prototype.hasOwnProperty.call(self.languageKeys, prop)) {
                    return self.language.fetchPrimaryLanguageValue(self.languageKeys[prop]);
                }

                return undefined;
            },
        });
    }

    /**
     * @description Builds the language keys
     * @returns Record<string, string>
     * @memberof PaymentMethodStepComponent
     * @private
     */
    private buildLanguageKeys(): Record<keyof EnrollAflacAlwaysLanguageKeys, string> {
        return {
            accountHolder: "primary.portal.applicationFlow.payments.bankDraft.accountHolder",
            accountName: "primary.portal.applicationFlow.payments.accountName",
            accountNoDontMatch: "primary.portal.applicationFlow.payments.accountNoDontMatch",
            accountNumber: "primary.portal.applicationFlow.payments.accountNumber",
            accountType: "primary.portal.applicationFlow.payments.accountType",
            accountTypeChecking: "primary.portal.applicationFlow.payments.accountTypeChecking",
            accountTypeSaving: "primary.portal.applicationFlow.payments.accountTypeSaving",
            achEditRetireWarning: "primary.portal.applicationFlow.payments.paymentMethod.achEditRetireWarning",
            addAccount: "primary.portal.applicationFlow.payments.bankDraft.addAccount",
            addCard: "primary.portal.applicationFlow.payments.addCard",
            addNewAccount: "primary.portal.applicationFlow.payments.addNewAccount",
            addNewCard: "primary.portal.applicationFlow.payments.addNewCard",
            agreeDescription: "primary.portal.applicationFlow.payments.agreeDescription",
            authorizedSigner: "primary.portal.aflac.always.modal.body.payment.method.authorizedSigner",
            bankName: "primary.portal.applicationFlow.payments.bankName",
            bankNameInvalid: "primary.portal.applicationFLow.payments.bankNameInvalid",
            billingAddress: "primary.portal.applicationFlow.payments.billingAddress",
            cannotExceedChar: "primary.portal.applicationFlow.payments.cannotExceedChar",
            cardExist: "primary.portal.applicationFlow.payments.cardExist",
            cardExpiredMessage: "secondary.portal.applicationFlow.payments.cardExpiredMessage",
            cardHolderName: "primary.portal.applicationFlow.payments.cardHolderName",
            cardNumber: "primary.portal.applicationFlow.payments.cardNumber",
            cardType: "primary.portal.policyChangeRequest.transactions.changeBeneficiary.transferToDirect.cardType",
            cardTypeHint: "primary.portal.applicationFlow.payments.cardTypeHint",
            chooseDay: "primary.portal.applicationFlow.payments.chooseDay",
            city: "primary.portal.applicationFlow.payments.city",
            contactLater: "primary.portal.applicationFlow.payments.contactLater",
            credit: "primary.portal.applicationFlow.payments.credit",
            eSignature: "primary.portal.applicationFlow.payments.customerInitials",
            customerInitialsLater: "primary.portal.applicationFlow.payments.customerInitialsLater",
            debitCardMessage: "primary.portal.applicationFlow.payments.debitCardMessage",
            debitCardNoteMessage: "primary.portal.applicationFlow.payments.debitCardNoteMessage",
            delete: "primary.portal.common.delete",
            editAccount: "primary.portal.applicationFlow.payments.editAccount",
            editCard: "primary.portal.applicationFlow.payments.editCard",
            emailAddress: "primary.portal.applicationFlow.payments.emailAddress",
            enterPin: "primary.portal.applicationFlow.payments.enterPin",
            expirationDate: "primary.portal.applicationFlow.payments.expirationDate",
            firstName: "primary.portal.applicationFlow.payments.firstName",
            iAgree: "primary.portal.common.iAgree",
            info: "primary.portal.vf2f.disable.info",
            invalidAccountNumber: "primary.portal.applicationFlow.payments.invalidAccountNumber",
            invalidCardNumber: "primary.portal.applicationFlow.payments.invalidCardNumber",
            invalidDate: "primary.portal.applicationFlow.payments.invalidDate",
            invalidEmailAddressFormat: "primary.portal.applicationFlow.payments.invalidEmailAddressFormat",
            invalidExpirationDate: "primary.portal.applicationFlow.payments.invalidExpirationDate",
            invalidFormat: "primary.portal.applicationFlow.payments.invalidFormat",
            invalidRoutingNumber: "primary.portal.applicationFlow.payments.invalidRoutingNumber",
            issue: "primary.portal.common.payMetric.issue",
            lastName: "primary.portal.applicationFlow.payments.lastName",
            matchState: "primary.portal.applicationFlow.payments.matchState",
            matchStateDigits: "primary.portal.applicationFlow.payments.matchStateDigits",
            mi: "primary.portal.applicationFlow.payments.mi",
            mustLeastChar: "primary.portal.applicationFlow.payments.mustLeastChar",
            next: "primary.portal.common.next",
            nextFinishApplications: "primary.portal.applicationFlow.payments.nextFinishApplications",
            no: "primary.portal.common.no",
            noPaymentInfoError: "primary.portal.applicationFlow.payments.noPaymentInfoError",
            onlyLettersNumUnderscore: "primary.portal.applicationFlow.payments.onlyLettersNumUnderscore",
            pastDate: "primary.portal.applicationFlow.payments.pastDate",
            patternError: "primary.portal.common.city.patternError",
            paymentDate: "primary.portal.applicationFlow.payments.paymentDate",
            deductionFrequency: "primary.portal.proposals.create.proposalDetails.deductionFrequency",
            paymentMethod: "primary.portal.applicationFlow.payments.paymentMethod",
            paymentSettings: "primary.portal.applicationFlow.payments.paymentSettings",
            paymentTypeBankDraft: "primary.portal.applicationFlow.payments.paymentTypeBankDraft",
            paymentTypeCreditCard: "primary.portal.applicationFlow.payments.paymentTypeCreditCard",
            paymentTypeDebitCard: "primary.portal.applicationFlow.payments.paymentTypeDebitCard",
            reenterAccountNumber: "primary.portal.applicationFlow.payments.reenterAccountNumber",
            routingNumber: "primary.portal.applicationFlow.payments.routingNumber",
            selectAccount: "primary.portal.applicationFlow.payments.selectAccount",
            selectCreditCard: "primary.portal.applicationFlow.payments.selectCreditCard",
            selectDebitCard: "primary.portal.applicationFlow.payments.selectDebitCard",
            selectionRequired: "primary.portal.common.selectionRequired",
            selectPoliciesHeader: "primary.portal.aflac.always.modal.body.payment.method.selectPoliciesHeader",
            selectPoliciesText: "primary.portal.aflac.always.modal.body.payment.method.selectPoliciesText",
            requiredField: "primary.portal.common.requiredField",
            state: "primary.portal.applicationFlow.payments.state",
            streetAddress1: "primary.portal.applicationFlow.payments.streetAddress1",
            streetAddress2optional: "primary.portal.applicationFlow.payments.streetAddress2optional",
            suffix: "primary.portal.applicationFlow.payments.suffix",
            useOnlyLetters: "primary.portal.formPageQuestion.useOnlyLetters",
            yes: "primary.portal.common.yes",
            zip: "primary.portal.applicationFlow.payments.zip",
            allFieldsAreRequired: "primary.portal.common.allFieldsAreRequired",
            cancel: "primary.portal.common.cancel",
            clear: "primary.portal.common.clear",
            save: "primary.portal.common.save",
            close: "primary.portal.common.close",
            saveAndComplete: "primary.portal.common.saveAndComplete",
            back: "primary.portal.common.back",
            aflacAlwaysQuasiModalHeader: "primary.portal.aflac.always.modal.header",
            sameAsApplicant: "primary.portal.aflac.always.modal.steps.billingAddress.sameAsApplicant",
            middleInitial: "primary.portal.applicationFlow.payments.middleInitial",
            enrollmentMethod: "primary.portal.aflac.always.modal.steps.enrollmentMethod",
            birthDateLabel: "primary.portal.aflac.always.modal.steps.billingAddress.birthDateLabel",
            importPolicyHeader: "primary.portal.aflac.always.modal.steps.importPolicyHeader",
            policyNumberLabel: "primary.portal.aflac.always.modal.steps.policyNumberLabel",
            importButtonLabel: "primary.portal.aflac.always.modal.steps.importButtonLabel",
            paymentMethodHeader: "primary.portal.aflac.always.modal.steps.paymentMethodHeader",
            pleaseSelectPayment: "primary.portal.aflac.always.modal.steps.paymentMethod.pleaseSelectPayment",
            creditDebitCard: "primary.portal.aflac.always.modal.steps.paymentMethod.creditDebitCard",
            confirmAccountNumber: "primary.portal.aflac.always.modal.steps.paymentMethod.confirmAccountNumber",
            signerAgreement: "primary.portal.aflac.always.modal.steps.paymentMethod.signerAgreement",
            selectAll: "primary.portal.aflac.always.modal.body.select.policies.step.table.select.all",
            planName: "primary.portal.aflac.always.modal.body.select.policies.step.table.plan.name",
            policyStatus: "primary.portal.aflac.always.modal.body.select.policies.step.table.policy.status",
            policyNumber: "primary.portal.aflac.always.modal.body.select.policies.step.table.policy.number",
            aflacAlwaysStatus: "primary.portal.aflac.always.modal.body.select.policies.step.table.aflac.always.status",
            footerMessage: "primary.portal.aflac.always.modal.body.select.policies.step.table.footer.message",
            noPoliciesFound: "primary.portal.aflac.always.modal.body.select.policies.step.table.no.policies.found",
            eligiblePoliciesTable: "primary.portal.aflac.always.modal.body.select.policies.step.table.eligible.policies.table",
            importPolicyTableHeader: "primary.portal.aflac.always.modal.body.select.policies.step.table.import.policy.table.header",
            invalidPolicyNumber: "primary.portal.aflac.always.modal.body.select.policies.step.table.import.policy.invalid.policy.number",
            policyNotFoundLabel: "primary.portal.aflac.always.modal.select.policies.import.policy.not.found",
            importPolicySuccessLabel: "primary.portal.aflac.always.modal.select.policies.import.policy.success",
            alphaNumericLabel: "primary.portal.aflac.always.modal.select.policies.import.policy.alpha.numeric",
            bankDraftAcknowledgement: "primary.portal.aflac.always.modal.body.payment.method.bankDraftAcknowledgementCheckboxLabel",
            noPolicySelected: "primary.portal.aflac.always.modal.body.select.policies.step.table.no.policy.selected",
            closeErrorAlert: "primary.portal.aflac.always.modal.body.select.policies.step.table.close.error.alert",
            quarterly: "primary.portal.aflac.always.modal.body.payment.method.quarterly",
            monthly: "primary.portal.aflac.always.modal.body.payment.method.monthly",
            maxChar200: "primary.portal.aflac.always.modal.body.payment.method.max.char.200",
            eSignatureRequired: "primary.portal.aflac.always.modal.eSignature.eSignatureRequired",
            paymentDateRequired: "primary.portal.aflac.always.modal.paymentDateRequired",
            maxChar28: "primary.portal.aflac.always.modal.maxChar28",
            minChar1: "primary.portal.aflac.always.modal.minChar1",
            genericApiError: "primary.portal.common.genericApiError",
        };
    }
}

export interface EnrollAflacAlwaysLanguageKeys {
    accountHolder: string;
    accountName: string;
    accountNoDontMatch: string;
    accountNumber: string;
    accountType: string;
    accountTypeChecking: string;
    accountTypeSaving: string;
    achEditRetireWarning: string;
    addAccount: string;
    addCard: string;
    addNewAccount: string;
    addNewCard: string;
    authorizedSigner: string;
    agreeDescription: string;
    bankName: string;
    bankNameInvalid: string;
    billingAddress: string;
    cannotExceedChar: string;
    cardExist: string;
    cardExpiredMessage: string;
    cardHolderName: string;
    cardNumber: string;
    cardType: string;
    cardTypeHint: string;
    chooseDay: string;
    city: string;
    contactLater: string;
    credit: string;
    eSignature: string;
    customerInitialsLater: string;
    debitCardMessage: string;
    debitCardNoteMessage: string;
    delete: string;
    editAccount: string;
    editCard: string;
    emailAddress: string;
    enterPin: string;
    expirationDate: string;
    firstName: string;
    iAgree: string;
    info: string;
    invalidAccountNumber: string;
    invalidCardNumber: string;
    invalidDate: string;
    invalidEmailAddressFormat: string;
    invalidExpirationDate: string;
    invalidFormat: string;
    invalidRoutingNumber: string;
    issue: string;
    lastName: string;
    matchState: string;
    matchStateDigits: string;
    mi: string;
    mustLeastChar: string;
    next: string;
    nextFinishApplications: string;
    no: string;
    noPaymentInfoError: string;
    onlyLettersNumUnderscore: string;
    pastDate: string;
    patternError: string;
    paymentDate: string;
    deductionFrequency: string;
    paymentMethod: string;
    paymentSettings: string;
    paymentTypeBankDraft: string;
    paymentTypeCreditCard: string;
    paymentTypeDebitCard: string;
    reenterAccountNumber: string;
    requiredField: string;
    routingNumber: string;
    selectAccount: string;
    selectCreditCard: string;
    selectDebitCard: string;
    selectionRequired: string;
    selectPoliciesHeader: string;
    selectPoliciesText: string;
    state: string;
    streetAddress1: string;
    streetAddress2optional: string;
    suffix: string;
    useOnlyLetters: string;
    yes: string;
    zip: string;
    allFieldsAreRequired: string;
    cancel: string;
    clear: string;
    save: string;
    close: string;
    saveAndComplete: string;
    back: string;
    aflacAlwaysQuasiModalHeader: string;
    sameAsApplicant: string;
    middleInitial: string;
    enrollmentMethod: string;
    importPolicyHeader: string;
    birthDateLabel: string;
    policyNumberLabel: string;
    importButtonLabel: string;
    paymentMethodHeader: string;
    pleaseSelectPayment: string;
    creditDebitCard: string;
    confirmAccountNumber: string;
    signerAgreement: string;
    selectAll: string;
    planName: string;
    policyStatus: string;
    policyNumber: string;
    aflacAlwaysStatus: string;
    footerMessage: string;
    noPoliciesFound: string;
    eligiblePoliciesTable: string;
    importPolicyTableHeader: string;
    invalidPolicyNumber: string;
    policyNotFoundLabel: string;
    importPolicySuccessLabel: string;
    alphaNumericLabel: string;
    bankDraftAcknowledgement: string;
    noPolicySelected: string;
    closeErrorAlert: string;
    quarterly: string;
    monthly: string;
    maxChar200: string;
    eSignatureRequired: string;
    paymentDateRequired: string;
    maxChar28: string;
    minChar1: string;
    genericApiError: string;
}
