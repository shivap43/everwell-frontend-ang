import { Pipe, PipeTransform } from "@angular/core";
import { PayFrequencyObject, EnrollmentConstants } from "@empowered/constants";

@Pipe({
    name: "payrollFrequencyCalculator",
})
export class PayrollFrequencyCalculatorPipe implements PipeTransform {
    /**
     * Method to calculate price based on PayFrequencyObject
     * @param value - Price to be calculated
     * @param pfObject - Based on Pay frequency object price will be calculated
     * @returns Calculated Price based on Pay frequency
     */
    transform(value: number, pfObject?: PayFrequencyObject): number {
        pfObject.payFrequencies.forEach((item) => {
            if (item.name.toUpperCase() === pfObject.pfType.toUpperCase()) {
                value = (value * pfObject.payrollsPerYear) / item.payrollsPerYear;
            }
        });
        // rounding off to 4 decimals to be in sync with backend pay frequency calculation
        return +value.toFixed(EnrollmentConstants.PRODUCT_COST_PRECISION);
    }
}
