import { Component, Inject, OnInit, ViewChild, Optional, Input } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, NgForm, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { AflacService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { AflacAlwaysActions, AflacAlwaysSelectors } from "@empowered/ngrx-store/ngrx-states/aflac-always";
import { select } from "@ngrx/store";
import { Observable, Subject } from "rxjs";
import { withLatestFrom, tap, takeUntil } from "rxjs/operators";
import { EnrollAflacAlwaysModalData } from "../../enroll-aflac-always-modal.data";
import { AflacAlwaysHelperService } from "../../services/aflac-always-helper.service";
import { EnrollmentMethod } from "@empowered/constants";
import { AflacAlwaysResource } from "@empowered/api";
import { EnrollAflacAlwaysModalComponent } from "../../enroll-aflac-always-modal.component";
import { TpiServices } from "@empowered/common-services";
import { Router } from "@angular/router";

import { Select } from "@ngxs/store";
import { SharedState } from "@empowered/ngxs-store";
import { SignatureModalComponent } from "../signature-modal/signature-modal.component";
export interface PaymentSettingsStepFormKeys {
    deductionFrequency: string;
    paymentDate: string;
    paymentAcknowledgement: string;
    eSignature: string;
    pinSignature: string;
}

export interface PaymentSettingsStepLanguageKeys {
    paymentSettings: string;
    deductionFrequency: string;
    paymentDateAcknowledgement: string;
    paymentAcknowledgement: string;
    eSignature: string;
    requiredField: string;
    invalidDate: string;
    eSignatureRequired: string;
    invalidFormat: string;
    maxChar: string;
    leastChar: string;
    selectionRequired: string;
    genericAPIError: string;
    pinSignature: string;
    pinRequired: string;
    pinMaxChar: string;
    pinInvalidFormat: string;
}

const ALPHA_NUMERIC_UNDERSCORE_REGEX = "^[A-Za-z]+[A-Za-z'\\ \\-]*[A-Za-z]+$";
const OTHER = "OTHER";

@Component({
    selector: "empowered-payment-settings-step",
    templateUrl: "./payment-settings-step.component.html",
    styleUrls: ["./payment-settings-step.component.scss"],
})
export class PaymentSettingsStepComponent implements OnInit {
    languageStrings: Record<string, string>;
    languageKeys: Record<keyof PaymentSettingsStepLanguageKeys, string>;
    formKeys: Record<keyof PaymentSettingsStepFormKeys, string>;
    formGroup: FormGroup;
    apiError: boolean;
    isFaceToFace = false;
    isLoading: boolean;
    endDate: string | null;
    showSpinner: boolean;
    aflacAlwaysResource: AflacAlwaysResource;
    isPinSignature = false;
    validationRegex: any;
    signatureValue: any;
    isHeadset = false;
    @Select(SharedState.regex) regex$: Observable<any>;
    @ViewChild("paymentSettingForm") paymentSettingFormElement: NgForm;
    readonly unsubscribe$ = new Subject<void>();
    private readonly signupAflacAlways$ = new Subject<void>();
    // Gets selected enrollment ids
    private readonly selectedEnrollmentIds$ = this.ngrxStore.pipe(select(AflacAlwaysSelectors.getAflacAlwaysUserSelectionEnrollmentIds));
    // Gets selected enrollment method
    private readonly selectedEnrollmentMethod$ = this.ngrxStore.pipe(select(AflacAlwaysSelectors.getAflacAlwaysEnrollmentMethod));
    // Gets selected pay frequency
    private readonly selectedPayFrequency$ = this.ngrxStore.pipe(select(AflacAlwaysSelectors.getAflacAlwaysUserSelectionPayFrequency));
    // Gets selected subscriber payment id
    private readonly subscriberPaymentId$ = this.ngrxStore.pipe(
        select(AflacAlwaysSelectors.getAflacAlwaysUserSelectionSubscriberPaymentId),
    );

    @Input() isModalMode = false;

    constructor(
        private readonly language: LanguageService,
        private readonly fb: FormBuilder,
        private readonly dialogRef: MatDialogRef<EnrollAflacAlwaysModalComponent>,
        private readonly aflacService: AflacService,
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: EnrollAflacAlwaysModalData,
        private readonly ngrxStore: NGRXStore,
        private readonly aflacAlwaysHelperService: AflacAlwaysHelperService,
        private readonly tpiServices: TpiServices,
        private readonly router: Router,
        private readonly matDialog: MatDialog,
    ) {
        this.formKeys = this.buildFormKeys();
        this.formGroup = this.buildFormGroup();
        this.languageKeys = this.buildLanguageKeys();
        this.languageStrings = this.buildLanguageStrings();
    }

    /**
     * @description Builds the billing address form
     * @returns FormGroup
     * @memberof EnrollAflacAlwaysModalComponent
     * @private
     */
    private buildFormGroup(): FormGroup {
        return new FormGroup({
            [this.formKeys.deductionFrequency]: new FormControl(null, [Validators.required]),
            [this.formKeys.paymentDate]: new FormControl(null, [Validators.required, Validators.min(1), Validators.max(28)]),
            [this.formKeys.paymentAcknowledgement]: new FormControl(" ", [(control) => (!control.value ? { required: true } : null)]),
        });
    }

    ngOnInit(): void {
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });

        this.selectedEnrollmentMethod$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            if (resp === EnrollmentMethod.CALL_CENTER || resp === EnrollmentMethod.PIN_SIGNATURE) {
                this.isPinSignature = true;
                this.formGroup.addControl(
                    this.formKeys.pinSignature,
                    this.fb.control(null, [
                        Validators.required,
                        Validators.maxLength(25),
                        Validators.minLength(3),
                        Validators.pattern(this.validationRegex.ALPHANUMERIC_WITH_UNDERSCORE),
                    ]),
                );
                return;
            } else if (resp === EnrollmentMethod.HEADSET) {
                this.isHeadset = true;
                this.formGroup.addControl(
                    this.formKeys.eSignature,
                    this.fb.control(null, [
                        Validators.required,
                        Validators.maxLength(25),
                        Validators.minLength(3),
                        Validators.pattern(this.validationRegex.ALPHANUMERIC_WITH_UNDERSCORE),
                    ]),
                );
                this.formGroup.controls[this.formKeys.eSignature].disable();
                return;
            }
            this.isFaceToFace = true;
            this.formGroup.addControl(
                this.formKeys.eSignature,
                this.fb.control(null, [
                    Validators.required,
                    Validators.maxLength(200),
                    Validators.minLength(3),
                    Validators.pattern(ALPHA_NUMERIC_UNDERSCORE_REGEX),
                ]),
            );
        });

        this.signupAflacAlways$
            .pipe(
                withLatestFrom(
                    this.selectedEnrollmentIds$,
                    this.selectedEnrollmentMethod$,
                    this.selectedPayFrequency$,
                    this.subscriberPaymentId$,
                ),
                tap(([_, enrollmentIds, enrollmentMethod, payFrequency, paymentId]) => {
                    this.aflacAlwaysResource = {
                        enrollmentIds: enrollmentIds,
                        enrollmentMethod: enrollmentMethod,
                        payFrequency: payFrequency,
                        subscriberPaymentId: paymentId,
                        firstPaymentDay: this.formGroup.controls[this.formKeys.paymentDate].value,
                        signature: this.signatureValue,
                    };
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.aflacAlwaysHelperService.saveAndSubmit$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            if (resp) {
                // trigger the form submission
                this.paymentSettingFormElement?.onSubmit(undefined);
            }
        });
    }

    onSaveAndSubmit(): void {
        this.signatureValue =
            this.isFaceToFace || this.isHeadset
                ? this.formGroup.controls[this.formKeys.eSignature].value
                : this.formGroup.controls[this.formKeys.pinSignature].value;
        this.signupAflacAlways$.next();
        if (this.formGroup.valid) {
            this.isLoading = true;
            this.aflacService
                .createAflacAlways(
                    this.data?.mpGroupId ?? this.tpiServices.getGroupId(),
                    this.data?.memberId ?? this.tpiServices.getMemberId(),
                    this.aflacAlwaysResource,
                )
                .pipe(
                    takeUntil(this.unsubscribe$),
                    tap(
                        () => {
                            this.isLoading = false;
                            this.apiError = false;
                            // Behavior subject to change button text to 'Enrolled'
                            this.aflacAlwaysHelperService.aflacAlwaysEnrolled$.next(this.isHeadset ? EnrollmentMethod.HEADSET : OTHER);
                            if (this.isHeadset) {
                                this.matDialog.open(SignatureModalComponent, {
                                    data: {
                                        mpGroupId: Number(this.data?.mpGroupId),
                                        memberId: Number(this.data?.memberId),
                                    },
                                });
                            }
                            if (this.isModalMode) {
                                this.ngrxStore.dispatch(AflacAlwaysActions.resetAflacAlwaysState());
                                this.router.navigate(["tpi/coverage-summary"]);
                                return;
                            }
                            this.dialogRef.close();
                        },
                        () => {
                            this.isLoading = false;
                            this.apiError = true;
                        },
                    ),
                )
                .subscribe();
        }
    }

    /**
     * @description sets the pay frequency value to form control
     * @returns void
     * @memberof EnrollAflacAlwaysModalComponent
     */
    onDeductionFrequencyChange(value: string) {
        this.formGroup.controls[this.formKeys.deductionFrequency].setValue(value);
        this.ngrxStore.dispatch(
            AflacAlwaysActions.setAflacAlwaysPaymentFrequency({
                payFrequency: value,
            }),
        );
    }

    /**
     * @description sets the payment date value to form control
     * @returns void
     * @memberof EnrollAflacAlwaysModalComponent
     */
    onPaymentDateChange(value: string) {
        this.formGroup.controls[this.formKeys.paymentDate].setValue(value);
        this.ngrxStore.dispatch(
            AflacAlwaysActions.setAflacAlwaysFirstPaymentDay({
                firstPaymentDay: Number(value),
            }),
        );
    }

    /**
     * @description sets the payment date value to form control
     * @returns void
     * @memberof EnrollAflacAlwaysModalComponent
     */
    onCheckboxChange(value: boolean) {
        if (value === true) {
            this.formGroup.controls[this.formKeys.paymentAcknowledgement].setValue(value);
        } else {
            this.formGroup.controls[this.formKeys.paymentAcknowledgement].setValue(null);
        }
    }

    /**
     * @description sets the sign value to form control
     * @returns void
     * @memberof EnrollAflacAlwaysModalComponent
     */
    onSignatureChange(value: string) {
        if (this.isFaceToFace) {
            this.formGroup.controls[this.formKeys.eSignature].setValue(value);
        } else if (this.isPinSignature) {
            this.formGroup.controls[this.formKeys.pinSignature].setValue(value);
        }
        this.ngrxStore.dispatch(AflacAlwaysActions.setAflacAlwaysEsignature({ signature: value }));
    }

    /**
     * @description Builds the form keys
     * @returns EnrollAflacAlwaysModalFormKeys
     * @memberof EnrollAflacAlwaysModalComponent
     * @private
     */
    private buildFormKeys(): Record<keyof PaymentSettingsStepFormKeys, string> {
        return {
            deductionFrequency: "deductionFrequency",
            paymentDate: "paymentDate",
            paymentAcknowledgement: "paymentAcknowledgement",
            eSignature: "eSignature",
            pinSignature: "pinSignature",
        };
    }

    /**
     * @description Builds the language keys
     * @returns Record<string, string>
     * @memberof EnrollAflacAlwaysModalComponent
     * @private
     */
    private buildLanguageKeys(): Record<keyof PaymentSettingsStepLanguageKeys, string> {
        return {
            paymentSettings: "primary.portal.aflac.always.modal.paymentSettings",
            deductionFrequency: "primary.portal.aflac.always.modal.deductionFrequency",
            paymentDateAcknowledgement: "primary.portal.aflac.always.modal.paymentAcknowledgementTitle",
            paymentAcknowledgement: "primary.portal.aflac.always.modal.paymentAcknowledgementCheckbox",
            requiredField: "primary.portal.aflac.always.requiredField",
            invalidDate: "primary.portal.aflac.always.invalidDate",
            eSignature: "primary.portal.aflac.always.modal.eSignature",
            eSignatureRequired: "primary.portal.aflac.always.modal.eSignatureRequired",
            invalidFormat: "primary.portal.aflac.always.modal.eSignature.invalid.format",
            maxChar: "primary.portal.aflac.always.modal.eSignature.max.char",
            leastChar: "primary.portal.aflac.always.modal.eSignature.min.char",
            selectionRequired: "primary.portal.common.selectionRequired",
            genericAPIError: "primary.portal.aflac.always.modal.api.error",
            pinSignature: "primary.portal.applicationFlow.payments.enterPin",
            pinRequired: "primary.portal.common.requiredField",
            pinMaxChar: "primary.portal.applicationFlow.cannotExceed",
            pinInvalidFormat: "primary.portal.applicationFlow.useOnlyLetters",
        };
    }

    /**
     * @description Builds the language strings
     * @returns Record<string, string>
     * @memberof EnrollAflacAlwaysModalComponent
     * @private
     */
    private buildLanguageStrings(): Record<string, string> {
        return this.language.fetchPrimaryLanguageValues([
            this.languageKeys.paymentSettings,
            this.languageKeys.deductionFrequency,
            this.languageKeys.paymentDateAcknowledgement,
            this.languageKeys.paymentAcknowledgement,
            this.languageKeys.eSignature,
            this.languageKeys.requiredField,
            this.languageKeys.invalidDate,
            this.languageKeys.eSignatureRequired,
            this.languageKeys.invalidFormat,
            this.languageKeys.maxChar,
            this.languageKeys.leastChar,
            this.languageKeys.selectionRequired,
            this.languageKeys.genericAPIError,
            this.languageKeys.pinSignature,
            this.languageKeys.pinRequired,
            this.languageKeys.pinMaxChar,
            this.languageKeys.pinInvalidFormat,
        ]);
    }

    /**
     * Angular Lifecycle method, called when component is destroyed
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
