import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { BenefitDollars } from "@empowered/api";
import { MemberFlexDollar, ContributionType } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { EmployerContributionsDialogData } from "../enrollment-settings.model";

@Component({
    selector: "empowered-employer-contributions",
    templateUrl: "./employer-contributions.component.html",
    styleUrls: ["./employer-contributions.component.scss"],
})
export class EmployerContributionsComponent {
    benefitDollars = BenefitDollars;
    contributionType = ContributionType;
    readonly PAY_FREQUENCY_SHORT_LENGTH = 20;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.shoppingCart.benefitDollar.headerMessage",
    ]);

    constructor(
        private readonly EmployerContributionsDialogRef: MatDialogRef<EmployerContributionsComponent>,
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA) readonly dialogData: EmployerContributionsDialogData,
    ) {}

    /**
     * Close Employer Contributions Dialog
     */
    closeDialog(): void {
        this.EmployerContributionsDialogRef.close();
    }

    /**
     * Returns unique identifier for MemberFlexDollar.
     * trackBy for *ngFor involving MemberFlexDollar used to improve performance.
     *
     * @param index {number} index of the iteration
     * @param memberFlexDollar {MemberFlexDollar} current MemberFlexDollar in iteration
     * @returns unique identifier for MemberFlexDollar
     */
    trackByMemberFlexDollarId(index: number, memberFlexDollar: MemberFlexDollar): number {
        return memberFlexDollar.id;
    }
}
