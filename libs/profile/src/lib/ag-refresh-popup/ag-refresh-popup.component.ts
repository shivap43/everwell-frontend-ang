import { Component, Inject, Optional } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

export interface PlanYear {
    planYearName: string;
}

@Component({
    selector: "empowered-ag-refresh-popup",
    templateUrl: "./ag-refresh-popup.component.html",
    styleUrls: ["./ag-refresh-popup.component.scss"],
})
export class AgRefreshPopupComponent {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.aflacGroup.offeringUpdated",
        "primary.portal.aflacGroup.planYearNameUpdated",
        "primary.portal.aflacGroup.resubmitOffering",
        "primary.portal.common.gotIt",
    ]);

    constructor(
        private readonly language: LanguageService,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: PlanYear
    ) {}
}
