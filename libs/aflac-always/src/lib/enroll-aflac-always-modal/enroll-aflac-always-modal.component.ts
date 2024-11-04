import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Optional,
    TemplateRef,
    ViewChild,
} from "@angular/core";
import { FormArray } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatStep, MatStepper } from "@angular/material/stepper";
import { LanguageService } from "@empowered/language";
import { combineLatest, of, Subject } from "rxjs";
import { AflacAlwaysHelperService } from "./services/aflac-always-helper.service";
import { filter, map, switchMap, take, takeUntil, tap } from "rxjs/operators";
import { AflacAlwaysActions, AflacAlwaysSelectors } from "@empowered/ngrx-store/ngrx-states/aflac-always";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store";
import { AsyncStatus, EnrollmentMethod } from "@empowered/constants";
import { AppFlowService } from "@empowered/ngxs-store";
import { STEPPER_GLOBAL_OPTIONS, StepperSelectionEvent } from "@angular/cdk/stepper";
import { TpiServices } from "@empowered/common-services";
import { Router } from "@angular/router";

export interface EnrollAflacAlwaysModalLanguageKeys {
    headerTitle: string;
    selectPolicies: string;
    paymentMethod: string;
    billingAddress: string;
    paymentSettings: string;
    cancel: string;
    back: string;
    next: string;
    close: string;
    saveAndComplete: string;
}

@Component({
    selector: "empowered-enroll-aflac-always-modal",
    templateUrl: "./enroll-aflac-always-modal.component.html",
    styleUrls: ["./enroll-aflac-always-modal.component.scss"],
    providers: [
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: { displayDefaultIndicatorType: false },
        },
    ],
})
export class EnrollAflacAlwaysModalComponent implements AfterViewInit, OnDestroy, OnInit {
    @Input() isTpi = false;
    @Input() isSelfAssisted: boolean;

    isModalMode: boolean;

    display = true;

    mpGroupId = this.tpiServices.getGroupId();
    memberId = this.tpiServices.getMemberId();

    shouldShowEnrollmentMethod: boolean;

    @ViewChild("stepper") stepper: MatStepper;
    @ViewChild("selectPolicies") selectPolicies: TemplateRef<MatStep>;
    @ViewChild("paymentMethod") paymentMethod: TemplateRef<MatStep>;
    @ViewChild("billingAddress") billingAddress: TemplateRef<MatStep>;
    @ViewChild("paymentSettings") paymentSettings: TemplateRef<MatStep>;

    activeStep = 0;
    PAYMENT_METHOD_COMPLETE = 3;
    BILLING_ADDRESS_COMPLETE = 4;
    SELECT_POLICIES_INDEX = 0;
    PAYMENT_METHOD_INDEX = 1;
    BILLING_ADDRESS_INDEX = 2;
    PAYMENT_SETTINGS_INDEX = 3;
    LAST_COMPLETED_STEP_ZERO = 0;
    templates: TemplateRef<MatStep>[] = [];
    languageStrings: Record<string, string>;
    languageKeys: Record<keyof EnrollAflacAlwaysModalLanguageKeys, string>;
    formArray: FormArray;
    isSelectPoliciesComplete = false;
    isPaymentMethodComplete = false;
    isBillingAddressComplete = false;
    isPaymentSettingsComplete = false;
    showSpinner$ = this.aflacAlwaysHelperService.isLoading$();
    readonly unsubscribe$ = new Subject<void>();
    isBilling = false;
    hasClickedNext$ = this.aflacAlwaysHelperService.hasClickedNext$;

    aflacAlwaysEnrollments$ = this.ngrxStore
        .pipe(
            select(
                AflacAlwaysSelectors.getAflacAlwaysEnrollments(
                    this.data?.mpGroupId ?? this.mpGroupId,
                    this.data?.memberId ?? this.memberId,
                ),
            ),
        )
        .pipe(
            filter(
                (asyncAflacAlwaysEnrollments) =>
                    asyncAflacAlwaysEnrollments.status === AsyncStatus.SUCCEEDED ||
                    asyncAflacAlwaysEnrollments.status === AsyncStatus.FAILED,
            ),
            map((asyncAflacAlwaysEnrollments) => asyncAflacAlwaysEnrollments.value),
        );

    getSelectedAflacAlwaysEnrollments$ = this.ngrxStore
        .pipe(select(AflacAlwaysSelectors.getAflacAlwaysUserSelectionEnrollmentIds))
        .pipe(take(1));
    isStepCompleted = [false, false, false];
    isNextButtonClicked = false;
    isBillingFromStepper: boolean = false;

    constructor(
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly dialogRef: MatDialogRef<EnrollAflacAlwaysModalComponent>,
        private readonly language: LanguageService,
        private readonly aflacAlwaysHelperService: AflacAlwaysHelperService,
        private readonly ngrxStore: NGRXStore,
        private readonly appFlowService: AppFlowService,
        @Optional() @Inject(MAT_DIALOG_DATA) private data: any,
        private readonly tpiServices: TpiServices,
        private readonly router: Router,
    ) {
        this.languageKeys = this.buildLanguageKeys();
        this.languageStrings = this.buildLanguageStrings();
        this.formArray = new FormArray([]);
        // Refresh modal data on aflac always modal open
        this.ngrxStore.dispatch(AflacAlwaysActions.resetAflacAlwaysState());
    }

    ngOnInit(): void {
        this.shouldShowEnrollmentMethod = this.data?.showEnrollmentMethod ?? !this.isSelfAssisted;
        this.isModalMode = this.isTpi && !this.tpiServices.isLinkAndLaunchMode();
        if (this.isTpi && this.isSelfAssisted) {
            // If flow is TPI and is Self Assisted flow, set the enrollment method as SELF_SERVICE
            this.ngrxStore.dispatch(AflacAlwaysActions.setAflacAlwaysEnrollmentMethod({ enrollmentMethod: EnrollmentMethod.SELF_SERVICE }));
        }

        this.appFlowService.lastCompletedPaymentIndex.pipe(takeUntil(this.unsubscribe$)).subscribe((lastCompletedStep) => {
            if (lastCompletedStep === this.BILLING_ADDRESS_COMPLETE) {
                this.ngrxStore.dispatch(
                    AflacAlwaysActions.setAflacAlwaysSubscriberPaymentId({
                        subscriberPaymentId: this.appFlowService.getPaymentIdForAflacAlwaysQuasiModal(),
                    }),
                );
                if (this.activeStep === this.PAYMENT_METHOD_INDEX) {
                    // Increment active step by 2 to point the stepper to final submission step
                    this.activeStep = this.activeStep + 2;
                } else {
                    this.activeStep++;
                }
                this.stepper.next();
                this.aflacAlwaysHelperService.setLoading(false);
            }
            if (lastCompletedStep === this.PAYMENT_METHOD_COMPLETE) {
                this.isBilling = true;
                if (this.stepper.selectedIndex === this.PAYMENT_METHOD_INDEX) {
                    this.stepper.next();
                }
            } else if (lastCompletedStep === this.LAST_COMPLETED_STEP_ZERO) {
                this.aflacAlwaysHelperService.setLoading(true);
            }
        });

        if (!this.isTpi) {
            this.dialogRef
                .afterOpened()
                .pipe(take(1))
                .subscribe(() => {
                    this.hasClickedNext$.next(false);
                });
        }

        this.appFlowService.paymentMethod$.next(null);
    }

    /**
     * @description Initializes the component after view is initialized
     * @returns void
     * @memberof EnrollAflacAlwaysModalComponent
     */
    ngAfterViewInit(): void {
        this.stepper.selectedIndex = 0;
        this.templates = [this.selectPolicies, this.paymentMethod, this.billingAddress, this.paymentSettings];
        this.changeDetectorRef.detectChanges();
    }

    /**
     * @description Closes the dialog
     * @returns void
     * @memberof EnrollAflacAlwaysModalComponent
     */
    onCancel() {
        this.isBilling = false;
        this.appFlowService.initalizeBillingStep(false);
        this.dialogRef.close({ data: {} });
    }

    /**
     * @description Goes to the next step
     * @returns void
     * @memberof EnrollAflacAlwaysModalComponent
     */
    onNextClick() {
        this.isNextButtonClicked = true;
        this.hasClickedNext$.next(true);

        if (this.stepper.selectedIndex === 0) {
            this.isBilling = false;
            this.proceedToPaymentStepCheck();
        } else if (this.stepper.selectedIndex === 1 || this.stepper.selectedIndex === 2) {
            this.proceedToBilling();
        } else if (this.stepper.selectedIndex === 3) {
            this.activeStep++;
            this.isStepCompleted[2] = true;
            this.stepper.next();
            this.isPaymentSettingsComplete = true;
        }
    }

    /**
     * @description Goes to the previous step
     * @returns void
     * @memberof EnrollAflacAlwaysModalComponent
     */
    nextStep(event: StepperSelectionEvent): void {
        const stepIndex = event.selectedIndex;
        if (!this.isNextButtonClicked && (this.isStepCompleted[stepIndex - 1] || stepIndex === 0)) {
            if (stepIndex !== 2) {
                this.isBilling = false;
                this.activeStep = stepIndex;
            }
            if (this.stepper.selectedIndex === 2 && stepIndex === 1) {
                this.appFlowService.initalizeBillingStep(false);
                this.appFlowService.paymentStepPosition.next(1);
            }
            if (stepIndex === 2 && (this.stepper.selectedIndex === 0 || this.stepper.selectedIndex === 3)) {
                this.isBilling = true;
                this.isBillingFromStepper = true;
                this.activeStep = 1;
                this.isNextButtonClicked = true;
                setTimeout(() => {
                    this.appFlowService.paymentStepNext$.next(1);
                    this.isBillingFromStepper = false;
                }, 3000);
            } else if (stepIndex === 2) {
                this.isBilling = true;
                this.isNextButtonClicked = true;
                this.appFlowService.paymentStepNext$.next(1);
            }
        }
        this.isNextButtonClicked = false;
    }

    /**
     * @description Goes to the previous step
     * @returns void
     * @memberof EnrollAflacAlwaysModalComponent
     */
    onBackClick() {
        this.isNextButtonClicked = true;
        if (this.stepper.selectedIndex === this.BILLING_ADDRESS_INDEX) {
            this.isBilling = false;
            this.appFlowService.initalizeBillingStep(false);
            // set step position to display payment method
            this.appFlowService.paymentStepPosition.next(1);
            this.stepper.previous();
            this.isNextButtonClicked = false;
        } else if (this.stepper.selectedIndex === this.PAYMENT_SETTINGS_INDEX) {
            this.isBilling = true;
            this.appFlowService.initalizeBillingStep(true);
            this.activeStep--;
            this.stepper.previous();
            this.isNextButtonClicked = false;
        } else if (this.stepper.selectedIndex === this.PAYMENT_METHOD_INDEX) {
            this.activeStep = this.SELECT_POLICIES_INDEX;
            this.stepper.previous();
            this.isNextButtonClicked = false;
        }
    }

    /**
     * @description Handles the save and complete click event
     * @returns void
     * @memberof EnrollAflacAlwaysModalComponent
     */
    onSaveAndCompleteClick(): void {
        this.aflacAlwaysHelperService.saveAndSubmit$.next(true);
    }

    /**
     * @description Builds the language keys
     * @returns Record<string, string>
     * @memberof EnrollAflacAlwaysModalComponent
     * @private
     */
    private buildLanguageKeys(): Record<keyof EnrollAflacAlwaysModalLanguageKeys, string> {
        return {
            headerTitle: "primary.portal.applicationFlow.reinstate.aflacAlways",
            selectPolicies: "primary.portal.aflac.always.select.policies",
            paymentMethod: "primary.portal.applicationFlow.payments.paymentMethod",
            billingAddress: "primary.portal.applicationFlow.payments.billingAddress",
            paymentSettings: "primary.portal.applicationFlow.payments.paymentSettings",
            cancel: "primary.portal.common.cancel",
            back: "primary.portal.common.back",
            next: "primary.portal.common.next",
            close: "primary.portal.common.close",
            saveAndComplete: "primary.portal.aflac.always.save.complete",
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
            this.languageKeys.headerTitle,
            this.languageKeys.selectPolicies,
            this.languageKeys.paymentMethod,
            this.languageKeys.billingAddress,
            this.languageKeys.paymentSettings,
            this.languageKeys.cancel,
            this.languageKeys.back,
            this.languageKeys.next,
            this.languageKeys.close,
            this.languageKeys.saveAndComplete,
        ]);
    }

    /**
     * Checks if at least one policy has been selected before proceeding to payment step
     */
    proceedToPaymentStepCheck(): void {
        combineLatest([this.aflacAlwaysEnrollments$, this.getSelectedAflacAlwaysEnrollments$])
            .pipe(
                switchMap(([enrollments, enrollmentIds]) => {
                    if (enrollments?.length) {
                        return of(enrollmentIds);
                    } else {
                        this.aflacAlwaysHelperService.noPoliciesFound$.next(true);
                        return of(null);
                    }
                }),
                filter((policiesFound) => !!policiesFound),
                map((enrollmentIds) => !!enrollmentIds.length),
                take(1),
                tap((arePlansSelected) => {
                    if (arePlansSelected) {
                        this.activeStep++;
                        this.stepper.next();
                        this.isSelectPoliciesComplete = true;
                        this.isStepCompleted[0] =true;
                    } else {
                        this.aflacAlwaysHelperService.policySelected$.next(false);
                        this.isSelectPoliciesComplete = false;
                        this.isPaymentMethodComplete = false;
                        this.isBillingAddressComplete = false;
                        this.isPaymentSettingsComplete = false;
                    }
                }),
            )
            .subscribe();
    }
    /**
     * Checks whether the current step is payment method or billing address
     * And invokes the appropriate subject to trigger form submissions in payment component
     */
    proceedToBilling(): void {
        if (!this.isBilling) {
            this.isPaymentMethodComplete = true;
            this.appFlowService.paymentStepNext$.next(1);
            this.isStepCompleted[1] =true;
        } else {
            this.isBillingAddressComplete = true;
            this.appFlowService.paymentStepNext$.next(2);
            this.isStepCompleted[2] =true;
        }
    }

    /**
     * Function called on click of 'Exit' button and is used to exit from TPI flow
     */
    onExit(): void {
        this.router.navigate(["tpi/exit"]);
    }

    /**
     * Angular Lifecycle method, called when component is destroyed
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
