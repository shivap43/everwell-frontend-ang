import { Pipe, PipeTransform } from "@angular/core";
import { PayFrequency, MemberFlexDollar, ContributionType } from "@empowered/constants";

const PERCENTAGE_BASE = 100;
const NEW_YORK_ABBR = "NY";
const OHIO_ABBR = "OH";

/**
 * Pipe to transform total cost by subtracting flex amount.
 */
@Pipe({
    name: "flexDollar",
})
export class FlexDollarPipe implements PipeTransform {
    /**
     * calculates the total cost by subtracting the flex cost
     * @param value : original cost
     * @param flexDollar : flex dollar array
     * @param payFrequency : payFrequency of the member
     * @param enrollmentState : enrollment state for member
     * @returns number: cost after subtracting the flex dollar amount
     */
    transform(value: number, flexDollar: MemberFlexDollar[], payFrequency?: PayFrequency, enrollmentState?: string): number {
        if (value > 0 && flexDollar && flexDollar.length && enrollmentState !== OHIO_ABBR && enrollmentState !== NEW_YORK_ABBR) {
            let flexAmount = 0;
            let percentageAmount = 0;
            let flatAmount = 0;
            flexDollar.forEach((flex) => {
                if (flex.contributionType === ContributionType.PERCENTAGE) {
                    percentageAmount += flex.amount;
                }
                if (flex.contributionType === ContributionType.FLAT_AMOUNT) {
                    flatAmount += flex.currentAmount ? flex.currentAmount : flex.amount;
                }
            });
            flexAmount = (value * percentageAmount) / PERCENTAGE_BASE + flatAmount;
            return value > flexAmount ? value - flexAmount : 0;
        }
        return value;
    }
}
