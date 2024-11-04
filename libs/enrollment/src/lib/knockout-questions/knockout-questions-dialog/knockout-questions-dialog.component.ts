import { takeUntil } from "rxjs/operators";
import { CurrencyPipe } from "@angular/common";
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormBuilder, FormGroup, Validators, FormArray } from "@angular/forms";
import { KnockoutQuestion, InputType, MemberService } from "@empowered/api";
import { UtilService } from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";

import {
    ResponsePanel,
    AppSettings,
    Contraints,
    Operation,
    Option,
    Question,
    Salary,
    ConstraintAggregates,
    ApplicationResponse,
    StepType,
    ContraintsType,
} from "@empowered/constants";
import { Observable, Subject } from "rxjs";
import { KnockoutDialogData } from "./knockout-questions-dialog.model";

@Component({
    selector: "empowered-knockout-questions-dialog",
    templateUrl: "./knockout-questions-dialog.component.html",
    styleUrls: ["./knockout-questions-dialog.component.scss"],
})
export class KnockoutQuestionsDialogComponent implements OnInit, OnDestroy {
    planObject: KnockoutQuestion[];
    stepsData = [];
    form: FormGroup;
    inputType = InputType;
    showError = false;
    isEdit: boolean;
    isProducer: boolean;
    stepResponses: any;
    salary: number;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.knockout.updatesTitle",
        "primary.portal.knockout.eligibilityImpact",
        "primary.portal.knockout.editnProducer.question",
        "primary.portal.knockout.editnProducer.description",
        "primary.portal.knockout.noteditnProducer.question",
        "primary.portal.knockout.noteditnProducer.description",
        "primary.portal.knockout.errorMsg",
        "primary.portal.common.close",
        "primary.portal.common.salary",
    ]);
    queryString = [
        "input.ng-invalid",
        "mat-radio-group.ng-invalid > mat-radio-button",
        "textarea.ng-invalid, mat-select.ng-invalid",
        "mat-selection-list.ng-invalid > mat-list-option",
    ].join(",");
    skipAndConstraintValue: boolean;
    skipOrConstraintValue: boolean;
    showAndConstraintValue: boolean;
    showOrConstraintValue: boolean;
    showSpinner: boolean;
    private readonly unsubscribe$ = new Subject<void>();
    showData: boolean;
    salaries$!: Observable<Salary[]>;

    constructor(
        private readonly dialogRef: MatDialogRef<KnockoutQuestionsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private readonly data: KnockoutDialogData,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly memberService: MemberService,
        private readonly currencyPipe: CurrencyPipe,
    ) {}

    /**
     * on component initialization getting data from service,calling functions and initializing variables
     */
    ngOnInit(): void {
        this.showSpinner = true;

        // defaults to MemberService response based on data’s mpGroup and memberId if no salaries$ is provided in data
        this.salaries$ = this.data.salaries$ ?? this.memberService.getSalaries(this.data.memberId, false, this.data.mpGroup.toString());

        this.salaries$.pipe(takeUntil(this.unsubscribe$)).subscribe(
            (salaries) => {
                if (salaries.length) {
                    this.salary = +salaries[0].annualSalary;
                }
                this.loadKnockoutQuestions();
            },
            (error) => {
                this.loadKnockoutQuestions();
            },
        );
    }
    /**
     * loads knockout questions
     */
    loadKnockoutQuestions(): void {
        this.showSpinner = false;
        this.isProducer = this.data.isProducer;
        this.isEdit = this.data.isEdit;
        this.planObject = this.data.knockoutQuestions;
        this.createStepData();
        this.createForm();
        this.hideAndShowQuestions();
        const defaultSalaryText = "<u><strong>" + this.languageStrings["primary.portal.common.salary"] + "</strong></u>";
        this.stepsData = this.stepsData
            .map((stepData) => {
                stepData.step.question.text = stepData.step.question.text.replace(
                    defaultSalaryText,
                    this.salary ? "<u><strong>" + this.currencyPipe.transform(this.salary) + "</strong></u>" : defaultSalaryText,
                );
                return stepData;
            })
            .filter((stepData) => stepData.showStep);
        this.showData = true;
        this.filterDuplicateKnockoutQuestions();
        if (!this.stepsData.length) {
            this.dialogRef.close({ action: "submit", responses: [] });
        }
    }

    /**
     * Method to remove the duplicate questions after checking constraints based on question text.
     */
    filterDuplicateKnockoutQuestions(): void {
        if (this.stepsData.length > 1) {
            // remove duplicate based on text
            this.stepsData = this.stepsData.reduce((uniqueQuestions, stepData) => {
                if (!uniqueQuestions.some((obj) => obj.step.question.text.includes(stepData.step.question.text))) {
                    uniqueQuestions.push(stepData);
                }
                return uniqueQuestions;
            }, []);
        }
    }

    createStepData(): void {
        this.planObject.forEach((step) => {
            this.stepsData.push({
                step: step,
                showStep: true,
            });
        });
        if (this.data.response && this.stepsData.length) {
            this.stepResponses = this.data.response;
        }
    }

    createForm(): void {
        this.resetValues();
        this.form = this.fb.group({});
        this.stepsData.forEach((stepData) => {
            const stepDataCopy = this.utilService.copy(stepData);
            if (
                stepData.step.question.inputType === InputType.CHECKBOX ||
                stepData.step.question.inputType === InputType.RADIO ||
                stepData.step.question.inputType === InputType.SELECT
            ) {
                stepDataCopy.step.question.options.map((option) => {
                    option.showOption = this.checkOptionConstraints(option);
                });
            }
            stepData.step = stepDataCopy.step;
            if (stepData.showStep) {
                let previousResponse;
                if (this.stepResponses) {
                    previousResponse = this.stepResponses.find((resp) => resp.planQuestionId === stepData.step.question.id);
                }
                let previousValue = null;
                if (previousResponse) {
                    previousValue = previousResponse.value;
                } else if (stepData.step.question.response) {
                    previousValue = stepData.step.question.response;
                }
                this.form.addControl(
                    stepData.step.question.id,
                    this.addQuestionGroup(stepData.step.question.required, previousValue, stepData.step.question),
                );
            }
        });
    }

    resetValues(): void {
        this.showError = false;
    }

    addQuestionGroup(required: boolean, value: any, question: Question): FormGroup {
        let formGroup: FormGroup;
        if (question.inputType === InputType.CHECKBOX) {
            let formCheckBoxArray;
            if (required) {
                formCheckBoxArray = this.fb.array([], this.checkBoxValidation.bind(this));
            } else {
                formCheckBoxArray = this.fb.array([]);
            }
            question.options.forEach((option) => {
                if (option.showOption) {
                    formCheckBoxArray.push(
                        this.fb.control(
                            value && value.length ? (value[0] ? (value.indexOf(option.value) >= 0 ? true : false) : false) : false,
                        ),
                    );
                }
            });

            formGroup = this.fb.group({
                element: formCheckBoxArray,
            });
        } else {
            if (required) {
                formGroup = this.fb.group({
                    element: [value && value.length ? (value.length === 1 ? value[0] : value) : null, Validators.required],
                });
            } else {
                formGroup = this.fb.group({
                    element: [value && value.length ? (value.length === 1 ? value[0] : value) : null],
                });
            }
        }
        return formGroup;
    }

    checkBoxValidation(formArray: FormArray): any {
        const totalSelected = formArray.controls.filter((control) => control.value);
        return totalSelected.length >= 1 ? null : { required: true };
    }

    onNext(): void {
        if (this.form.valid) {
            const responses = this.getResponses();
            this.dialogRef.close({ action: "submit", responses: responses });
        } else {
            this.showError = true;
        }
    }

    getResponses(): any {
        const responses = [];
        this.stepsData.forEach((stepData) => {
            const value = [];
            if (
                stepData.showStep &&
                (stepData.step.question.inputType === InputType.CHECKBOX ||
                stepData.step.question.inputType === InputType.RADIO ||
                stepData.step.question.inputType === InputType.SELECT
                    ? stepData.step.question.options.length && stepData.step.question.options[0].value
                    : true)
            ) {
                if (stepData.step.question.inputType === InputType.CHECKBOX) {
                    const showedOptions = stepData.step.question.options.filter((option) => option.showOption);
                    this.form.value[stepData.step.question.id].element.forEach((selectedValue, i) => {
                        if (selectedValue) {
                            value.push(showedOptions[i].value);
                        }
                    });
                } else {
                    value.push(this.form.value[stepData.step.question.id].element);
                    if (stepData.step.question.inputType === InputType.RADIO && value.length) {
                        const selectedOption = stepData.step.question.options.filter((option) => option.value === value[0]);
                    }
                }
                const response: ApplicationResponse = {
                    stepId: stepData.step.id,
                    value: value,
                    key: stepData.step.question.key,
                    type: ContraintsType.QUESTION,
                    planQuestionId: stepData.step.question.id,
                };
                responses.push(response);
            }
        });
        return responses;
    }

    onCancel(): void {
        this.dialogRef.close({ action: "cancel" });
    }

    checkOptionConstraints(option: any): boolean {
        return option.constraints.length
            ? this.stepResponses.length
                ? this.checkAndOrConstraints(option.constraints, this.stepResponses, AppSettings.AND)
                : true
            : true;
    }

    hideAndShowQuestions(): void {
        this.stepResponses = this.getResponses().filter((response) => response.value);
        this.stepsData.forEach((stepData) => {
            let previousResponse;
            if (this.stepResponses) {
                previousResponse = this.stepResponses.find((resp) => resp.planQuestionId === stepData.step.question.id);
            }
            let previousValue = null;
            if (previousResponse) {
                previousValue = previousResponse.value;
            }
            let showStep = stepData.showStep;
            let required = stepData.step.question.required;
            if (
                stepData.step &&
                stepData.step.question &&
                stepData.step.question.hideUnlessConstraint &&
                stepData.step.question.hideUnlessConstraint.length
            ) {
                const aloneConstraints = stepData.step.question.hideUnlessConstraint.filter((constraint) => constraint.aloneSatisfies);
                const andConstraints = stepData.step.question.hideUnlessConstraint.filter((constraint) => !constraint.aloneSatisfies);
                if (aloneConstraints.length) {
                    showStep = this.checkAloneConstraints(aloneConstraints);
                } else if (andConstraints.length) {
                    showStep = !this.checkAndConstraints(andConstraints);
                }
            }
            if (
                stepData.step &&
                stepData.step.question &&
                stepData.step.question.requiredConstraint &&
                stepData.step.question.requiredConstraint.length
            ) {
                const aloneConstraints = stepData.step.question.requiredConstraint.filter((constraint) => constraint.aloneSatisfies);
                const andConstraints = stepData.step.question.requiredConstraint.filter((constraint) => !constraint.aloneSatisfies);
                if (aloneConstraints.length) {
                    required = this.checkAloneConstraints(aloneConstraints);
                } else if (andConstraints.length) {
                    required = !this.checkAndConstraints(andConstraints);
                }
            }
            const showStepConstraintFlag = !this.skipOnConstraints(stepData.step.constraintAggregates, previousResponse);
            if (showStep && !showStepConstraintFlag) {
                showStep = false;
            }
            if (showStep !== stepData.showStep || required !== stepData.step.question.required) {
                stepData.showStep = showStep;
                stepData.step.question.required = required;
                if (!stepData.showStep) {
                    previousValue = null;
                    stepData.step.question.required = false;
                    this.stepResponses.forEach((resp) => {
                        if (resp.planQuestionId === stepData.step.question.id) {
                            resp.value = null;
                        }
                    });
                }
                this.form.removeControl(stepData.step.question.id);
                this.form.addControl(
                    stepData.step.question.id,
                    this.addQuestionGroup(stepData.step.question.required, previousValue, stepData.step.question),
                );
            }
        });
    }

    /**
     * @param constraint contains skip/show constraint for the question
     * @param allResponses contains the responses for these questions
     * @returns Boolean based on constraint passed or not
     */
    skipOnConstraints(constraint: ConstraintAggregates, allResponses: ResponsePanel): boolean {
        if (constraint.skip.and || constraint.show.and) {
            this.skipAndConstraintValue = true;
            this.skipOrConstraintValue = true;
            this.showAndConstraintValue = true;
            this.showOrConstraintValue = true;
            if (constraint.skip.and) {
                const andConstraints = constraint.skip.and.constraints;
                const orConstraints = constraint.skip.and.or.constraints;
                this.skipAndOrConstraint(andConstraints, orConstraints, allResponses);
                if (this.skipAndConstraintValue && this.skipOrConstraintValue && (orConstraints.length || andConstraints.length)) {
                    return true;
                }
            }
            if (constraint.show.and) {
                const andConstraints = constraint.show.and.constraints;
                const orConstraints = constraint.show.and.or.constraints;
                const showAndOrFlag = this.showAndOrConstraint(andConstraints, orConstraints, allResponses);
                if (showAndOrFlag) {
                    return true;
                }
            }
            return false;
        }
        return false;
    }

    /**
     * @param andConstraints SKIP AND constraints for the question
     * @param orConstraints SKIP OR constraints for the question
     * @param allResponses response for the question
     */
    skipAndOrConstraint(andConstraints: Contraints[], orConstraints: Contraints[], allResponses: ResponsePanel): void {
        if (andConstraints.length) {
            this.skipAndConstraintValue = this.checkAndOrConstraints(andConstraints, allResponses ? allResponses : null, AppSettings.AND);
        } else {
            this.skipAndConstraintValue = true;
        }
        if (orConstraints.length) {
            this.skipOrConstraintValue = this.checkAndOrConstraints(orConstraints, allResponses ? allResponses : null, AppSettings.OR);
        } else {
            this.skipOrConstraintValue = true;
        }
    }

    /**
     * @param andConstraints SHOW AND constraints for the question
     * @param orConstraints SHOW OR constraints for the question
     * @param allResponses response for the question
     * @returns boolean value based on constraint passed or not
     */
    showAndOrConstraint(andConstraints: Contraints[], orConstraints: Contraints[], allResponses: ResponsePanel): boolean {
        if (andConstraints.length) {
            this.showAndConstraintValue = this.checkAndOrConstraints(andConstraints, allResponses ? allResponses : null, AppSettings.AND);
            if (!this.showAndConstraintValue) {
                return true;
            }
        }
        if (orConstraints.length) {
            this.showOrConstraintValue = this.checkAndOrConstraints(orConstraints, allResponses ? allResponses : null, AppSettings.OR);
            if (!this.showOrConstraintValue) {
                return true;
            }
        }
        return false;
    }

    checkAloneConstraints(aloneConstraints: any): boolean {
        let constraintPass = false;
        aloneConstraints.forEach((constraint) => {
            const answered = this.stepResponses.filter((response) => response.questionId === constraint.questionId);
            if (
                answered &&
                answered.length &&
                answered[0].value &&
                answered[0].value.length &&
                answered[0].value[0] &&
                answered[0].value.indexOf(constraint.response) >= 0
            ) {
                constraintPass = true;
            }
        });
        return constraintPass;
    }

    checkAndConstraints(andConstraints: any): boolean {
        let constraintFailed = false;
        andConstraints.forEach((constraint) => {
            const answered = this.stepResponses.filter((response) => response.questionId === constraint.questionId);
            if (
                !(
                    answered &&
                    answered.length &&
                    answered[0].value &&
                    answered[0].value.length &&
                    answered[0].value[0] &&
                    answered[0].value.indexOf(constraint.response) >= 0
                )
            ) {
                constraintFailed = true;
            }
        });
        return constraintFailed;
    }

    getShowedOptions(options: Option[]): Option[] {
        return options.filter((option) => option.showOption);
    }

    checkAndOrConstraints(constraints: any, response: any, type: string): boolean {
        let constraintPass = false;
        let returnValue = constraintPass;
        for (const constraint of constraints) {
            constraintPass = this.checkConstraint(constraint, response);
            returnValue = constraintPass;
            if (type === AppSettings.OR && constraintPass) {
                returnValue = true;
                break;
            }
            if (type === AppSettings.AND && !constraintPass) {
                returnValue = false;
                break;
            }
        }
        return returnValue;
    }

    // eslint-disable-next-line complexity
    checkConstraint(constraint: any, responses: any): boolean {
        let selectedValue;
        let savedResponse;
        switch (constraint.type) {
            case ContraintsType.QUESTION:
                savedResponse = responses
                    .filter((response) => response.type === StepType.QUESTION && response.questionId === constraint.questionId)
                    .pop();
                if (savedResponse && savedResponse.value.length) {
                    selectedValue = savedResponse.value[0];
                }
                break;
            case ContraintsType.BENEFIT_AMOUNT:
                savedResponse = responses.filter((response) => response.type === StepType.PLANOPTIONS).pop();
                if (savedResponse && savedResponse.value.length) {
                    selectedValue = savedResponse.value[0].benefitAmount;
                }
                break;
            case ContraintsType.COVERAGE_LEVEL:
                savedResponse = responses.filter((response) => response.type === StepType.PLANOPTIONS).pop();
                if (savedResponse && savedResponse.value.length) {
                    selectedValue = savedResponse.value[0].coverageLevelId;
                }
                break;
            case ContraintsType.IS_ADDITION:
            case ContraintsType.IS_CONVERSION:
            case ContraintsType.IS_DOWNGRADE:
            case ContraintsType.IS_REINSTATEMENT:
            case ContraintsType.REINSTATEMENT_IS_REQUIRED:
            case ContraintsType.IS_GI:
            case ContraintsType.TOBACCO_RESPONSE:
            case ContraintsType.IS_ADDITION_ELIGIBLE:
            case ContraintsType.IS_CONVERSION_ELIGIBLE:
            case ContraintsType.IS_DOWNGRADE_ELIGIBLE:
            case ContraintsType.IS_REINSTATEMENT_ELIGIBLE:
                selectedValue = false;
                break;
        }
        let returnValue;
        // TODO - Need to make changes to remove this once flow is in place
        if (selectedValue === undefined || constraint.value === undefined || selectedValue === null) {
            if (constraint.type === ContraintsType.QUESTION) {
                returnValue = false;
            } else {
                returnValue = true;
            }
        } else {
            returnValue = this.checkOperation(selectedValue, constraint.value, constraint.operation);
        }
        return returnValue;
    }

    checkOperation(selectedValue: any, constraintValue: any, operation: Operation): boolean {
        let returnValue = false;
        switch (operation) {
            case Operation.EQUALS:
                if (selectedValue.toString().toUpperCase() === constraintValue.toString().toUpperCase()) {
                    returnValue = true;
                }
                break;
            case Operation.NOT_EQUALS:
                if (selectedValue.toString().toUpperCase() !== constraintValue.toString().toUpperCase()) {
                    returnValue = true;
                }
                break;
            case Operation.LESS_THAN:
                if (+selectedValue < +constraintValue) {
                    returnValue = true;
                }
                break;
            case Operation.GREATER_THAN:
                if (+selectedValue > +constraintValue) {
                    returnValue = true;
                }
                break;
            case Operation.LESS_THAN_OR_EQUALS:
                if (+selectedValue <= +constraintValue) {
                    returnValue = true;
                }
                break;
            case Operation.GREATER_THAN_OR_EQUALS:
                if (+selectedValue >= +constraintValue) {
                    returnValue = true;
                }
                break;
            default:
                returnValue = true;
        }
        return returnValue;
    }

    /**
     * unsubscribes/ cleans up before component is destroyed
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
