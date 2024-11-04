import { Component, OnInit, OnDestroy } from "@angular/core";
import { PolicyChangeRequestList, AppSettings } from "@empowered/constants";
import { FormBuilder, Validators, FormGroup, AbstractControl } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Select, Store } from "@ngxs/store";
import { PolicyTransactionForms } from "@empowered/api";
import { SideNavService } from "./../../side-nav/services/side-nav.service";
import { Subscription, Observable } from "rxjs";
import { PolicyChangeRequestState, SetDowngradeCancerRequest, SharedState } from "@empowered/ngxs-store";
import { PolicyChangeRequestComponent } from "../../../policy-change-request.component";
import { PolicyChangeRequestCancelPopupComponent, PolicyChangeRequestConfirmationPopupComponent } from "@empowered/ui";

@Component({
    selector: "empowered-downgrade-cancer",
    templateUrl: "./downgrade-cancer.component.html",
    styleUrls: ["./downgrade-cancer.component.scss"],
})
export class DowngradeCancerComponent implements OnInit, OnDestroy {
    downgradeForm: FormGroup;
    isSubmitted: boolean;
    subscriptions: Subscription[] = [];
    downgradeCancerRequestInitialData: any;
    validationRegex: any;
    fromValueMaxLength = AppSettings.MAX_LENGTH_8;

    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.policyChangeRequest.transactions.downgradeCancer.fromAndToMaxLengthValidation",
        "primary.portal.policyChangeRequest.transactions.downgradeCancer.title",
        "primary.portal.policyChangeRequest.transactions.continue",
        "primary.portal.policyChangeRequest.transactions.cancel",
        "primary.portal.policyChangeRequest.transactions.requiredField",
        "primary.portal.policyChangeRequest.transactions.downgradeCancer.from",
        "primary.portal.policyChangeRequest.transactions.downgradeCancer.to",
        "primary.portal.policyChangeRequest.transactions.downgradeCancer.fromValidation",
        "primary.portal.policyChangeRequest.transactions.downgradeCancer.toValidation",
        "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessage",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved",
        "primary.portal.policyChangeRequest.transactions.positiveNumber",
        "primary.portal.policyChangeRequest.transactions.back",
        "primary.portal.dashboard.policyChangeRequestFlow.nextStep",
        "primary.portal.common.next",
        "primary.portal.policyChangeRequest.transactions.downgradeCancer.initialDignosis",
        "primary.portal.policyChangeRequest.transactions.downgradeCancer.specifiedDisease",
    ]);
    @Select(PolicyChangeRequestState.GetDowngradeCancerRequest) downgradeCancerRequest$: Observable<any>;
    @Select(SharedState.regex) regex$: Observable<any>;

    constructor(
        private readonly languageService: LanguageService,
        private readonly fb: FormBuilder,
        private readonly dialog: MatDialog,
        private readonly store: Store,
        private readonly sideNavService: SideNavService,
        private cancelDialogRef: MatDialogRef<PolicyChangeRequestCancelPopupComponent>,
        private readonly PCRDialogRef: MatDialogRef<PolicyChangeRequestComponent>,
    ) {
        this.subscriptions.push(
            this.regex$.subscribe((data) => {
                if (data) {
                    // Assign the data object to the local object(i.e validationRegex)
                    this.validationRegex = data;
                }
            }),
        );
    }

    ngOnInit(): void {
        this.downgradeForm = this.fb.group({
            decreaseInitialDiagnosisBenefitAmount: this.fb.group({
                isChecked: [false],
            }),
            decreaseCancerScreeningBenefitAmount: this.fb.group({
                isChecked: [false],
            }),
            type: [Object.keys(PolicyTransactionForms)[9]],
        });
        this.downgradeCancerRequestInitialData = { ...this.downgradeForm.value };
        this.getDataFromStore();
    }

    getDataFromStore(): void {
        this.subscriptions.push(
            this.downgradeCancerRequest$.subscribe((downgradeCancerRequest) => {
                if (downgradeCancerRequest) {
                    const cloneDowngradeRequest = { ...downgradeCancerRequest };
                    this.loadFormControl(cloneDowngradeRequest);
                    this.downgradeForm.patchValue(cloneDowngradeRequest);
                }
            }),
        );
    }

    loadFormControl(cloneDowngradeRequest: any): void {
        for (const request in cloneDowngradeRequest) {
            if (cloneDowngradeRequest[request] instanceof Object) {
                const cloneRequest = { ...cloneDowngradeRequest[request], isChecked: true };
                delete cloneDowngradeRequest[request];
                cloneDowngradeRequest[request] = cloneRequest;
                this.showFromAndToControls(true, request);
            }
        }
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
                    this.store.dispatch(new SetDowngradeCancerRequest(null, null));
                    this.PCRDialogRef.close(PolicyChangeRequestList.cancel);
                }
            }),
        );
    }

    back(): void {
        this.sideNavService.onBackClick();
    }
    /**
     * Create form control
     */
    get formControl(): unknown {
        return this.downgradeForm.controls;
    }

    /**
     * Toggle to and from contols
     * @param index
     * @param isChecked
     */
    showFromAndToControls(isChecked: boolean, formGrpName: string): void {
        if (isChecked) {
            this.formControl[formGrpName].addControl(
                "to",
                this.fb.control("", [Validators.required, Validators.pattern(new RegExp(this.validationRegex.NUMERIC))]),
            );
            this.formControl[formGrpName].addControl(
                "from",
                this.fb.control("", [Validators.required, Validators.pattern(new RegExp(this.validationRegex.NUMERIC))]),
            );
            this.formControl[formGrpName].setValidators(this.fromAndToValidation);
            this.formControl[formGrpName].markAsDirty();
        } else {
            this.formControl[formGrpName].markAsPristine();
            this.formControl[formGrpName].removeControl("to");
            this.formControl[formGrpName].removeControl("from");
        }
        this.formControl[formGrpName].updateValueAndValidity();
    }

    /**
     * Validate to and from control
     * @param formGroup
     */
    fromAndToValidation(control: AbstractControl): unknown {
        if (parseInt(control.value.from, 10) <= parseInt(control.value.to, 10)) {
            return { isToValueIsGreater: true };
        }
        return null;
    }

    /**
     * Submit downgrade cancer change request
     */
    submitDowngradeCancerRequest(): void {
        if (!this.downgradeForm.dirty) {
            this.openConfirmationPopup();
        } else {
            this.isSubmitted = true;
            this.validateAllFormFields(this.downgradeForm);
            this.storeDowngradeCancerRequest();
        }
    }

    /**
     * Store downgrade cancer request data
     */
    storeDowngradeCancerRequest(): void {
        if (this.downgradeForm.valid) {
            this.formatData();
            this.store.dispatch(new SetDowngradeCancerRequest(this.downgradeForm.value, this.downgradeCancerRequestInitialData));
            this.sideNavService.onNextClick(1);
        }
    }
    /**
     * Method to format data
     */
    formatData(): void {
        for (const data in this.downgradeForm.value) {
            if (this.downgradeForm.value[data].isChecked || this.downgradeForm.value[data] === "CANCER_RIDER_DOWNGRADE") {
                delete this.downgradeForm.value[data].isChecked;
            } else {
                delete this.downgradeForm.value[data];
            }
        }
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
                requestType: this.languageStrings["primary.portal.policyChangeRequest.transactions.downgradeCancer.title"],
            },
        });
        this.subscriptions.push(
            dialogRef.afterClosed().subscribe((result) => {
                if (result === AppSettings.CONTINUE) {
                    this.sideNavService.onNextClick(1);
                    this.store.dispatch(new SetDowngradeCancerRequest(null, null));
                } else {
                    dialogRef.close();
                }
            }),
        );
    }

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

    ngOnDestroy(): void {
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}
