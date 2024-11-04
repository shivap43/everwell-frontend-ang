import { Component, OnInit, ViewChild, HostListener, ChangeDetectorRef, AfterViewInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { MatTabGroup, MatTab, MatTabHeader } from "@angular/material/tabs";
import { DependentPersonalInfoComponent } from "./dependent-personal-info/dependent-personal-info.component";
import { DependentContactInfoComponent } from "./dependent-contact-info/dependent-contact-info.component";
import { Subject, Observable, Subscription } from "rxjs";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Store } from "@ngxs/store";

import { AppSettings, MemberCredential } from "@empowered/constants";
import { UserService } from "@empowered/user";
import { SetActiveDependentId, SetDependentsMemberId, SetMemberGroupId, AccountInfoState, SharedState } from "@empowered/ngxs-store";
import { takeUntil } from "rxjs/operators";

const PROSPECT = "prospect";
@Component({
    selector: "empowered-dependent-add",
    templateUrl: "./dependent-add.component.html",
    styleUrls: ["./dependent-add.component.scss"],
})
export class DependentAddComponent implements OnInit, AfterViewInit, OnDestroy {
    memberId: number;
    dependentId: string;
    MpGroup: number;
    dependentName = "";
    isContactTab = false;
    isDependentSaved: boolean;
    portal: string;
    isMemberPortal: boolean;
    @ViewChild("tabs", { static: true }) tabs: MatTabGroup;
    @ViewChild(DependentPersonalInfoComponent) personalInfo: DependentPersonalInfoComponent;
    @ViewChild(DependentContactInfoComponent) contactInfo: DependentContactInfoComponent;
    languageStrings = {
        ariaBack: this.language.fetchPrimaryLanguageValue("primary.portal.common.back"),
        personal: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependentAdd.personal"),
        contact: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependentAdd.contact"),
    };
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly activatedRoute: ActivatedRoute,
        private readonly location: Location,
        private readonly cdr: ChangeDetectorRef,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly userService: UserService,
        private readonly router: Router,
    ) {}

    /**
     * Initializes necessary variables
     * @returns nothing
     */
    ngOnInit(): void {
        // eslint-disable-next-line no-underscore-dangle
        this.tabs._handleClick = this.interceptTabChange.bind(this);
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.isMemberPortal = this.portal === AppSettings.PORTAL_MEMBER;
        if (this.isMemberPortal) {
            this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: MemberCredential) => {
                if (credential.groupId && credential.memberId) {
                    this.MpGroup = credential.groupId;
                    this.memberId = credential.memberId;
                    this.dependentId = this.activatedRoute.snapshot.params["dependentId"];
                    this.setUpStoreValues();
                }
            });
        } else {
            this.dependentId = this.activatedRoute.snapshot.params["dependentId"];
            const params = this.activatedRoute.parent.parent.snapshot.params;
            this.MpGroup = +params["mpGroupId"] ? +params["mpGroupId"] : +params["mpGroup"];
            this.memberId = +params["memberId"] ? +params["memberId"] : +params["customerId"];
            if (this.router.url.includes(PROSPECT)) {
                this.MpGroup = +this.store.selectSnapshot(AccountInfoState.getMpGroupId);
            }
            this.setUpStoreValues();
        }

        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
    }
    setUpStoreValues(): void {
        this.store.dispatch(new SetActiveDependentId(parseInt(this.dependentId, 10)));
        this.store.dispatch(new SetDependentsMemberId(this.memberId));
        this.store.dispatch(new SetMemberGroupId(this.MpGroup));
    }
    ngAfterViewInit(): void {
        this.cdr.detectChanges();
    }

    /**
     * Updates dependent's name, whenever it is updated in the child component
     * @param name updated name.
     */
    updateName(name: string): void {
        this.dependentName = name;
    }

    backClick(): void {
        this.location.back();
    }
    isTabChange(tabIndex: number): void {
        if (tabIndex === 1) {
            this.isContactTab = true;
        }
    }
    enableContactTab(event: boolean): void {
        this.isDependentSaved = event;
    }

    interceptTabChange(tab: MatTab, tabHeader: MatTabHeader, idx: number): any {
        // eslint-disable-next-line prefer-rest-params
        const args = arguments;
        if (this.personalInfo && this.personalInfo.personalInfoForm.dirty) {
            this.personalInfo.allowNavigation = new Subject<boolean>();
            this.personalInfo.openAlert();
            this.personalInfo.allowNavigation
                .pipe(takeUntil(this.unsubscribe$))
                // eslint-disable-next-line no-underscore-dangle
                .subscribe((res) => res && MatTabGroup.prototype._handleClick.apply(this.tabs, args));
        } else if (this.contactInfo && this.contactInfo.contactPreferenceForm.dirty) {
            this.contactInfo.allowNavigation = new Subject<boolean>();
            this.contactInfo.openAlert();
            this.contactInfo.allowNavigation
                .pipe(takeUntil(this.unsubscribe$))
                // eslint-disable-next-line no-underscore-dangle
                .subscribe((res) => res && MatTabGroup.prototype._handleClick.apply(this.tabs, args));
        } else {
            // eslint-disable-next-line no-underscore-dangle
            return MatTabGroup.prototype._handleClick.apply(this.tabs, args);
        }
    }

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

    ngOnDestroy(): void {
        this.store.dispatch(new SetActiveDependentId(null));
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
