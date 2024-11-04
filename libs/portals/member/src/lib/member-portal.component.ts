import { Component, HostBinding, OnInit, ViewEncapsulation } from "@angular/core";
import { Store } from "@ngxs/store";
import { SetPortal, SetRouteAfterLogin, SetRegex, SetURLNavigationAfterLogin, UtilService } from "@empowered/ngxs-store";
import { MemberService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { Portals } from "@empowered/constants";

/* eslint-disable @angular-eslint/use-component-view-encapsulation */
@Component({
    selector: "empowered-member-portal",
    templateUrl: "./member-portal.component.html",
    styleUrls: ["./member-portal.component.scss"],
    encapsulation: ViewEncapsulation.None,
})
export class MemberPortalComponent implements OnInit {
    @HostBinding("class") classes = "member-portal";
    languageStrings = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.enrollmentWizard.welcome",
        "primary.portal.enrollmentWizard.backToWelcome",
        "primary.portal.enrollmentWizard.myHousehold",
        "primary.portal.enrollmentWizard.backToMyHousehold",
        "primary.portal.enrollmentWizard.getStarted",
        "primary.portal.enrollmentWizard.coverage",
        "primary.portal.enrollmentWizard.reviewMyCoverage",
        "primary.portal.enrollmentWizard.shop",
        "primary.portal.enrollmentWizard.startShopping",
        "primary.portal.enrollmentWizard.backToCoverage",
    ]);
    wizardTabs = [
        {
            label: this.languageStrings["primary.portal.enrollmentWizard.welcome"],
            link: "wizard/welcome",
            backButtonLabel: this.languageStrings["primary.portal.enrollmentWizard.backToWelcome"],
            nextButtonLabel: "",
        },
        {
            label: this.languageStrings["primary.portal.enrollmentWizard.myHousehold"],
            link: "wizard/myhousehold",
            backButtonLabel: this.languageStrings["primary.portal.enrollmentWizard.backToMyHousehold"],
            nextButtonLabel: this.languageStrings["primary.portal.enrollmentWizard.getStarted"],
        },
        /* TODO - This will be a part of DAY 2
        {
             label: "Preference",
             link: "wizard/preferences",
        }, */
        {
            label: this.languageStrings["primary.portal.enrollmentWizard.coverage"],
            link: "wizard/coverage",
            backButtonLabel: this.languageStrings["primary.portal.enrollmentWizard.backToCoverage"],
            nextButtonLabel: this.languageStrings["primary.portal.enrollmentWizard.reviewMyCoverage"],
        },
        {
            label: this.languageStrings["primary.portal.enrollmentWizard.shop"],
            link: "wizard/enrollment/shop",
            backButtonLabel: "",
            nextButtonLabel: this.languageStrings["primary.portal.enrollmentWizard.startShopping"],
        },
    ];
    activeLink: string;

    constructor(
        private readonly store: Store,
        private readonly mService: MemberService,
        private readonly languageService: LanguageService,
        private readonly utilService: UtilService,
    ) {}

    ngOnInit(): void {
        this.mService.setMemberWizardTabMenu(this.wizardTabs);
        this.store.dispatch([
            new SetPortal(Portals.MEMBER),
            new SetRouteAfterLogin("/member"),
            new SetURLNavigationAfterLogin("/member/home"),
        ]);
        if (Object.keys(this.store["_stateStream"].value.user).length > 0) {
            this.store.dispatch(new SetRegex());
        }
    }

    tabChanged(tab: any): void {
        this.activeLink = tab.link;
        this.mService.wizardCurrentTab$.next(
            this.wizardTabs.findIndex((x) => x.label.toLocaleLowerCase() === tab.label.toLocaleLowerCase()),
        );
    }

    callResetAppFocus(): void {
        this.utilService.resetAppFocus();
    }
}
