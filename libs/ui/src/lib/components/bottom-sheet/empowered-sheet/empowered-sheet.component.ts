import { Component } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { EmpoweredSheetService } from "@empowered/common-services";

@Component({
    selector: "empowered-sheet",
    templateUrl: "./empowered-sheet.component.html",
    styleUrls: ["./empowered-sheet.component.scss"],
})
export class EmpoweredSheetComponent {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(["primary.portal.common.cancel"]);

    constructor(private readonly sheetService: EmpoweredSheetService, private readonly language: LanguageService) {}

    close(): void {
        this.sheetService.dismissSheet();
    }
}
