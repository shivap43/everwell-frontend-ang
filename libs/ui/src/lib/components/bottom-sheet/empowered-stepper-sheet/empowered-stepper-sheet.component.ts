import { Component } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { EmpoweredSheetService } from "@empowered/common-services";

@Component({
    selector: "empowered-stepper-sheet",
    templateUrl: "./empowered-stepper-sheet.component.html",
    styleUrls: ["./empowered-stepper-sheet.component.scss"],
})
export class EmpoweredStepperSheetComponent {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(["primary.portal.common.cancel"]);

    constructor(private readonly sheetService: EmpoweredSheetService, private readonly language: LanguageService) {}

    /**
     * Closes the bottom sheet
     */
    close(): void {
        this.sheetService.dismissSheet();
    }
}
