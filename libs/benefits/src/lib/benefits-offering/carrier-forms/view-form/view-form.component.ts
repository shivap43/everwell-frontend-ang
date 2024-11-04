import { Store } from "@ngxs/store";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Component, OnInit, Inject, ChangeDetectorRef, ViewChild } from "@angular/core";
import { FormGroup, FormBuilder, AbstractControl } from "@angular/forms";
import {
    CarrierFormWithCarrierInfo,
    CarrierFormQuestion,
    CarrierSetupStatus,
    CarrierFormSetupStatus,
    CarrierFormQuestionType,
    BenefitsOfferingService,
} from "@empowered/api";
import { QuestionControlService } from "../question-control.service";
import { SaveCarrierFormResponses, GetCarrierSetupStatuses, SetCarrierForms, SaveCarrierSetupStatus } from "@empowered/ngxs-store";
import { CarrierFormResponse } from "@empowered/api";
import { take, finalize, catchError, takeUntil, concatMap, switchMap, tap, map } from "rxjs/operators";
import { DatePipe } from "@angular/common";
import { Q60_FORM } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { MatStepper } from "@angular/material/stepper";
import { of, Subject } from "rxjs";
import { DateFormats, AppSettings } from "@empowered/constants";
import { CustomValidation } from "@empowered/ui";
enum RelianceBenefitAmountParamNames {
    YEARS_IN_BUSINESS = "group__years_in_business",
    SIC_CODE = "group__sic_code",
}
const EN_US = "en-US";
const EST_TIME_ZONE = "America/New_York";
const FORM_UNSIGNED = "INCOMPLETE";
const FORM_PENDING = "PENDING";
const CARRIER_FORM_STATUS_NOT_STARTED = "NOT_STARTED";
// push the Q60 form ids for the applicable state
const q60FormsRequiredForStates = [
    Q60_FORM.FORMID,
    Q60_FORM.FL_FORMID,
    Q60_FORM.OH_FORMID,
    Q60_FORM.MT_FORMID,
    Q60_FORM.WA_FORMID,
    Q60_FORM.TX_FORMID,
    Q60_FORM.PA_FORMID,
];
@Component({
    selector: "empowered-view-form",
    templateUrl: "./view-form.component.html",
    styleUrls: ["./view-form.component.scss"],
})
export class ViewFormComponent implements OnInit {
    @ViewChild(MatStepper) matStepper: MatStepper;
    mainForm: FormGroup;
    allCarrierformQuestions: CarrierFormQuestion[];
    isLoading = false;
    isPendingCf = false;
    formArr: CarrierFormResponse[] = [];
    allCarrierformQuestionsAsObject: { [key: string]: CarrierFormQuestion } = {};
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.viewform.finish",
        "primary.portal.viewform.save&close",
        "primary.portal.viewform.carrierform",
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.common.pageOf",
        "primary.portal.common.next",
        "primary.portal.common.back",
    ]);
    queryString = [
        "input.ng-invalid",
        "mat-radio-group.ng-invalid > mat-radio-button",
        "textarea.ng-invalid, mat-select.ng-invalid",
        "mat-selection-list.ng-invalid > mat-list-option",
    ].join(",");
    formIsRelianceCustomForm: boolean;
    formIsQ60Form: boolean;
    carrierFormId: number;
    page2Questions: number[] = [];
    questionControls: FormGroup;
    groupSitusState: string;
    private readonly unsubscribe$: Subject<void> = new Subject();
    isSaveDisabled = false;
    fullTimeId: string;
    partTimeId: string;

    constructor(
        @Inject(MAT_DIALOG_DATA)
        readonly data: {
            form: CarrierFormWithCarrierInfo;
            groupSitusState: string;
            fullTimeArray: string[];
            partTimeArray: string[];
            groupReplacementId: string;
            agentReplacementId: string;
            useUnapproved: boolean;
            viewOnly?: boolean;
        },
        private readonly qcs: QuestionControlService,
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly dialogref: MatDialogRef<ViewFormComponent>,
        private readonly language: LanguageService,
        private readonly datePipe: DatePipe,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly cdr: ChangeDetectorRef,
    ) {}

    /**
     * set form data
     * @returns void
     */
    ngOnInit(): void {
        const customValidator = new CustomValidation();
        this.formIsRelianceCustomForm = this.data.form?.id === AppSettings.RELIANCE_CUSTOM_FORM_ID;
        this.formIsQ60Form = q60FormsRequiredForStates.includes(this.data.form?.id);
        this.carrierFormId = this.data.form?.id;
        this.groupSitusState = this.data.groupSitusState;
        if (
            this.data.form?.formStatus === FORM_UNSIGNED ||
            this.data.form?.formStatus === FORM_PENDING ||
            this.data.form?.formStatus === CARRIER_FORM_STATUS_NOT_STARTED
        ) {
            this.isPendingCf = true;
        }
        if (this.formIsRelianceCustomForm) {
            const numberOfPages = this.data.form?.pages.length;
            this.page2Questions = Array.prototype.concat
                .apply(
                    [],
                    this.data.form?.pages
                        .slice(AppSettings.RELIANCE_CUSTOM_FORM_STEP_2_PAGE1_INDEX, numberOfPages)
                        .map((page) => page.questions),
                )
                .map((question) => question.id);
        }
        if (this.data.form?.pages) {
            this.allCarrierformQuestions = Array.prototype.concat.apply(
                [],
                this.data.form?.pages.map((page) => page.questions),
            );
            this.allCarrierformQuestions.forEach((question) => {
                if (this.data.fullTimeArray.includes(question.id.toString())) {
                    this.fullTimeId = question.id.toString();
                }
                if (this.data.partTimeArray.includes(question.id.toString())) {
                    this.partTimeId = question.id.toString();
                }
            });
            this.allCarrierformQuestions.forEach((question) => {
                this.allCarrierformQuestionsAsObject[question.id.toString()] = question;
            });
            this.mainForm = this.fb.group({
                allQuestions: this.qcs.toFormGroup(
                    this.allCarrierformQuestions,
                    this.fullTimeId,
                    this.partTimeId,
                    this.data.groupReplacementId,
                    this.data.agentReplacementId,
                ),
            });
            this.questionControls = this.mainForm.controls.allQuestions as FormGroup;
        }
        this.cdr.detectChanges();
    }
    /**
     *Enable save and close button according to event
     * @param isDisable event value to enable or disable the button
     */
    saveButtonEventHandler(isDisable: boolean): void {
        this.isSaveDisabled = isDisable;
    }

    /**
     * Check form status and save if valid. Display errors otherwise.
     * @param saveOnly check to save form or submit form
     */
    onSubmit(saveOnly: boolean): void {
        // Run all validations, submit only if all fields are valid.
        this.mainForm.clearValidators();
        const isFormGroupValid = this.qcs.isFormGroupValid(this.questionControls, !saveOnly, this.allCarrierformQuestionsAsObject);
        this.cdr.detectChanges();
        this.formArr.length = 0;
        for (const [questionId, formControl] of Object.entries(this.questionControls.controls)) {
            let val = formControl.value ? formControl.value.toString() : "";
            if (formControl.value) {
                if (this.allCarrierformQuestionsAsObject[questionId].type === CarrierFormQuestionType.DATEPICKER) {
                    val = this.datePipe.transform(formControl.value, DateFormats.YEAR_MONTH_DAY);
                }
                if (this.allCarrierformQuestionsAsObject[questionId].type === CarrierFormQuestionType.CHECKBOX) {
                    val = formControl.value.join(",");
                }
                if (this.allCarrierformQuestionsAsObject[questionId].type === CarrierFormQuestionType.CURRENCY) {
                    val = val.replace("$", "").replace(",", "");
                }
            }
            this.formArr.push({
                questionId: +questionId,
                response: val,
            });
        }
        if (isFormGroupValid.valid) {
            this.isLoading = true;
            this.saveFormToStore(saveOnly);
        }
    }

    /**
     * Save form data to store.
     * @param saveOnly flag indicating whether to only save or submit
     */
    saveFormToStore(saveOnly: boolean): void {
        this.store
            .dispatch(
                new SaveCarrierFormResponses(
                    this.formArr.filter((form) => form.response !== ""),
                    this.data.form.carrierId,
                    this.data.form?.id,
                    this.data.useUnapproved,
                ),
            )
            .pipe(
                switchMap(() => {
                    // save carrier form status as Approved / Pending
                    const statusPayload: CarrierSetupStatus = {
                        carrierFormId: this.data.form?.id ? this.data.form?.id : this.data.form.carrierId,
                        status: saveOnly ? CarrierFormSetupStatus.INCOMPLETE : CarrierFormSetupStatus.PENDING,
                        accountSubmissionDate: this.datePipe.transform(
                            new Date().toLocaleString(EN_US, { timeZone: EST_TIME_ZONE }),
                            DateFormats.DATE_FORMAT_Y_M_D_TH_M_S,
                        ),
                    };
                    return this.store.dispatch(
                        new SaveCarrierSetupStatus(statusPayload, this.data.form.carrierId, this.data.useUnapproved),
                    );
                }),
                tap(() => this.dialogref.close()),
                switchMap((saveResponse) => this.benefitsOfferingService.getBenefitOfferingCarriers(true)),
                map((carriers) => carriers.map((carrier) => carrier.id)),
                concatMap((carrierIds) => this.store.dispatch(new GetCarrierSetupStatuses(carrierIds, true))),
                switchMap((carrierSetupStatuses) => this.store.dispatch(new SetCarrierForms(this.data.useUnapproved, false))),
                finalize(() => (this.isLoading = false)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    goToStep(): void {
        const n = this.matStepper && this.matStepper.selectedIndex === 1 ? 0 : 1;
        this.qcs.isFormGroupValid(this.questionControls, true, this.allCarrierformQuestionsAsObject);
        const step1isValid = !Object.entries(this.questionControls.controls).find(
            (obj) => obj[1].invalid && !this.page2Questions.includes(+obj[0]),
        );
        if (this.matStepper.selectedIndex === 0) {
            if (step1isValid) {
                this.matStepper.selectedIndex = n;
                this.mainForm.markAsUntouched();
                this.benefitsOfferingService
                    .getBenefitAmountsForCarrier(
                        this.data.form.carrierId,
                        this.getFormControlFromQuestionName(RelianceBenefitAmountParamNames.SIC_CODE).value,
                        this.getFormControlFromQuestionName(RelianceBenefitAmountParamNames.YEARS_IN_BUSINESS).value,
                    )
                    .pipe(
                        take(1),
                        catchError((error) => of([])),
                    )
                    .subscribe((benefitAmounts) => {
                        this.isLoading = false;
                        benefitAmounts.forEach((amount) => {
                            const formControlForAmount = this.getFormControlFromQuestionName(amount.questionName);
                            if (!formControlForAmount.value) {
                                // Set amount only if a response has not been provided
                                formControlForAmount.setValue(amount.benefitAmount);
                            }
                        });
                    });
            }
        } else {
            this.matStepper.selectedIndex = n;
        }
    }
    showPageTitle(pageNumber: number): boolean {
        if (!this.formIsRelianceCustomForm) {
            return true;
        }
        return (
            this.matStepper &&
            ((this.matStepper.selectedIndex === 0 && pageNumber < AppSettings.RELIANCE_CUSTOM_FORM_STEP_2_PAGE1_INDEX) ||
                (this.matStepper.selectedIndex === 1 && pageNumber >= AppSettings.RELIANCE_CUSTOM_FORM_STEP_2_PAGE1_INDEX))
        );
    }
    hideQuestion(question: CarrierFormQuestion): boolean {
        return (
            this.formIsRelianceCustomForm &&
            this.matStepper &&
            ((this.matStepper.selectedIndex === 0 && this.page2Questions.includes(question.id)) ||
                (this.matStepper.selectedIndex === 1 && !this.page2Questions.includes(question.id)))
        );
    }

    /**
     * to display finish button based on carrier form status
     * @returns boolean
     */
    showFinishButton(): boolean {
        return (
            !this.data.viewOnly &&
            this.isPendingCf &&
            (!this.formIsRelianceCustomForm || (this.formIsRelianceCustomForm && this.matStepper && this.matStepper.selectedIndex === 1))
        );
    }
    getFormControlFromQuestionName(name: string): AbstractControl {
        const qid = this.allCarrierformQuestions.find((question) => question.name === name).id.toString();
        return this.questionControls.get(qid);
    }
    getModalHeaderTitle(): string {
        let title = this.languageStrings["primary.portal.viewform.carrierform"];
        if (this.formIsRelianceCustomForm && this.matStepper) {
            title = `${title}, ${this.languageStrings["primary.portal.common.pageOf"]
                .replace("#start", String(this.matStepper.selectedIndex + 1))
                .replace("#end", String(AppSettings.RELIANCE_CUSTOM_FORM_NUMBER_OF_STEPS))
                .toLowerCase()}`;
        }
        return title;
    }
}
