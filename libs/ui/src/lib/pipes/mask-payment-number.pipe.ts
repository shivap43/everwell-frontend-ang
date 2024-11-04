import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "maskPayment",
    pure: true,
})
export class MaskPaymentPipe implements PipeTransform {
    transform(digits: number, length: number): string | number {
        let returnValue = null;
        if (digits) {
            const digitsLength = digits.toString().length;
            if (digitsLength >= length) {
                returnValue = "*".repeat(digitsLength - 4) + digits.toString().substr(digitsLength - 4);
            } else {
                returnValue = digits;
            }
        }
        return returnValue;
    }
}
