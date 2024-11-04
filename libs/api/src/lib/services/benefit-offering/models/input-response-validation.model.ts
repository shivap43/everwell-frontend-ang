import { InputResponseValidationFormat } from "../enums/input-response-validation-format.enum";
export interface InputResponseValidation {
    minValue: number;
    maxValue: number;
    minLength: number;
    maxLength: number;
    format: InputResponseValidationFormat;
}
