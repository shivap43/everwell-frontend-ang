import { Component, Input } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { LanguageService } from "@empowered/language";
@Component({
    selector: "empowered-ag-individual-form",
    templateUrl: "./ag-individual-form.component.html",
    styleUrls: ["./ag-individual-form.component.scss"],
})
export class AgIndividualFormComponent {
    // form group for link account step
    @Input() linkAccounts: FormGroup;
    // flag to check AI only scenario
    @Input() isAiOnly?: boolean;
    // collection of locales
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.aflacgroup.importaccount.individual.title",
        "primary.portal.aflacgroup.importaccount.individual.choice",
        "primary.portal.aflacgroup.importaccount.individual.linkOption",
        "primary.portal.aflacgroup.importaccount.individual.createAccount",
        "primary.portal.aflacgroup.importaccount.individual.hintInfo",
        "primary.portal.aflacgroup.importaccount.individual.linkAflacGroup",
        "primary.portal.aflacgroup.importaccount.individual.cantLinkAflacgroup",
        "primary.portal.aflacgroup.importaccount.individual.agGroupTitle",
    ]);

    /**
     * constructor of class
     * @param language injection of language service
     */
    constructor(private readonly language: LanguageService) {}
}
