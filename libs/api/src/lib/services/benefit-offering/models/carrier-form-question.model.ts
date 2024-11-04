import { CarrierFormQuestionDisplay } from "./carrier-form-question-display.model";
import { CarrierFormQuestionDependency } from "./carrier-form-question-dependency.model";
import { CarrierFormQuestionHideUnless } from "./carrier-form-question-hide-unless.model";
import { InputResponseValidation } from "./input-response-validation.model";
import { DateType } from "../enums/date-type.enum";
import { CarrierFormQuestionType } from "../enums/carrier-form-question-type.enum";

export interface CarrierFormQuestion {
    id: number;
    text: string;
    name: string;
    prepopulatedValue: string;
    type: CarrierFormQuestionType;
    readOnly: boolean;
    required: boolean;
    display: CarrierFormQuestionDisplay;
    dependencies: CarrierFormQuestionDependency[];
    hideUnless: CarrierFormQuestionHideUnless[];
    options?: QuestionOption[];
}
export interface InputResponse {
    isprepopulated: boolean;
    response: string;
}
export interface ChoiceResponse {
    isprepopulated: boolean;
    questionResponseId: number;
}
export interface QuestionOption {
    value: string;
    text: string;
    questionResponseId: number;
    isPrepopulated?: boolean;
}
export interface HyperlinkQuestion extends CarrierFormQuestion {
    link: string;
}
export interface InputQuestion extends CarrierFormQuestion {
    name: string;
    prepopulatedValue: string;
    validation: InputResponseValidation;
    response?: InputResponse;
}
export interface ChoiceQuestion extends CarrierFormQuestion {
    prepopulatedValue: string;
    options: QuestionOption[];
    responses?: ChoiceResponse[];
}
export interface DatepickerQuestion extends CarrierFormQuestion {
    dateType: DateType;
    placeholder: string;
    response?: InputResponse;
}
export interface FileQuestion extends CarrierFormQuestion {
    response?: InputResponse;
}
