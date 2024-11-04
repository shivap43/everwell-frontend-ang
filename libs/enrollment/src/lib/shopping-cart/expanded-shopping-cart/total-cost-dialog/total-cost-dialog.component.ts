import { Component, OnInit, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

interface DialogData {
    isMember: boolean;
    cartCost: number;
    existingCost: number;
    payFrequency: string;
}

@Component({
    selector: "empowered-total-cost-dialog",
    templateUrl: "./total-cost-dialog.component.html",
    styleUrls: ["./total-cost-dialog.component.scss"],
})
export class TotalCostDialogComponent implements OnInit {
    payFreqLower: string;
    totalCost: number;
    existingCoverageTooltip: string;
    totalCostTooltip: string;
    languageStrings = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.totalcost.newCost",
        "primary.portal.totalcost.duringEnrollment",
        "primary.portal.totalcost.newTotal",
        "primary.portal.totalcost.existingCoverage",
        "primary.portal.totalcost.gotIt",
        "primary.portal.totalcost.cartTotal",
        "primary.portal.totalcost.existingCoverage.memberTooltip",
        "primary.portal.totalcost.memberTooltip",
        "primary.portal.totalcost.existingCoverage.producerTooltip",
        "primary.portal.totalcost.producerTooltip",
        "primary.portal.common.plus",
        "primary.portal.common.star",
    ]);

    constructor(
        private readonly languageService: LanguageService,
        @Inject(MAT_DIALOG_DATA) readonly data: DialogData
    ) {}

    ngOnInit(): void {
        this.payFreqLower = this.data.payFrequency.toLowerCase();
        this.totalCost = this.data.cartCost + this.data.existingCost;
        if (this.data.isMember) {
            this.existingCoverageTooltip = this.languageStrings[
                "primary.portal.totalcost.existingCoverage.memberTooltip"
            ].replace("#payfrequency", this.payFreqLower);
            this.totalCostTooltip = this.languageStrings["primary.portal.totalcost.memberTooltip"].replace(
                "#payfrequency",
                this.payFreqLower
            );
        } else {
            this.existingCoverageTooltip = this.languageStrings[
                "primary.portal.totalcost.existingCoverage.producerTooltip"
            ].replace("#payfrequency", this.data.payFrequency);
            this.totalCostTooltip = this.languageStrings["primary.portal.totalcost.producerTooltip"].replace(
                "#payfrequency",
                this.payFreqLower
            );
        }
    }
}
