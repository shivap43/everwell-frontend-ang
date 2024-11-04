import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { EnrollmentState, AppFlowService } from "@empowered/ngxs-store";

import { Store } from "@ngxs/store";
import { Router } from "@angular/router";
import { BasePlanApplicationPanel } from "@empowered/constants";

@Component({
    selector: "empowered-reinstate-info-modal",
    templateUrl: "./reinstate-info-modal.component.html",
    styleUrls: ["./reinstate-info-modal.component.scss"],
})
export class ReinstateInfoModalComponent implements OnInit {
    applicationList: BasePlanApplicationPanel[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.confirmation.viewCoverageSummary",
        "primary.portal.applicationFlow.policyReinstated",
        "primary.portal.applicationFlow.reinstate.sameSubtitle",
        "primary.portal.applicationFlow.reinstate.sameAlertMessage",
        "primary.portal.applicationFlow.reinstate.diffAlertMessage",
        "primary.portal.common.gotIt",
    ]);
    buttonTitle: string;

    constructor(
        private readonly dialogRef: MatDialogRef<ReinstateInfoModalComponent>,
        private readonly store: Store,
        @Inject(MAT_DIALOG_DATA)
        readonly data: {
            content: string;
            subContent: string;
        },
        private readonly language: LanguageService,
        private readonly appFlowService: AppFlowService,
        private readonly router: Router,
    ) {}

    /**
     * life cycle hook that runs on load of component
     * loads required data for component
     */
    ngOnInit(): void {
        this.applicationList = this.store.selectSnapshot(EnrollmentState.GetApplicationPanel);
        this.buttonTitle =
            this.applicationList.length > 1
                ? this.languageStrings["primary.portal.common.gotIt"]
                : this.languageStrings["primary.portal.applicationFlow.confirmation.viewCoverageSummary"];
    }
    /**
     * Method to decide the action to be taken on click of the button in the modal
     */
    buttonClick(): void {
        const mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        const memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        if (this.applicationList.length > 1) {
            this.dialogRef.close();
        } else {
            const coverageSummaryUrl: string = this.appFlowService.getCoverageSummaryUrl(this.router.url, mpGroup, memberId);
            this.router.navigate([coverageSummaryUrl]).then(() => {
                this.dialogRef.close();
            });
        }
    }
}
