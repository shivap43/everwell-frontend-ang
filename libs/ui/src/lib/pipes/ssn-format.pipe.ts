import { Pipe, PipeTransform } from "@angular/core";

const SSN_MIN_LENGTH = 9;

@Pipe({
    name: "ssn",
})
/**
 * Converts SSN to the <AAA>-<GG>-<SSSS> format.
 * Example: <p>{{123456789 | ssn }}</p> => 123-45-6789
 */
export class SsnFormatPipe implements PipeTransform {
    transform(value: string, ssnSplitFormat: RegExp): string {
        return ssnSplitFormat && value?.length === SSN_MIN_LENGTH ? value.replace(ssnSplitFormat, "$1-$2-$3") : value;
    }
}
