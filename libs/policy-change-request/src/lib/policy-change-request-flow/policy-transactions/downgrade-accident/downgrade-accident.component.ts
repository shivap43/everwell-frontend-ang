import { Component, OnInit, OnDestroy } from "@angular/core";

import { LanguageService } from "@empowered/language";
import { FormBuilder, Validators, FormGroup, AbstractControl } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { PolicyTransactionForms, EnrollmentService, FindPolicyholderModel, AffectedPolicies } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { SideNavService } from "./../../side-nav/services/side-nav.service";
import { PolicyChangeRequestState, SetDowngradeAccidentRequest, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { Subscription, Observable, of } from "rxjs";
import { mergeMap, toArray, catchError, map, withLatestFrom, filter } from "rxjs/operators";
import { PolicyChangeRequestComponent } from "../../../policy-change-request.component";
import { ProductId, PolicyChangeRequestList, AppSettings } from "@empowered/constants";
import { PolicyChangeRequestCancelPopupComponent, PolicyChangeRequestConfirmationPopupComponent } from "@empowered/ui";

const THREE_MONTHS_BENEFIT_PERIOD = 3;
const SIX_MONTHS_BENEFIT_PERIOD = 6;
const INCREASE_ELIMINATION_PERIOD = "increaseEliminationPeriod";
@Component({
    selector: "empowered-downgrade-accident",
    templateUrl: "./downgrade-accident.component.html",
    styleUrls: ["./downgrade-accident.component.scss"],
})
export class DowngradeAccidentComponent implements OnInit, OnDestroy {
    downgradeForm: FormGroup;
    isSubmitted: boolean;
    subscriptions: Subscription[] = [];
    downgradeAccidentRequestInitialData: any;
    validationRegex: any;
    fromValueMaxLength = AppSettings.MAX_LENGTH_8;
    mpGroup: any;
    memberId: any;
    showSpinner: boolean;
    riderList = [];
    isRiderAvailable: boolean;
    selectedRiderId: any;
    isRequestCreated: boolean;
    fromEliminationPeriodOptions: string[] = [];
    toEliminationPeriodOptions: string[] = [];
    toEliminationPeriodException: string[] = ["0/14", "7/7"];
    benefitPeriod: number;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.aggreementCondition1",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.aggreementCondition2",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.aggreementCondition3",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.decreaseMonthlyBenefitAmount",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.decreaseMaximumBenefitAmount",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.increaseEliminationPeriod",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.increaseEliminationPeriod.toDays",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.increaseEliminationPeriod.fromDays",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.decreasedRider",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.decreaseMonthlyBenefitAmount.to",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.decreaseMonthlyBenefitAmount.from",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.decreaseMaximumBenefitAmount.to",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.decreaseMaximumBenefitAmount.from",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.decreasedRider.addtionalAccident",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.decreasedRider.spouseOffJob ",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.decreasedRider.addtionalAccident.to",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.decreasedRider.spouseOffJob.from",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.fromValidation",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.toValidation",
        "primary.portal.policyChangeRequest.transactions.downgrade.higherEliminationError",
        "primary.portal.policyChangeRequest.transactions.requiredField",
        "primary.portal.policyChangeRequest.transactions.cancel",
        "primary.portal.policyChangeRequest.transactions.back",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.fromAndToMaxLengthValiadtion",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.header",
        "primary.portal.policyChangeRequest.transactions.continue",
        "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessage",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved",
        "primary.portal.policyChangeRequest.transactions.positiveNumber",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.toDaysValidation",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.fromDaysValidation",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.fromDaysValidation",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.toDaysValidation",
        "primary.portal.common.next",
        "primary.portal.common.select",
    ]);
    showRiderDetails$: Observable<boolean>;
    @Select(PolicyChangeRequestState.GetDowngradeAccidentRequest) downgradeAccidentRequest$: Observable<any>;
    @Select(SharedState.regex) regex$: Observable<any>;
    @Select(PolicyChangeRequestState.GetmemberInfo) memberInfo$: Observable<FindPolicyholderModel>;

    constructor(
        private readonly languageService: LanguageService,
        private readonly fb: FormBuilder,
        private readonly dialog: MatDialog,
        private readonly store: Store,
        private readonly sideNavService: SideNavService,
        private readonly enrollmentService: EnrollmentService,
        private readonly staticUtilService: StaticUtilService,
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
    /**
     * @description performs necessary function and calculation on initialization of the component
     * @returns void
     */
    ngOnInit(): void {
        this.showRiderDetails$ = this.memberInfo$.pipe(
            withLatestFrom(this.store.select(PolicyChangeRequestState.GetFindPolicyHolderDetails)),
            map(
                ([member, policyHolder]) =>
                    // Find the policy that was searched on the first step. Return its "rider" property.
                    !!member.riderPolicies.find((policy) => policy.policyNumber === policyHolder.policyNumber.toString()),
            ),
        );
        this.downgradeForm = this.fb.group({
            decreaseMonthlyBenefitAmount: this.fb.group({
                isChecked: [false],
            }),
            decreaseMaximumBenefitAmount: this.fb.group({
                isChecked: [false],
            }),
            increaseEliminationPeriod: this.fb.group({
                isChecked: [false],
            }),
            decreasedRider: this.fb.group({
                id: [],
                isChecked: [false],
            }),
            type: [Object.keys(PolicyTransactionForms)[7]],
        });
        this.downgradeAccidentRequestInitialData = { ...this.downgradeForm.value };
        this.isRequestCreated = this.store.selectSnapshot(PolicyChangeRequestState.GetDowngradeCancerInitialData) ? true : false;
        this.getDataFromStore();
        this.getMemeberInfo();
    }
    /**
     * @description get the required member information
     */
    getMemeberInfo(): void {
        this.subscriptions.push(
            this.memberInfo$.pipe(filter((memberInfo) => !!memberInfo)).subscribe((memberInfo) => {
                this.mpGroup = memberInfo["groupId"];
                this.memberId = memberInfo["memberId"];
                if (this.mpGroup && this.memberId) {
                    this.getEnrollment();
                } else if (memberInfo.riderPolicies) {
                    this.populateRiderList(memberInfo.riderPolicies);
                }
            }),
        );
    }
    /**
     * @description get the elimination period option from config based on benefit period
     * @param benefitPeriod benefit period of the policy
     */
    getDowngradeOptions(benefitPeriod: number) {
        let config = "";
        if (benefitPeriod === THREE_MONTHS_BENEFIT_PERIOD) {
            config = "general.pcr.downgrade.benefit_period.three_months";
        } else if (benefitPeriod === SIX_MONTHS_BENEFIT_PERIOD) {
            config = "general.pcr.downgrade.benefit_period.six_months";
        } else {
            config = "general.pcr.downgrade.benefit_period.default";
        }
        this.subscriptions.push(
            this.staticUtilService.cacheConfigValue(config).subscribe((response) => {
                this.fromEliminationPeriodOptions = response.split(",");
            }),
        );
        if (this.formControl[INCREASE_ELIMINATION_PERIOD].value.isChecked && this.formControl[INCREASE_ELIMINATION_PERIOD].value.to) {
            this.onEliminationPeriodChange(
                this.formControl[INCREASE_ELIMINATION_PERIOD].value.from,
                true,
                this.formControl[INCREASE_ELIMINATION_PERIOD].value.to,
            );
        }
    }

    getEnrollment(): void {
        const zero = 0;
        this.showSpinner = true;
        const riderList$ = this.enrollmentService
            .getEnrollments(this.memberId, Number(this.mpGroup), "planId,coverageLevelId")
            .pipe(
                mergeMap((enrollment) => enrollment),
                catchError((err) => {
                    this.showSpinner = false;
                    return of(null);
                }),
            )
            .pipe(
                mergeMap((enrollment) => this.enrollmentService.getEnrollmentRiders(this.memberId, enrollment["id"], this.mpGroup)),
                catchError((err) => {
                    this.showSpinner = false;
                    return of(null);
                }),
            )
            .pipe(toArray());

        this.subscriptions.push(
            riderList$.subscribe((rider) => {
                rider.forEach((data) => {
                    this.riderList.splice(zero, zero, ...data);
                });
                this.showSpinner = false;
            }),
        );
    }
    /**
     * @description get the pre filled downgrade product data from store and set form
     */
    getDataFromStore(): void {
        const policySearched = this.store.selectSnapshot(PolicyChangeRequestState.GetmemberInfo);
        if (policySearched) {
            this.benefitPeriod = policySearched.policies[0].benefitPeriod;
            this.getDowngradeOptions(this.benefitPeriod);
        }
        this.subscriptions.push(
            this.downgradeAccidentRequest$.subscribe((downgradeAccidentRequest) => {
                if (downgradeAccidentRequest) {
                    const cloneDowngradeAccidentRequest = { ...downgradeAccidentRequest };
                    if (downgradeAccidentRequest.decreasedRider) {
                        this.isRiderAvailable = true;
                        this.addAmountControl(downgradeAccidentRequest.decreasedRider["id"]);
                    }
                    this.loadFormControl(cloneDowngradeAccidentRequest);
                    this.downgradeForm.patchValue(cloneDowngradeAccidentRequest);
                    if (cloneDowngradeAccidentRequest.increaseEliminationPeriod) {
                        const eliminationPeriod = cloneDowngradeAccidentRequest.increaseEliminationPeriod;
                        this.onEliminationPeriodChange(eliminationPeriod.from, true, eliminationPeriod.to);
                    }
                    this.downgradeAccidentRequestInitialData = { ...this.downgradeForm.value };
                    this.downgradeForm.markAsDirty();
                }
            }),
        );
    }
    /**
     * @description set the form values and validators for increase elimination period option on change of selected option
     * @param value value selected for from field of increase elimination period option
     * @param preSelect to indicate if elimination period is preselected
     * @param toEliminationPeriod preselected value of to field of increase elimination period option
     */
    onEliminationPeriodChange(value: string, preSelect: boolean, toEliminationPeriod?: string): void {
        if (this.formControl[INCREASE_ELIMINATION_PERIOD].controls.from.value) {
            this.formControl[INCREASE_ELIMINATION_PERIOD].controls.to.setValidators([Validators.required]);
            this.toEliminationPeriodOptions = this.fromEliminationPeriodOptions.slice(
                this.fromEliminationPeriodOptions.findIndex((option) => option === value) + 1,
            );
            if (this.toEliminationPeriodException.includes(this.formControl[INCREASE_ELIMINATION_PERIOD].controls.from.value)) {
                this.toEliminationPeriodOptions = this.toEliminationPeriodOptions.filter(
                    (eliminationPeriod) => !this.toEliminationPeriodException.includes(eliminationPeriod),
                );
            }
            if (preSelect) {
                this.formControl[INCREASE_ELIMINATION_PERIOD].controls.to.setValue(toEliminationPeriod);
            } else {
                this.formControl[INCREASE_ELIMINATION_PERIOD].controls.to.setValue("");
            }
            if (!this.toEliminationPeriodOptions.length) {
                this.formControl[INCREASE_ELIMINATION_PERIOD].controls.to.setErrors({ noHigherPeriod: true });
            }
        }
    }

    loadFormControl(downgradeAccidentRequest: any): void {
        for (const accidentRequest in downgradeAccidentRequest) {
            if (downgradeAccidentRequest[accidentRequest] instanceof Object) {
                const cloneRequest = { ...downgradeAccidentRequest[accidentRequest], isChecked: true };
                delete downgradeAccidentRequest[accidentRequest];
                downgradeAccidentRequest[accidentRequest] = cloneRequest;
                this.showFromAndToControls(true, accidentRequest);
            }
        }
    }
    /**
     * @description close the popup and clear the reset the store values
     */
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
                    this.store.dispatch(new SetDowngradeAccidentRequest(null, null));
                    this.PCRDialogRef.close(PolicyChangeRequestList.cancel);
                }
            }),
        );
    }

    back(): void {
        this.sideNavService.onBackClick();
    }

    showRider(isRiderAvailable: boolean): void {
        if (!isRiderAvailable) {
            if (this.amountFormControl) {
                this.formControl["decreasedRider"].controls["amount"].removeControl("to");
                this.formControl["decreasedRider"].controls["amount"].removeControl("from");
                this.formControl["decreasedRider"].removeControl("amount");
            }
            this.selectedRiderId = null;
            this.formControl["decreasedRider"].markAsPristine();
        }
        this.isRiderAvailable = isRiderAvailable;
    }

    addAmountControl(id: any, planId?: any): void {
        this.selectedRiderId = id;
        if (this.formControl["decreasedRider"]) {
            this.formControl["decreasedRider"].removeControl("amount");
        }

        const amount = this.fb.group({
            to: [null, Validators.compose([Validators.required, Validators.pattern(new RegExp(this.validationRegex.NUMERIC))])],
            from: [null, Validators.compose([Validators.required, Validators.pattern(new RegExp(this.validationRegex.NUMERIC))])],
        });
        this.formControl["decreasedRider"].addControl("amount", amount);
        this.formControl["decreasedRider"].controls["amount"].setValidators(this.fromAndToValidation);
        if (this.downgradeForm.value["decreasedRider"].isChecked) {
            this.downgradeForm.controls["decreasedRider"].patchValue({
                id: planId || id,
            });
        }
        this.downgradeAccidentRequestInitialData = { ...this.downgradeForm.value };
    }

    /**
     * Validate to and from control
     * @param formGroup
     */
    amountfromAndToValidation(control: AbstractControl): unknown {
        if (parseInt(control.value.from, 10) <= parseInt(control.value.to, 10)) {
            return { isToValueIsGreater: true };
        }
        return null;
    }
    /**
     * Validate to and from form fields
     * @param control form control to be validated
     */
    fromDayAndToDayValidation(control: AbstractControl): unknown {
        if (parseInt(control.value.from, 10) <= parseInt(control.value.to, 10)) {
            return { isToValueIsGreater: true };
        }
        return null;
    }

    get amountFormControl(): any {
        if (this.formControl["decreasedRider"].controls["amount"]) {
            return this.formControl["decreasedRider"].controls["amount"].controls;
        }
    }
    /**
     * Create form control
     */
    get formControl(): unknown {
        return this.downgradeForm.controls;
    }

    /**
     * @description show or hide the controls based on check value for the field
     * @param isChecked indicates if the field is checked
     * @param formGrpName form group name to be hidden or displayed
     */
    showFromAndToControls(isChecked: boolean, formGrpName: string): void {
        if (isChecked) {
            if (formGrpName !== "increaseEliminationPeriod") {
                this.formControl[formGrpName].addControl(
                    "to",
                    this.fb.control("", [Validators.required, Validators.pattern(new RegExp(this.validationRegex.NUMERIC))]),
                );
                this.formControl[formGrpName].addControl(
                    "from",
                    this.fb.control("", [Validators.required, Validators.pattern(new RegExp(this.validationRegex.NUMERIC))]),
                );
                this.formControl[formGrpName].setValidators(this.fromDayAndToDayValidation);
                this.formControl[formGrpName].markAsDirty();
            } else {
                this.formControl[formGrpName].addControl("from", this.fb.control("", [Validators.required]));
                this.formControl[formGrpName].addControl("to", this.fb.control(""));
                const decreaseMaximumBenefitAmountValue = this.formControl["decreaseMaximumBenefitAmount"].value;
                if (decreaseMaximumBenefitAmountValue.isChecked && decreaseMaximumBenefitAmountValue.to) {
                    this.benefitPeriod = parseInt(decreaseMaximumBenefitAmountValue.to, 10);
                }
                this.getDowngradeOptions(this.benefitPeriod);
            }
        } else {
            this.formControl[formGrpName].markAsPristine();
            this.formControl[formGrpName].removeControl("to");
            this.formControl[formGrpName].removeControl("from");
            if (formGrpName === "decreaseMaximumBenefitAmount") {
                const policySearched = this.store.selectSnapshot(PolicyChangeRequestState.GetmemberInfo);
                if (policySearched) {
                    const accidentPolicy = policySearched.policies.find((policy) => policy.productId === ProductId.ACCIDENT);
                    this.benefitPeriod = accidentPolicy ? accidentPolicy.benefitPeriod : 0;
                    this.getDowngradeOptions(this.benefitPeriod);
                }
            }
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
     * Submit downgrade accident change request
     */
    submitDowngradeAccidentRequest(): void {
        if (!this.downgradeForm.dirty) {
            this.openConfirmationPopup();
        } else {
            this.isSubmitted = true;
            this.validateAllFormFields(this.downgradeForm);
            this.checkRiderControls();
            this.setRequest();
        }
    }

    checkRiderControls(): void {
        this.formControl["decreasedRider"].removeControl("from");
        this.formControl["decreasedRider"].removeControl("to");
    }
    /**
     * @description Set Request data and navigate to next tab
     * @returns void
     */
    setRequest(): void {
        if (!this.downgradeForm.errors && this.downgradeForm.valid) {
            this.formatData();
            this.store.dispatch(new SetDowngradeAccidentRequest(this.downgradeForm.value, this.downgradeAccidentRequestInitialData));
            this.sideNavService.onNextClick(1);
        }
    }

    formatData(): void {
        for (const data in this.downgradeForm.value) {
            if (this.downgradeForm.value[data]["amount"]) {
                delete this.downgradeForm.value[data].isChecked;
            } else if (this.downgradeForm.value[data].isChecked || this.downgradeForm.value[data] === "ACCIDENTAL_DOWNGRADE") {
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
                requestType: this.languageStrings["primary.portal.policyChangeRequest.transactions.downgradeAccident.header"],
                description: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved"],
            },
        });
        this.subscriptions.push(
            dialogRef.afterClosed().subscribe((result) => {
                if (result === AppSettings.CONTINUE) {
                    this.sideNavService.onNextClick(1);
                    this.store.dispatch(new SetDowngradeAccidentRequest(null, null));
                } else {
                    dialogRef.close();
                }
            }),
        );
    }
    /**
     * @description validate the from group
     * @param formGroup form group that needs to be validated
     */
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
    /**
     * @description reset the from values for increase elimination period option on changes on benefit period
     * @param benefitPeriod new benefit period
     */
    resetEliminationPeriod(benefitPeriod: string): void {
        if (
            this.downgradeForm.value[INCREASE_ELIMINATION_PERIOD].isChecked &&
            this.downgradeForm.controls.decreaseMaximumBenefitAmount.valid
        ) {
            this.formControl[INCREASE_ELIMINATION_PERIOD].controls.from.setValue("");
            this.formControl[INCREASE_ELIMINATION_PERIOD].controls.to.setValue("");
            this.formControl[INCREASE_ELIMINATION_PERIOD].controls.to.setValidators(null);
            this.formControl[INCREASE_ELIMINATION_PERIOD].controls.to.setErrors(null);
            this.benefitPeriod = parseInt(benefitPeriod, 10);
            this.getDowngradeOptions(this.benefitPeriod);
        }
    }
    /**
     * @description Populates the riderList when mpGroup and memberId is not returned from API
     * @param riderPolicies the rider policies of the member
     */
    populateRiderList(riderPolicies: AffectedPolicies[]): void {
        this.riderList = riderPolicies.map((rider) => ({
            id: rider.riderId,
            name: rider.policyName,
        }));
    }
    /**
     * This method will unsubscribe all the api subscription.
     */
    ngOnDestroy(): void {
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}
