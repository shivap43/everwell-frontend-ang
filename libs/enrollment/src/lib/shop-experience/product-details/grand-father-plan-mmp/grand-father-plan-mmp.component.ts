import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { Select } from "@ngxs/store";
import { EnrollmentState } from "@empowered/ngxs-store";
import { EnrollmentStateModel, AppSettings } from "@empowered/constants";
import { Observable, Subscription } from "rxjs";
import { DatePipe } from "@angular/common";
import { MonDialogComponent, MonDialogData } from "@empowered/ui";
import { LanguageService } from "@empowered/language";
import { MatDialog } from "@angular/material/dialog";
import { UserService } from "@empowered/user";

@Component({
    selector: "empowered-grand-father-plan-mmp",
    templateUrl: "./grand-father-plan-mmp.component.html",
    styleUrls: ["./grand-father-plan-mmp.component.scss"],
})
export class GrandFatherPlanMmpComponent implements OnInit, OnDestroy {
    @Input() grandFatherPlan: any;
    @Select(EnrollmentState) enrollmentState$: Observable<EnrollmentStateModel>;
    payFrequency: any;
    expiryDate: any;
    todayDate = new Date();
    languageStrings: Record<string, string>;
    memberInfo: any;
    daysLeft: number;
    dateFormat = AppSettings.DATE_FORMAT;
    subscriptions: Subscription[] = [];

    constructor(
        private readonly datepipe: DatePipe,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly userService: UserService,
    ) {
        this.fetchLanguageStrings();
    }

    ngOnInit(): void {
        this.subscriptions.push(
            this.enrollmentState$.subscribe((state) => {
                this.payFrequency = state.payFrequency;
            }),
        );
        this.expiryDate =
            this.grandFatherPlan && this.grandFatherPlan.validity.expiresAfter !== undefined
                ? this.convertDate(this.grandFatherPlan.validity.expiresAfter)
                : this.convertDate(this.todayDate);
        this.subscriptions.push(
            this.userService.credential$.subscribe((response) => {
                this.memberInfo = response;
            }),
        );
    }
    checkForCoverageEndDate(enrollment: any): boolean {
        if (Object.keys(enrollment.validity).length === 1) {
            return true;
        }
        return false;
    }
    checkForRiders(enrolledRiders: any): boolean {
        if (enrolledRiders.length > 0) {
            return true;
        }
        return false;
    }
    convertDate(date1: any): any {
        let endDate = this.datepipe.transform(date1, AppSettings.DATE_FORMAT);
        const p = endDate.split(/\D/g);
        endDate = [p[2], p[1], p[0]].join("/");

        return endDate;
    }
    showEndCoverageDialog(planName: string, expiryDate: any): any {
        // TO-DO: Call the update coverage api on clicking End coverage button
        const dialogData: MonDialogData = {
            title: this.language
                .fetchPrimaryLanguageValue("primary.portal.shoppingExperience.coverageDialogTitle")
                .replace("#planname", planName),
            content: this.language
                .fetchPrimaryLanguageValue("primary.portal.shoppingExperience.coverageDialogContent")
                .replace("#validityexpiresafter", expiryDate),
            primaryButton: {
                buttonTitle: this.language.fetchPrimaryLanguageValue("primary.portal.shoppingExperience.endCoverage"),
                buttonAction: this.close.bind(this, this.dialog),
            },
            secondaryButton: {
                buttonTitle: this.language.fetchPrimaryLanguageValue("primary.portal.common.cancel"),
                buttonAction: this.close.bind(this, this.dialog),
            },
        };
        this.dialog.open(MonDialogComponent, {
            data: dialogData,
            width: "40rem",
        });
    }
    close(element: any): any {
        element.closeAll();
    }
    fetchLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.shoppingExperience.currentCoverageText",
            "primary.portal.shoppingExperience.currentCoveragePara",
            "primary.portal.shoppingExperience.approvalActive",
            "primary.portal.shoppingExperience.benefitAmount",
            "primary.portal.shoppingExperience.eliminationPeriod",
            "primary.portal.benefitsOffering.filterRiders",
            "primary.portal.shoppingExperience.taxStatus",
            "primary.portal.shoppingExperience.postTax",
            "primary.portal.shoppingExperience.preTax",
            "primary.portal.shoppingExperience.coveredIndividuals",
            "primary.portal.shoppingExperience.coverageDate",
            "primary.portal.shoppingExperience.baseCost",
            "primary.portal.shoppingExperience.adjustments",
            "primary.portal.shoppingExperience.yourCost",
            "primary.portal.shoppingExperience.cancelCoverage",
            "primary.portal.planDetails.title",
            "primary.portal.quoteShop.starts",
            "primary.portal.grandfatheredPlan.coverageDate",
        ]);
    }
    // FIX-ME: use service file for common functions
    checkIfPastDate(enrollment: any): boolean {
        let pastDateFlag = false;
        this.daysLeft = this.datediff(
            this.parseDate(this.datepipe.transform(this.todayDate, this.dateFormat)),
            this.parseDate(enrollment.validity.effectiveStarting),
        );
        if (this.daysLeft < 1) {
            pastDateFlag = true;
        }
        return pastDateFlag;
    }
    datediff(dateToday: any, expiresOn: any): number {
        return Math.round((expiresOn - dateToday) / (1000 * 60 * 60 * 24));
    }

    parseDate(dateParse: any): any {
        dateParse = dateParse + "";
        const dateParsed = dateParse.split("-");
        return new Date(dateParsed[0], dateParsed[1] - 1, dateParsed[2]);
    }
    ngOnDestroy(): void {
        this.subscriptions.forEach((x) => x.unsubscribe());
    }
}
