import { Component } from "@angular/core";
import { Store } from "@ngxs/store";
import { LanguageModel } from "@empowered/api";
import { LanguageService, LanguageState } from "@empowered/language";

@Component({
    selector: "empowered-company-structure",
    templateUrl: "./company-structure.component.html",
    styleUrls: ["./company-structure.component.scss"],
})
export class CompanyStructureComponent {
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(["primary.portal.classes.ruleStructure"]);

    constructor(private readonly store: Store, private readonly language: LanguageService) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
    }
}
