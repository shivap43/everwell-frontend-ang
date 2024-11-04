import { Component, OnInit, OnDestroy } from "@angular/core";
import { MemberService } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { Observable, Subscription } from "rxjs";
import { MemberWizardState, DualPlanYearState, QleOeShopModel } from "@empowered/ngxs-store";
import { Router } from "@angular/router";
import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { ScenarioObject, AppSettings, DualPlanYearSettings, MEMBERWIZARD, DateFnsFormat } from "@empowered/constants";
import { DateService } from "@empowered/date";

@Component({
    selector: "empowered-welcome-tab",
    templateUrl: "./welcome-tab.component.html",
    styleUrls: ["./welcome-tab.component.scss"],
    providers: [DatePipe],
})
export class WelcomeTabComponent implements OnInit, OnDestroy {
    isLoading: boolean;
    userData: any;
    nextTab: any;
    STR_HOME = "HOME";
    STR_WELCOME = "welcome";
    STR_SELF_SERVICE = "SELF_SERVICE";
    STR_MEMBER_ROUTE = "member/";
    STR_MYHOUSEHOLD = "My Household";
    STR_COVERAGE = "Coverage";
    STR_APRROVED = "APPROVED";
    STR_COMPANY_PROVIDED = "COMPANY_PROVIDED";
    STR_POSTTAX = "POSTTAX";
    currentWizardFlow: MEMBERWIZARD;
    memberName: string;
    coverageStartDate: Date;
    coverageEndDate: Date;
    enrollmentStartDate: Date;
    enrollmentEndDate: Date;
    qleEndDate: Date;
    enrollDate: string;
    appSetting = AppSettings;
    pricingData;
    memberEnrollmentData;
    scenarioObject: ScenarioObject;
    allSubscriptions: Subscription[];
    dateFormatYYYYMMDD = AppSettings.DATE_FORMAT_YYYY_MM_DD_1;
    @Select(MemberWizardState.GetPlanYear) planYearData$: Observable<any>;
    @Select(MemberWizardState.GetScenarioObject) scenarioObject$: Observable<any>;
    isQleShop = false;
    isOeShop = false;
    isNewPYQleShop = false;
    qlePlanDate: string;
    oePlanDate: string;
    dualPlanYearData: QleOeShopModel;
    QLE_INDEX = 0;
    PY_INDEX = 1;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.members.welcome.dualPlanYear.lifeEventContent",
        "primary.portal.members.welcome.dualPlanYear.openEnrollmentContent",
        "primary.portal.members.welcome.dualPlanYear.newPlanYearQleContent",
        "primary.portal.members.welcome.dualPlanYear.lifeEventContent.needHelp",
        "primary.portal.members.welcome.dualPlanYear.openEnrollmentContent.shopForNextYear",
        "primary.portal.members.welcome.dualPlanYear.openEnrollmentContent.needHelp",
        "primary.portal.members.welcome.dualPlanYear.newPlanYear.needHelp",
        "primary.portal.members.welcome.dualPlanYear.openEnrollmentContent.updateCurrentCoverage",
        "primary.portal.members.welcome.dualPlanYear.openEnrollmentContent.nextYearCoverage",
        "primary.portal.members.welcome.dualPlanYear.newPlanYear.updateCurrentCoverage.current",
        "primary.portal.members.welcome.dualPlanYear.newPlanYear.nextYearCoverage.future",
        "primary.portal.members.welcome.dualPlanYear.newPlanYear.openEnrollment",
        "primary.portal.members.welcome.dualPlanYear.lifeEventContent.updateCurrentCoverage",
        "primary.portal.members.welcome.dualPlanYear.lifeEventContent.nextYearCoverage",
        "primary.portal.members.welcome.dualPlanYear.lifeEventContent.eventQualifies",
    ]);

    constructor(
        private readonly mService: MemberService,
        private readonly store: Store,
        private readonly router: Router,
        private readonly language: LanguageService,
        private readonly dateService: DateService,
    ) {}

    /**
     * on component initialization setting up variables and getting required data
     */
    ngOnInit(): void {
        this.allSubscriptions = [];
        this.allSubscriptions.push(
            this.scenarioObject$.subscribe((data) => {
                this.scenarioObject = data;
                this.setObjectsForDualPlanYear();
            }),
        );
        const tabs = this.mService.getMemberWizardTabMenu();
        this.nextTab = tabs[tabs.findIndex((x) => x.label.toLowerCase() === this.STR_WELCOME) + 1];
    }

    /**
     * method to determine next step and route
     */
    goToNextTab(): void {
        if (this.nextTab && this.nextTab !== "") {
            const idx = this.mService.getMemberWizardTabMenu().findIndex((x) => x.label.toLowerCase() === this.nextTab.label.toLowerCase());
            this.mService.wizardCurrentTab$.next(idx);
            this.router.navigate([this.STR_MEMBER_ROUTE + this.nextTab.link]);
        } else {
            this.nextTab = this.mService.wizardTabMenu[this.mService.wizardCurrentTab$.getValue() + 1];
            this.mService.wizardCurrentTab$.next(this.mService.wizardCurrentTab$.getValue() + 1);
            this.router.navigate([this.STR_MEMBER_ROUTE + this.nextTab.link]);
        }
    }

    /**
     * method to get dual plan year data and set description as per condition
     */
    setObjectsForDualPlanYear(): void {
        this.dualPlanYearData = this.store.selectSnapshot(DualPlanYearState);
        if (this.dualPlanYearData && this.dualPlanYearData.isDualPlanYear && this.scenarioObject) {
            this.qlePlanDate = this.dateService.format(
                this.dateService.toDate(this.dualPlanYearData.qleEventData[this.QLE_INDEX].enrollmentValidity?.expiresAfter),
                DateFnsFormat.LONG_MONTH_AND_DAY,
            );
            this.oePlanDate = this.dateService.format(
                this.dateService.toDate(this.dualPlanYearData.planYearsData[this.PY_INDEX].enrollmentPeriod.expiresAfter),
                DateFnsFormat.LONG_MONTH_AND_DAY,
            );
            if (this.scenarioObject.description === DualPlanYearSettings.QUALIFYING_EVENT) {
                this.isQleShop = true;
            } else if (this.scenarioObject.description === DualPlanYearSettings.OPEN_ENROLLMENT) {
                this.isOeShop = true;
            } else if (this.scenarioObject.description === DualPlanYearSettings.NEW_PY_QLE_SHOP) {
                this.isNewPYQleShop = true;
            }
        }
    }

    /**
     * to unsubscribe all the subscriptions
     */
    ngOnDestroy(): void {
        this.allSubscriptions.forEach((sub) => sub.unsubscribe());
    }
}
