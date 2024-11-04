import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService } from "@empowered/api";
import { Store } from "@ngxs/store";
import { RegistrationState, GetCsrf, SetIncompleteRegistrationAlert, StaticUtilService } from "@empowered/ngxs-store";

import { combineLatest, Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";

const PERSONAL_INFO_STEP = 5;
const CONTACT_INFO_STEP = 6;
const DEPENDENT_STEP = 7;

@Component({
    selector: "empowered-consent-page",
    templateUrl: "./consent-page.component.html",
    styleUrls: ["./consent-page.component.scss"],
})
export class ConsentPageComponent implements OnInit, OnDestroy {
    admin: boolean;
    producer: boolean;
    member: boolean;
    saveError = false;
    incompleteRegistrationError: string;
    hideDependentTab: boolean;
    hideContactTab: boolean;
    hidePersonalInfoTab: boolean;
    skipStep = false;
    loadSpinner = false;
    subscriptions: Subscription[] = [];
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.iAgree",
        "primary.portal.common.agreeAndFinishApplication",
        "primary.portal.common.back",
    ]);

    constructor(
        private readonly auth: AuthenticationService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly store: Store,
        private readonly staticUtilService: StaticUtilService,
        private readonly language: LanguageService,
    ) {}

    /**
     * ngOnInit function is one of an Angular component's life-cycle methods
     * This function is used to initialize all the values and functions at the time of component loading.
     */
    ngOnInit(): void {
        // It is used to not route user directly to other page of registration
        if (this.auth.formValue.value < 4) {
            this.saveError = true;
            this.store.dispatch(new SetIncompleteRegistrationAlert(this.saveError));
            this.router.navigate(["../../login"], { relativeTo: this.route });
        }
        if (this.store.selectSnapshot(RegistrationState.memberId)) {
            this.member = true;
        } else if (this.store.selectSnapshot(RegistrationState.adminId)) {
            this.admin = true;
        } else if (this.store.selectSnapshot(RegistrationState.producerId)) {
            this.producer = true;
        }
        this.getConfiguration();
    }

    /**
     * This function is used to get config to show and hide particular tab
     */
    getConfiguration(): void {
        this.subscriptions.push(
            combineLatest(
                this.staticUtilService.cacheConfigEnabled("member.registration.skip.personal.info"),
                this.staticUtilService.cacheConfigEnabled("member.registration.skip.contact.info"),
                this.staticUtilService.cacheConfigEnabled("member.registration.skip.add.dependent"),
            ).subscribe(([personalFlag, contactFlag, dependentFlag]) => {
                this.hidePersonalInfoTab = personalFlag;
                this.hideContactTab = contactFlag;
                this.hideDependentTab = dependentFlag;
                this.skipStep = this.hidePersonalInfoTab && this.hideContactTab && this.hideDependentTab;
            }),
        );
    }

    /**
     * This function is used to navigate back
     */
    checkBeforeNavigate(): void {
        if (!this.hidePersonalInfoTab) {
            this.auth.formValue.next(PERSONAL_INFO_STEP);
            this.router.navigate(["../personal-info"], { relativeTo: this.route });
        } else if (!this.hideContactTab) {
            this.auth.formValue.next(CONTACT_INFO_STEP);
            this.router.navigate(["../contact-info"], { relativeTo: this.route });
        } else if (!this.hideDependentTab) {
            this.auth.formValue.next(DEPENDENT_STEP);
            this.router.navigate(["../manage"], { relativeTo: this.route });
        } else {
            this.router.navigate(["../../login"], { relativeTo: this.route });
        }
    }

    /**
     * This function is to submit consent form.
     */
    acceptConsent(): void {
        // Updates the value of registration form
        this.loadSpinner = true;
        this.auth.acceptConsent().subscribe((response) => {
            this.loadSpinner = false;
            if (this.store.selectSnapshot(RegistrationState.memberId)) {
                this.store.dispatch([new GetCsrf()]);
                this.checkBeforeNavigate();
            } else {
                // TODO : Add appropriate route after regestration
                this.router.navigate(["../../login"], { relativeTo: this.route });
            }
        });
    }
    /**
     * This function is used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        if (this.subscriptions.length) {
            this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        }
    }
}
