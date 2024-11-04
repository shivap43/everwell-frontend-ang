/* eslint-disable no-underscore-dangle */
import { Component, OnInit, ViewChild, HostListener, ChangeDetectorRef, AfterViewInit, OnDestroy, Input } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { MatTabGroup } from "@angular/material/tabs";
import { DependentsPersonalInfoComponent } from "./dependents-personal-info/dependents-personal-info.component";
import { Subject, Observable, Subscription } from "rxjs";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Store } from "@ngxs/store";
import { UserService } from "@empowered/user";
import { TpiSSOModel, AppSettings, MemberCredential } from "@empowered/constants";

import { DependentsContactInfoComponent } from "./dependents-contact-info/dependents-contact-info.component";
import { SetActiveDependentId, SetDependentsMemberId, SetMemberGroupId, SharedState } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-dependent-add",
    templateUrl: "./dependent-add.component.html",
    styleUrls: ["./dependent-add.component.scss"],
})
export class DependentAddComponent implements OnInit, AfterViewInit, OnDestroy {
    memberId: number;
    dependentId: string;
    MpGroup: number;
    dependentFirstName = "";
    dependentLastName = "";
    isContactTab = false;
    isDependentSaved: boolean;
    portal: string;
    isMemberPortal: boolean;
    @ViewChild("tabs", { static: true }) tabs: MatTabGroup;
    @ViewChild(DependentsPersonalInfoComponent) personalInfo: DependentsPersonalInfoComponent;
    @ViewChild(DependentsContactInfoComponent) contactInfo: DependentsContactInfoComponent;
    subscriptions: Subscription[] = [];
    languageStrings = {
        ariaBack: this.language.fetchPrimaryLanguageValue("primary.portal.common.back"),
        personal: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependentAdd.personal"),
        contact: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependentAdd.contact"),
    };
    isTpi = false;
    @Input() tpiSSODetails: TpiSSOModel;

    constructor(
        private readonly activatedRoute: ActivatedRoute,
        private readonly location: Location,
        private readonly cdr: ChangeDetectorRef,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly userService: UserService,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     */
    ngOnInit(): void {
        this.tabs._handleClick = this.interceptTabChange.bind(this);
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.isTpi = this.activatedRoute.snapshot["_routerState"].url.indexOf(AppSettings.TPI) !== -1;
        this.isMemberPortal = this.portal === AppSettings.PORTAL_MEMBER;
        if (this.isMemberPortal) {
            this.subscriptions.push(
                this.userService.credential$.subscribe((credential: MemberCredential) => {
                    if (credential.groupId && credential.memberId) {
                        this.MpGroup = credential.groupId;
                        this.memberId = credential.memberId;
                        this.dependentId = this.activatedRoute.snapshot.params["dependentId"];
                        this.setUpStoreValues();
                    }
                }),
            );
        } else if (this.isTpi) {
            this.MpGroup = this.tpiSSODetails.user.groupId;
            this.memberId = this.tpiSSODetails.user.memberId;
        } else {
            this.dependentId = this.activatedRoute.snapshot.params["dependentId"];
            const params = this.activatedRoute.parent.parent.snapshot.params;
            this.MpGroup = +params["mpGroupId"] ? +params["mpGroupId"] : +params["mpGroup"];
            this.memberId = +params["memberId"] ? +params["memberId"] : +params["customerId"];
            this.setUpStoreValues();
        }

        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
    }

    /**
     * This method will set the memberId, mpGroup and dependentId in store
     */
    setUpStoreValues(): void {
        this.store.dispatch(new SetActiveDependentId(parseInt(this.dependentId, 10)));
        this.store.dispatch(new SetDependentsMemberId(this.memberId));
        this.store.dispatch(new SetMemberGroupId(this.MpGroup));
    }

    /**
     * ng life cycle hook
     * It will detect the changes
     */
    ngAfterViewInit(): void {
        this.cdr.detectChanges();
    }

    /**
     * This method will update the first name
     * @param name First name of user
     */
    updateFirstName(name: string): void {
        this.dependentFirstName = name;
    }

    /**
     * This method will update the last name
     * @param name Last name of the user
     */
    updateLastName(name: string): void {
        this.dependentLastName = name;
    }

    /**
     * On click of Back link
     */
    backClick(): void {
        this.location.back();
    }

    /**
     * To check the change in tab
     * @param tabIndex Index of the tab
     */
    isTabChange(tabIndex: number): void {
        if (tabIndex === 1) {
            this.isContactTab = true;
        }
    }

    /**
     * The event will be triggered to enable contact tab
     * @param event Event to enable contact tab
     */
    enableContactTab(event: boolean): void {
        this.isDependentSaved = event;
    }

    /**
     * This function will handle the tab changes
     */
    interceptTabChange(): MatTabGroup {
        // eslint-disable-next-line prefer-rest-params
        const args = arguments;
        let matTab: MatTabGroup;
        if (this.personalInfo && this.personalInfo.personalInfoForm.dirty) {
            this.personalInfo.allowNavigation = new Subject<boolean>();
            this.personalInfo.openAlert();
            this.subscriptions.push(
                this.personalInfo.allowNavigation.subscribe((res) => {
                    matTab = res && MatTabGroup.prototype._handleClick.apply(this.tabs, args);
                }),
            );
        } else if (this.contactInfo && this.contactInfo.contactPreferenceForm.dirty) {
            this.contactInfo.allowNavigation = new Subject<boolean>();
            this.contactInfo.openAlert();
            this.subscriptions.push(
                this.contactInfo.allowNavigation.subscribe((res) => {
                    matTab = res && MatTabGroup.prototype._handleClick.apply(this.tabs, args);
                }),
            );
        } else {
            matTab = MatTabGroup.prototype._handleClick.apply(this.tabs, args);
        }
        return matTab;
    }

    /**
     * This function will restrict the navigation to other tabs without saving of form on one tab
     */
    @HostListener("window:beforeunload")
    canDeactivate(): Observable<boolean> | boolean {
        if (this.personalInfo && this.personalInfo.personalInfoForm.dirty) {
            this.personalInfo.allowNavigation = new Subject<boolean>();
            this.personalInfo.openAlert();
            return this.personalInfo.allowNavigation.asObservable();
        }
        if (this.contactInfo && this.contactInfo.contactPreferenceForm.dirty) {
            this.contactInfo.allowNavigation = new Subject<boolean>();
            this.contactInfo.openAlert();
            return this.contactInfo.allowNavigation.asObservable();
        }
        return true;
    }

    /**
     * ng life cycle hook
     * Used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.store.dispatch(new SetActiveDependentId(null));
        this.subscriptions.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
