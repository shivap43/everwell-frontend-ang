import { Pipe, PipeTransform } from "@angular/core";
import { CarrierType } from "@empowered/constants";

@Pipe({
    name: "aflacLegalName",
})
export class AflacLegalNamePipe implements PipeTransform {
    /**
     * To convert the Aflac name to the proper legal name
     * @param carriers - String which contains a list of carriers displayed,
     * comma separated inside another field, default is the "name" key.
     * @param legalNameValue - Legal name to use for Aflac.
     * @returns {string} - List of carriers will now contain the Aflac legal name, plus other carriers, separated by semicolons.
     */
    transform(carriers: string, legalNameValue: string): string {
        // Split into an array and sort
        let carriersArray = carriers.split(",").map((carrierName) => (carrierName.trim())).sort();
        // If Aflac carrier exists put Aflac carrier name first
        if (carriersArray.some((carrierName) => (carrierName === CarrierType.AFLAC_CARRIER))) {
            carriersArray = carriersArray.filter((carrierName) => (carrierName !== CarrierType.AFLAC_CARRIER));
            carriersArray.unshift(legalNameValue);
        }
        return carriersArray.join("; ");
    }
}
