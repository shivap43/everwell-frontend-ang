import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DatePipe } from "@angular/common";
import { LanguageService } from "@empowered/language";
import { DateFormats } from "@empowered/constants";
import { ManageCallCenterDismissed } from "../../models/manage-call-center.model";
import { DateService } from "@empowered/date";
@Component({
    selector: "empowered-approval-dialog",
    templateUrl: "./approval-dialog.component.html",
    styleUrls: ["./approval-dialog.component.scss"],
})
export class ApprovalDialogComponent implements OnInit {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.callCenter.approvalDialog.duplicateFound",
        "primary.portal.callCenter.approvalDialog.enrollmentFor",
        "primary.portal.callCenter.approvalDialog.isalreadyFor",
        "primary.portal.callCenter.approvalDialog.isalreadyFrom",
        "primary.portal.callCenter.approvalDialog.wouldeditExisting",
        "primary.portal.callCenter.approvalDialog.dates",
        "primary.portal.callCenter.approvalDialog.editExisting",
        "primary.portal.callCenter.approvalDialog.adjacentEnrollment",
        "primary.portal.callCenter.approvalDialog.adjacentExisting",
        "primary.portal.callCenter.approvalDialog.enrollment",
        "primary.portal.callCenter.approvalDialog.ratherExisting",
        "primary.portal.callCenter.approvalDialog.endDate",
        "primary.portal.callCenter.approvalDialog.requestApproval",
        "primary.portal.callCenter.approvalDialog.followingDates",
        "primary.portal.callCenter.approvalDialog.confirmNotification",
        "primary.portal.callCenter.approvalDialog.establishStartdate",
        "primary.portal.callCenter.approvalDialog.gotIt",
        "primary.portal.callCenter.approvalDialog.callcenterList",
        "primary.portal.common.remove",
        "primary.portal.common.cancel",
        "primary.portal.common.close",
    ]);
    approvalText: string;
    approvalTextNote: string;

    constructor(
        private readonly dialogRef: MatDialogRef<ApprovalDialogComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: ManageCallCenterDismissed,
        private readonly datePipe: DatePipe,
        private readonly language: LanguageService,
        private readonly dateService: DateService,
    ) {}

    /**
     * Initializes content of the modal.
     */
    ngOnInit(): void {
        let languageName = this.data.endDate
            ? "primary.portal.callCenter.approvalDialog.sentForApproval.endDate"
            : "primary.portal.callCenter.approvalDialog.sentForApproval";
        if (this.data.is8x8CallCenterSelected) {
            languageName += ".vcc";
            if (this.data.action === "updateSuccess") {
                languageName += ".edit";
                this.approvalTextNote = this.language
                    .fetchPrimaryLanguageValue("primary.portal.callCenter.approvalDialog.sentForApproval.vcc.edit.note")
                    .replace("##vcc##", this.data.callCenterName);
            }
        }
        this.approvalText = this.language
            .fetchPrimaryLanguageValue(languageName)
            .replace("##startdate##", this.datePipe.transform(this.data.startDate, DateFormats.MONTH_DAY_YEAR))
            .replace("##enddate##", this.datePipe.transform(this.data.endDate, DateFormats.MONTH_DAY_YEAR))
            .replace("##account##", this.data.account && this.data.account.name)
            .replace(new RegExp("##vcc##", "g"), this.data.callCenterName);
    }

    onCancelApprove(): void {
        this.dialogRef.close({ action: "closeApprove" });
    }

    onCancelRemove(): void {
        this.dialogRef.close({ action: "closeRemove" });
    }

    onCancelSameCallCenterOverlap(): void {
        this.dialogRef.close({ action: "closeSameCallCenterOverlap" });
    }

    onCancelSameCallCenterAdjacent(): void {
        this.dialogRef.close({ action: "closeSameCallCenterAdjacent" });
    }

    onCancel(): void {
        this.dialogRef.close({ action: "close" });
    }

    dateFormat(dateValue: string): Date {
        return this.dateService.toDate(this.datePipe.transform(dateValue));
    }
}
