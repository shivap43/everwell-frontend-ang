import { Pipe, PipeTransform } from "@angular/core";
import { BeneficiaryModel } from "@empowered/constants";

@Pipe({
    name: "optionFilter",
    pure: false,
})
export class FilterOptionPipe implements PipeTransform {
    /**
     * Filter the list of beneficiaries based on selection and return an array of non-selected beneficiaries
     * @param options List of beneficiaries of type BeneficiaryModel
     * @param selection List of selected beneficiaries
     * @param index index of the form control dropdown
     * @returns List of non-selected beneficiaries of type BeneficiaryModel
     */
    transform(options: BeneficiaryModel[], selection: BeneficiaryModel[], index: number): BeneficiaryModel[] {
        const selectedBeneficiary = selection[index];
        return options.filter(
            (option) =>
                // true if option is not already selected
                selection.every((beneficiary) => beneficiary && beneficiary.id !== option.id) ||
                // true if option is selected in current row
                (selectedBeneficiary &&
                    (selectedBeneficiary.id === option.id ||
                        (selectedBeneficiary.dependentId && selectedBeneficiary.dependentId === option.dependentId))),
        );
    }
}
