import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "maskPayment",
})
export class MockMaskPaymentPipe implements PipeTransform {
    transform(digits: number, length: number): string | number {
        return "**123";
    }
}
