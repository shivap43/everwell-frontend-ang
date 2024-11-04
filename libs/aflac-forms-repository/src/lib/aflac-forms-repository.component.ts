import { Component } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { FormsRepository } from "@empowered/api";

@Component({
    selector: "empowered-aflac-forms-repository",
    templateUrl: "./aflac-forms-repository.component.html",
    styleUrls: ["./aflac-forms-repository.component.scss"],
})
export class AflacFormsRepositoryComponent {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.formRepository.aflacForms",
    ]);
    formsList: FormsRepository[] = [];
    enableSpinner = false;
    constructor(private readonly language: LanguageService) {}
}
