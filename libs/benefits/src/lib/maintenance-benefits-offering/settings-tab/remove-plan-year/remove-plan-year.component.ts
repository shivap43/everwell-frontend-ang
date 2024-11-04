import { Component, OnInit, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DatePipe } from "@angular/common";
import { LanguageService } from "@empowered/language";
import { DateFormats } from "@empowered/constants";

@Component({
    selector: "empowered-remove-plan-year",
    templateUrl: "./remove-plan-year.component.html",
    styleUrls: ["./remove-plan-year.component.scss"],
})
export class RemovePlanYearComponent implements OnInit {
    title: string;
    content: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.remove",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.removePlanYearContent",
    ]);

    constructor(
        @Inject(MAT_DIALOG_DATA) private readonly data: DialogData,
        private readonly datePipe: DatePipe,
        private readonly language: LanguageService
    ) {}

    /**
     * Set the title and content of the modal
     */
    ngOnInit(): void {
        this.title = this.languageStrings["primary.portal.common.remove"] + " " + this.data.planYear + "?";
        this.content = this.data.showDeletionDetails
            ? this.languageStrings[
                  "primary.portal.maintenanceBenefitsOffering.settingsTab.removePlanYearContent"
              ].replace("##currentDate##", this.datePipe.transform(new Date(), DateFormats.MONTH_DAY_YEAR))
            : undefined;
    }
}

interface DialogData {
    showDeletionDetails: boolean;
    planYear: string;
}
