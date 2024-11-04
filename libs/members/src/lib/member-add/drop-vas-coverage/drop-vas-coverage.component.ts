import { Component, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PortalType } from "@empowered/constants";

const CHECK_LENGTH_AS_ONE = 1;

@Component({
    selector: "empowered-drop-vas-coverage",
    templateUrl: "./drop-vas-coverage.component.html",
    styleUrls: ["./drop-vas-coverage.component.scss"],
})
export class DropVasCoverageComponent {
    dataLengthOne = CHECK_LENGTH_AS_ONE;
    memberPortal = PortalType.MEMBER;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.quoteShop.planNotAvailable",
        "primary.portal.dropVas.description",
        "primary.portal.common.gotIt",
        "primary.portal.dropVas.descriptionOne",
        "primary.portal.dropVas.descriptionTwo",
        "primary.portal.quoteShop.plansNotAvailable",
        "primary.portal.member.dropVas.descriptionOne",
        "primary.portal.member.dropVas.descriptionTwo",
    ]);

    constructor(@Inject(MAT_DIALOG_DATA) public data: any, private readonly language: LanguageService) {}
}
