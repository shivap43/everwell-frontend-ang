import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "payrollFrequencyCalculator",
})
export class MockPayrollFrequencyCalculatorPipe implements PipeTransform {
    transform(value: any, mapObj: any) {
        return value;
    }
}
