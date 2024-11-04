import { Component, OnInit, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DatePipe } from "@angular/common";
import { MemberService } from "@empowered/api";
import { Router } from "@angular/router";
import { TPIState, SharedState } from "@empowered/ngxs-store";
import { DateFormats, AppSettings, Portals, StatusType, MemberQualifyingEvent } from "@empowered/constants";
import { DateService } from "@empowered/date";

const ONE_DAY = 1;
const DAY = "day";

@Component({
    selector: "empowered-close-sep-popup",
    templateUrl: "./close-sep-popup.component.html",
    styleUrls: ["./close-sep-popup.component.scss"],
})
export class CloseSepPopupComponent implements OnInit {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.enrollment.complete.close",
        "primary.portal.enrollment.complete.speedup",
        "primary.portal.enrollment.complete.closeSep",
        "primary.portal.enrollment.complete.qleFlagOeFlag",
        "primary.portal.enrollment.complete.dualRollover",
        "primary.portal.common.cancel",
        "primary.portal.common.close",
        "primary.portal.shop.confirmation.dualPlanYear.lifeEventEnrollmentPeriod",
        "primary.portal.shop.confirmation.dualPlanYear.closeLifeEventContent",
        "primary.portal.shop.confirmation.dualPlanYear.closePeriodExit",
    ]);
    memberInfo: any;
    qleToCloseSEP: MemberQualifyingEvent;
    dualRollover: boolean;
    changedQLE: any = {};
    qleFlag: boolean;
    oeFlag: boolean;
    portal = "";
    isMember = false;
    isTpi = false;

    constructor(
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<CloseSepPopupComponent>,
        private readonly datePipe: DatePipe,
        private readonly memberService: MemberService,
        private readonly router: Router,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly dateService: DateService,
    ) {}

    /**
     * Implements Angular's OnInit Life Cycle hook
     * Taking snapshot of SharedState and TPIState
     */
    ngOnInit(): void {
        this.portal = this.store.selectSnapshot(SharedState.portal);
        if (this.router.url.indexOf(AppSettings.TPI) >= 0) {
            this.isTpi = true;
            this.isMember =
                Boolean(this.store.selectSnapshot(TPIState.tpiSsoDetail).user.producerId) ||
                !this.store.selectSnapshot(TPIState.getTPIProducerId);
        }

        this.isMember = this.portal === Portals.MEMBER;
        this.qleToCloseSEP = this.data.qle;
        this.memberInfo = this.data.memberInfo;
        this.dualRollover = this.data.dualRollover;
        this.qleFlag = this.data.qleFlag;
        this.oeFlag = this.data.oeFlag;
    }

    /**
     * Method to close the QLE
     */
    closeSEP(): void {
        this.changedQLE.eventDate = this.datePipe.transform(this.qleToCloseSEP.eventDate, AppSettings.DATE_FORMAT_YYYY_MM_DD);
        this.changedQLE.enrollmentValidity = {
            expiresAfter: this.datePipe.transform(this.dateService.subtractDays(new Date(), ONE_DAY), DateFormats.YEAR_MONTH_DAY),
            effectiveStarting: this.datePipe.transform(this.dateService.subtractDays(new Date(), ONE_DAY), DateFormats.YEAR_MONTH_DAY),
        };
        if (!this.isMember) {
            this.changedQLE.adminComment = this.qleToCloseSEP.adminComment;
        }
        this.changedQLE.coverageStartDates = [];
        this.changedQLE.status = StatusType.APPROVED;
        this.changedQLE.documentIds = [];
        if (this.qleToCloseSEP.documents.length > 0) {
            this.qleToCloseSEP.documents.forEach((doc) => {
                this.changedQLE.documentIds.push(doc.id);
            });
        } else {
            this.changedQLE.documentIds = [];
        }
        this.changedQLE.typeId = this.qleToCloseSEP.type.id;

        const memberId =
            this.data.dualPlanYearData && this.data.dualPlanYearData.isDualPlanYear ? this.data.memberId : this.memberInfo.memberId;
        const mpGroup =
            this.data.dualPlanYearData && this.data.dualPlanYearData.isDualPlanYear ? this.data.mpGroup : this.memberInfo.groupId;
        this.memberService.updateMemberQualifyingEvent(memberId, this.qleToCloseSEP.id, this.changedQLE, mpGroup).subscribe((res) => {
            this.dialogRef.close("updated");
        });
    }
}
