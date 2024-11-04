import { Component, Input } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { AccountProducer } from "@empowered/constants";

@Component({
    selector: "empowered-ag-individual-second",
    templateUrl: "./ag-individual-second.component.html",
    styleUrls: ["./ag-individual-second.component.scss"],
})
export class AgIndividualSecondComponent {
    // collection of primary producer
    @Input() primaryProducer: AccountProducer[];
    // flag to check Ai only scenario.
    @Input() isAiOnly?: boolean;
    // collection of locales
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.aflacgroup.importaccount.individual.title",
        "primary.portal.aflacgroup.importaccount.individual.contact",
        "primary.portal.aflacgroup.importaccount.individual.linkWarning",
        "primary.portal.aflacgroup.importaccount.individual.createAccount",
        "primary.portal.aflacgroup.importaccount.individual.agGroupTitle",
        "primary.portal.aflacgroup.importaccount.individual.aflacGroupLinkWarning",
        "primary.portal.aflacgroup.importaccount.individual.aflacGroupNewAccount",
    ]);
    /**
     * Constructor of class
     * @param language language service injection
     */
    constructor(private readonly language: LanguageService) {}
}
