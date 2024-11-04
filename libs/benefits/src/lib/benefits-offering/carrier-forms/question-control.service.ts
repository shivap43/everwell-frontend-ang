import { CurrencyPipe, DatePipe } from "@angular/common";
import {
    CarrierFormQuestionType,
    InputResponseValidation,
    InputResponseValidationFormat,
    CarrierFormQuestionDisplayStyle,
    DateType,
    CarrierFormQuestionDependency,
    CarrierFormQuestion,
    QuestionOption,
} from "@empowered/api";
import { Injectable } from "@angular/core";
import { Validators, FormGroup, ValidatorFn, FormBuilder, AbstractControlOptions, AbstractControl, ValidationErrors } from "@angular/forms";
import { AppSettings, DateFormats } from "@empowered/constants";
import { CustomValidation } from "@empowered/ui";
import { DateService } from "@empowered/date";

const blank = "";
const COMMA = ",";
const OPTIONS = "options";
const RESPONSE = "response";
const RESPONSES = "responses";
const PREPOPULATED_VALUE = "prepopulatedValue";

@Injectable()
export class QuestionControlService {
    validationFormatToValidatorMap: { [key: string]: ValidatorFn[] } = {
        [InputResponseValidationFormat.NUMERIC]: [CustomValidation.numericValidator],
        [InputResponseValidationFormat.ALPHANUMERIC]: [CustomValidation.alphanumericValidator(false)],
        [InputResponseValidationFormat.PHONE]: [CustomValidation.checkPhoneValidation],
        [InputResponseValidationFormat.ZIP_CODE]: [CustomValidation.zipCodeValidator],
        [InputResponseValidationFormat.TAX_ID]: [
            CustomValidation.taxIDValidator,
            Validators.minLength(AppSettings.MAX_LENGTH_9),
            Validators.maxLength(AppSettings.MAX_LENGTH_9),
        ],
        [InputResponseValidationFormat.SSN]: [CustomValidation.ssnValidator, Validators.minLength(9)],
        [InputResponseValidationFormat.ALPHANUMERIC_SPACES]: [CustomValidation.alphanumericValidator(true)],
        [InputResponseValidationFormat.ALPHA_SPACES]: [CustomValidation.alphabeticalValidator(true)],
        [InputResponseValidationFormat.ALPHA]: [CustomValidation.alphabeticalValidator(false)],
        [InputResponseValidationFormat.EMAIL]: [CustomValidation.checkEmailValidation],
        [InputResponseValidationFormat.ALPHA_HYPENS_APOSTROPHES_SPACE]: [CustomValidation.alphaHypensApostrophesSpaceValidator],
        [InputResponseValidationFormat.ALPHA_HYPENS_APOSTROPHES_PERIOD_SPACE]: [
            CustomValidation.alphaHypensApostrophesPeriodSpaceValidator,
        ],
        [InputResponseValidationFormat.ALPHANUMERIC_HYPENS_APOSTROPHES_SPACE]: [
            CustomValidation.alphanumericHypensApostrophesSpaceValidator,
        ],
        [InputResponseValidationFormat.COMPANY_NAME]: [CustomValidation.checkCompanyNameValidation],
        [InputResponseValidationFormat.ADDRESS]: [CustomValidation.checkAddressValidation],
        [InputResponseValidationFormat.FIRST_NAME]: [CustomValidation.nameValidator],
        [InputResponseValidationFormat.LAST_NAME]: [CustomValidation.nameValidator],
        [InputResponseValidationFormat.CITY]: [CustomValidation.checkCityValidation],
    };

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly currencyPipe: CurrencyPipe,
        private readonly datePipe: DatePipe,
        private readonly dateService: DateService,
    ) {}

    /**
     * @description converts the given array of questions to FormGroup with functionality for each question type.
     * @param questions {Array<CarrierFormQuestion>} set of questions for the carrier forms.
     * @param fullTimeId fullTime question id
     * @param partTimeId partTime question id
     * @param groupReplacementId group replacement question id
     * @param agentReplacementId agent replacement question id
     * @returns {FormGroup} a FormGroup for the carrier form.
     */
    toFormGroup(
        questions: Array<CarrierFormQuestion>,
        fullTimeId: string,
        partTimeId: string,
        groupReplacementId: string,
        agentReplacementId: string,
    ): FormGroup {
        const group: any = {};
        questions.forEach((question) => {
            let validationObj;
            const questionValidation: InputResponseValidation = question["validation"];
            let value = this.getPrepopulatedQuestionValue(question);
            if (question.type === CarrierFormQuestionType.CURRENCY) {
                // eslint-disable-next-line no-useless-escape
                const temp = (value as string).replace(/\,/g, "");
                const currencyAsNum = temp.split("$");
                const numPosition = currencyAsNum.length === 1 ? 0 : 1;
                value = this.currencyPipe.transform(+currencyAsNum[numPosition]);
            }
            if (question.type === CarrierFormQuestionType.TEXT || question.type === CarrierFormQuestionType.INPUT) {
                validationObj = questionValidation ? questionValidation : null;
            }
            const validators: ValidatorFn[] = this.updateValidators(
                question.required && question.type !== CarrierFormQuestionType.TEXT,
                false,
                validationObj,
                false,
                question["dateType"],
                question,
            );
            const formState: any = { value: value, disabled: question.readOnly };
            const validatorOrOpts: ValidatorFn | ValidatorFn[] | AbstractControlOptions = {
                validators: validators,
            };
            if (
                question.type === CarrierFormQuestionType.RADIO ||
                question.type === CarrierFormQuestionType.CHECKBOX ||
                (questionValidation && questionValidation.format === InputResponseValidationFormat.PHONE) ||
                question.type === CarrierFormQuestionType.CURRENCY
            ) {
                validatorOrOpts.updateOn = "change";
            }

            group[question.id] = this.formBuilder.control(formState, validatorOrOpts);
        });
        return this.formBuilder.group(group, {
            validators: this.validate(fullTimeId, partTimeId, groupReplacementId, agentReplacementId, questions),
            updateOn: "blur",
        });
    }

    /**
     * @description Custom form validations
     * @param fullTimeId fullTime question id
     * @param partTimeId partTime question id
     * @param groupReplacementId group replacement question id
     * @param agentReplacementId agent replacement question id
     * @param questions career form questions array
     * @returns ValidationErrors
     */
    validate(
        fullTimeId: string,
        partTimeId: string,
        groupReplacementId: string,
        agentReplacementId: string,
        questions: Array<CarrierFormQuestion>,
    ): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (fullTimeId && partTimeId) {
                this.workTimeValidation(control, fullTimeId, partTimeId);
            }
            if (groupReplacementId && agentReplacementId) {
                this.replacementQuestionValidation(control, groupReplacementId, agentReplacementId, questions);
            }
            return null;
        };
    }

    /**
     * Validating fullTime and partTime input field's for not accepting zero at both place simultaneously
     * @param control Form abstract control
     * @param fullTimeId fullTime question id
     * @param partTimeId partTime question id
     */
    workTimeValidation(control: AbstractControl, fullTimeId: string, partTimeId: string): void {
        const fullTime = control.get(fullTimeId)?.value ? +control.get(fullTimeId).value : null;
        const partTime = control.get(partTimeId)?.value ? +control.get(partTimeId).value : null;
        const fullTimeErrors = control.get(fullTimeId)?.errors || null;
        const partTimeErrors = control.get(partTimeId)?.errors || null;
        if (partTime === 0 && fullTime === 0) {
            control.get(fullTimeId).setErrors({ ...fullTimeErrors, zeroAtBothPlaceInvalid: true });
            control.get(partTimeId).setErrors({ ...partTimeErrors, zeroAtBothPlaceInvalid: true });
        } else if (
            partTime !== 0 ||
            (fullTime !== 0 &&
                (control.get(fullTimeId).errors?.zeroAtBothPlaceInvalid || control.get(partTimeId).errors?.zeroAtBothPlaceInvalid))
        ) {
            let fullTimeError = { ...control.get(fullTimeId)?.errors };
            delete fullTimeError?.zeroAtBothPlaceInvalid;
            fullTimeError = Object.keys(fullTimeError).length > 0 ? fullTimeError : null;
            control.get(fullTimeId)?.setErrors(fullTimeError);

            let partTimeError = { ...control.get(partTimeId)?.errors };
            delete partTimeError?.zeroAtBothPlaceInvalid;
            partTimeError = Object.keys(partTimeError).length > 0 ? partTimeError : null;
            control.get(partTimeId)?.setErrors(partTimeError);
        }
    }

    /**
     * Validate group and agent replacement question response and throw error if responses mismatch
     * @param control Form abstract control
     * @param groupReplacementId group replacement question id
     * @param agentReplacementId agent replacement question id
     * @param questions career form questions array
     * @returns ValidationErrors
     */
    replacementQuestionValidation(
        control: AbstractControl,
        groupReplacementId: string,
        agentReplacementId: string,
        questions: Array<CarrierFormQuestion>,
    ): void {
        const groupResponse = control.get(groupReplacementId)?.value ? +control.get(groupReplacementId).value : null;
        const agentResponse = control.get(agentReplacementId)?.value ? +control.get(agentReplacementId).value : null;
        if (groupResponse && agentResponse) {
            const groupQuesErrors = control.get(groupReplacementId)?.errors || null;
            const agentQuesErrors = control.get(agentReplacementId)?.errors || null;
            const groupValue = questions
                .find((question) => question.id === +groupReplacementId)
                .options.find((option) => option.questionResponseId === groupResponse).value;
            const agentValue = questions
                .find((question) => question.id === +agentReplacementId)
                .options.find((option) => option.questionResponseId === agentResponse).value;
            if (groupValue !== agentValue) {
                control.get(groupReplacementId).setErrors({ ...groupQuesErrors, replacementAnswerMismatch: true });
                control.get(agentReplacementId).setErrors({ ...agentQuesErrors, replacementAnswerMismatch: true });
            } else {
                let groupValueError = { ...control.get(groupReplacementId)?.errors };
                delete groupValueError?.replacementAnswerMismatch;
                groupValueError = Object.keys(groupValueError).length ? groupValueError : null;
                control.get(groupReplacementId)?.setErrors(groupValueError);

                let agentValueError = { ...control.get(agentReplacementId)?.errors };
                delete agentValueError?.replacementAnswerMismatch;
                agentValueError = Object.keys(agentValueError).length ? agentValueError : null;
                control.get(agentReplacementId)?.setErrors(agentValueError);
            }
        }
    }

    /**
     * @description update the validators for carrier form
     * @param {boolean} required if the form value is required
     * @param {boolean} submit if the form is to be submitted or saved
     * @param {InputResponseValidation} validations for the form field
     * @param {DataType} dateType date type either past, future or all
     * @param {boolean} requiredByDepQuestion if the validation is required by dependant questions
     * @param {Array<CarrierFormQuestion>} questions set of questions for the carrier forms.
     * @returns {ValidatorFn[]} validators added to the form control
     */
    updateValidators(
        required: boolean,
        submit: boolean,
        validation: InputResponseValidation,
        requiredByDepQuestion: boolean,
        dateType?: DateType,
        question?: CarrierFormQuestion,
    ): ValidatorFn[] {
        const validators = [];
        if (required && submit) {
            validators.push(Validators.required);
        }
        if (!required && requiredByDepQuestion && question.type !== CarrierFormQuestionType.TEXT) {
            validators.push(Validators.required);
        }
        if (dateType) {
            validators.push(this.addDatePickerValidator(dateType));
        }
        if (validation) {
            if (validation.minLength) {
                validators.push(Validators.minLength(validation.minLength));
            }
            if (validation.maxLength) {
                validators.push(Validators.maxLength(validation.maxLength));
            }
            if (validation.minValue !== null || validation.minValue !== undefined) {
                validators.push(Validators.min(validation.minValue));
            }
            if (validation.maxValue !== null || validation.maxValue !== undefined) {
                validators.push(Validators.max(validation.maxValue));
            }
            if (question && question.type === CarrierFormQuestionType.CURRENCY && this.validationFormatToValidatorMap[validation.format]) {
                validators.push(CustomValidation.currencyValidator);
            } else if (this.validationFormatToValidatorMap[validation.format]) {
                validators.push(...this.validationFormatToValidatorMap[validation.format]);
            }
        }
        return validators;
    }
    questionHasDependencies(question: CarrierFormQuestion): boolean {
        return (
            question &&
            question.dependencies &&
            question.dependencies
                .filter((dependency) => JSON.stringify(dependency) !== "{}")
                .filter((dependency) => dependency.questionId !== question.id).length >= 1
        );
    }
    isQuestionHiddenOrAbsent(question: CarrierFormQuestion): boolean {
        return !question || (question["questionsDisplay"] && question["questionsDisplay"].style) === CarrierFormQuestionDisplayStyle.HIDDEN;
    }

    /**
     * Determines if question in carrier form should be hidden.
     * @param dependency question that is depended upon by this question
     * @param questionValue value of dependency response
     */
    shouldHideQuestion(dependency: CarrierFormQuestionDependency, questionResponseText: string, questionValue: string): boolean {
        return (
            !(
                (questionResponseText || "").toLowerCase() === dependency.response.toLowerCase() ||
                (questionValue || "").toLowerCase() === dependency.response.toLowerCase()
            ) || questionValue === ""
        );
    }
    /**
     * @description set or clear
     * @param {boolean} set if validators are required to be set
     * @param {AbstractControl} formControl form control to set/ clear validations
     * @param {boolean} requiredByDepQuestion if the validation is required by dependant questions
     * @param {boolean} submit if form is to be submitted
     */
    setOrClearValidators(
        set: boolean,
        formControl: AbstractControl,
        requiredByDepQuestion: boolean,
        question?: CarrierFormQuestion,
        submit: boolean = true,
    ): void {
        if (set) {
            formControl.setValidators(
                this.updateValidators(
                    question.required && question.type !== CarrierFormQuestionType.TEXT,
                    submit,
                    question["validation"],
                    requiredByDepQuestion,
                    question["dateType"],
                    question,
                ),
            );
        } else {
            formControl.clearValidators();
        }
    }
    /**
     * @description handles the questions that has dependencies and set or clears the validators based on dependencies
     * @param form {FormGroup} the entire form
     * @param allCarrierformQuestionsAsObject {{ [key: string]: CarrierFormQuestion }} all the questions in the form
     * @param formControl {AbstractControl} the form control of the question
     * @param question the question in control from allCarrierformQuestionsAsObject
     * @return dependency function
     */
    dependencyHandler =
    (
        form: FormGroup,
        allCarrierformQuestionsAsObject: { [key: string]: CarrierFormQuestion },
        formControl: AbstractControl,
        question: CarrierFormQuestion,
    ) =>
        (dependency) => {
            const dependencyFormCtrl = form.get(dependency.questionId.toString());
            const dependencyQuestion = allCarrierformQuestionsAsObject[dependency.questionId];
            if (this.isQuestionHiddenOrAbsent(dependencyQuestion)) {
                this.setOrClearValidators(false, formControl, dependency.required, question);
            } else if (dependencyFormCtrl) {
                const dependencyValue = dependencyFormCtrl.value instanceof Array ? dependencyFormCtrl.value[0] : dependencyFormCtrl.value;
                const dependencyQuestionOption = dependencyQuestion[OPTIONS]
                    ? dependencyQuestion[OPTIONS].find((option) => option.questionResponseId.toString() === dependencyValue)
                    : "";
                const optionText = dependencyQuestionOption ? dependencyQuestionOption.text : "";
                const optionValue = dependencyQuestionOption ? dependencyQuestionOption.value : "";
                if (!dependencyValue || this.shouldHideQuestion(dependency, optionText, optionValue)) {
                    formControl.clearValidators();
                    formControl.updateValueAndValidity();
                    dependencyFormCtrl.updateValueAndValidity();
                } else if (dependency.flag) {
                    this.setOrClearValidators(true, formControl, question.required, question);
                } else {
                    this.setOrClearValidators(true, formControl, dependency.required, question);
                }
            } else {
                this.setOrClearValidators(false, formControl, dependency.required, question);
            }
        };

    /**
     * Checks form's controls' validity to determine whether form group is valid.
     * @param form form group being checked
     * @param submit whether user is attempting to submit form
     * @param allCarrierformQuestionsAsObject carrier form questions used to create form
     * @returns forms validity and, upon submission attempt, whether it was changed
     */
    isFormGroupValid(
        form: FormGroup,
        submit: boolean,
        allCarrierformQuestionsAsObject: { [key: string]: CarrierFormQuestion },
    ): { valid: boolean; changed?: boolean } {
        let okayToSave = true;
        let changed = false;
        for (const [questionId, formControl] of Object.entries(form.controls)) {
            const question = allCarrierformQuestionsAsObject[questionId];
            if (submit) {
                if (this.questionHasDependencies(question)) {
                    question.dependencies.forEach(this.dependencyHandler(form, allCarrierformQuestionsAsObject, formControl, question));
                } else {
                    this.setOrClearValidators(true, formControl, false, question);
                }
                formControl.markAsTouched();
            } else {
                this.setOrClearValidators(true, formControl, false, question, false);
                if (formControl.dirty) {
                    changed = true;
                }
                formControl.markAsDirty();
                if (formControl.value !== "" && formControl.invalid) {
                    okayToSave = false;
                    formControl.markAsTouched();
                }
            }
            if (!formControl.hasError("invalidZip")) {
                formControl.updateValueAndValidity();
            }
        }

        return submit ? { valid: form.valid } : { valid: okayToSave, changed: changed };
    }
    addDatePickerValidator(dateType: DateType): ValidatorFn {
        const today = new Date();
        return (control: AbstractControl): ValidationErrors | null => {
            let valid;
            if (control.value) {
                const d = this.dateService.toDate(control.value);
                switch (dateType) {
                    case DateType.FUTURE:
                        valid = this.dateService.checkIsAfter(d, today);
                        break;
                    case DateType.PAST:
                        valid = this.dateService.isBefore(d, today);
                        break;
                    default:
                        valid = true;
                }
                return valid ? null : { invalidDate: { value: control.value } };
            }
            return null;
        };
    }

    /**
     * Returns a value that question needs to be populated with.
     * This depends on the following fields in decreasing order of priority: response/s, prepopulatedValue, placeholder
     * This is a string[] in case of checkbox type questions because mat-selection-list needs an array as form control value
     * @param question CarrierFormQuestion
     * @returns string or array of strings that form field needs to be prepopulated with.
     */
    getPrepopulatedQuestionValue(question: CarrierFormQuestion): string | string[] {
        let value: string | string[];
        const questionPrepopulatedValue = question[PREPOPULATED_VALUE];
        const questionResponse = question[RESPONSE];
        if (
            question.type === CarrierFormQuestionType.CHECKBOX ||
            question.type === CarrierFormQuestionType.RADIO ||
            question.type === CarrierFormQuestionType.SELECT
        ) {
            value = this.populateChoiceQuestion(question);
        } else if (question.type === CarrierFormQuestionType.DATEPICKER && questionResponse) {
            // Date picker response is a string
            value = this.datePipe.transform(this.dateService.toDate(questionResponse), DateFormats.YEAR_MONTH_DAY);
        } else if (questionResponse && questionResponse.response) {
            // Input response is a InputResponse object
            value = questionResponse.response;
        } else if (questionPrepopulatedValue) {
            value = questionPrepopulatedValue;
        } else if (question["placeholder"]) {
            value = question["placeholder"];
        } else {
            value = blank;
        }
        if (question.type === CarrierFormQuestionType.CHECKBOX && value !== blank && typeof value === "string") {
            value = value.split(COMMA);
        }
        return value;
    }
    /**
     * Prepopulates choice-type questions
     * @param question CarrierFormQuestion
     * @returns string value that form field needs to be prepopulated with.
     */
    populateChoiceQuestion(question: CarrierFormQuestion): string {
        let value = "";
        const questionResponses = question[RESPONSES];
        const questionResponse = question[RESPONSE];
        const questionPrepopulatedValue = question[PREPOPULATED_VALUE];
        // If this is a checkbox question generate a string with comma-separated questionResponseIds.
        if (questionResponses && questionResponses.length) {
            value = questionResponses
                .map((choiceResponse) => choiceResponse.questionResponseId || choiceResponse.text || choiceResponse.response)
                .join(COMMA);
        } else if (questionResponse && questionResponse.response) {
            value = questionResponse.response;
        } else if (questionPrepopulatedValue) {
            let selectedOptions: QuestionOption[] = question[OPTIONS].filter((option) => questionPrepopulatedValue.includes(option.text));
            if (!selectedOptions.length) {
                selectedOptions = question[OPTIONS].filter((option) => questionPrepopulatedValue.includes(option.value));
            }
            if (selectedOptions.length) {
                /* some carrier form questions have a prepopulated value or response(s)
                set to either questionResponseId(s) or text(s), so it checks for both */
                value = selectedOptions.map((option) => option.questionResponseId && option.questionResponseId.toString()).join(COMMA);
                if (!value.length) {
                    value = selectedOptions.map((option) => option.text).join(COMMA);
                }
            }
        }
        const hasResponses = questionResponses.length !== 0;
        if (
            (question.type === CarrierFormQuestionType.SELECT && question[OPTIONS]) ||
            (question.type === CarrierFormQuestionType.RADIO && question[OPTIONS] && (!value || value.split(COMMA).length > 1))
        ) {
            if (!hasResponses) {
                // To select the prepopulated values for the radio options.
                value = question[OPTIONS].filter((option) => option.isPrepopulated === true)
                    .map((choiceResponse) => choiceResponse.questionResponseId)
                    .join(COMMA);
            } else {
                // To handle when responses has both true and false as prepopulated
                let isTruePresent = false;
                let isFalsePresent = false;
                questionResponses.forEach((choice) => {
                    if (choice.isPrepopulated) {
                        isTruePresent = true;
                    } else if (!choice.isPrepopulated) {
                        isFalsePresent = true;
                    }
                });
                if (isTruePresent && isFalsePresent) {
                    value = question[RESPONSES].filter((response) => response.isPrepopulated === false)
                        .map((choiceResponse) => choiceResponse.questionResponseId || choiceResponse.text || choiceResponse.response)
                        .join(COMMA);
                }
            }
        }
        return value;
    }
}
