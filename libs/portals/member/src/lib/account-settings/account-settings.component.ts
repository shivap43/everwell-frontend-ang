import { Component, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { LanguageService } from "@empowered/language";
import { SharedService } from "@empowered/common-services";
import { SharedState } from "@empowered/ngxs-store";
import { Router } from "@angular/router";
import { Store } from "@ngxs/store";

import { Observable } from "rxjs";
import { Permission, UserPermissionList, Portals } from "@empowered/constants";
const MEMBER_HOUSEHOLD_WITH_TAB_ID_PARAM = "/member/household/profile?tabId=2";

@Component({
    selector: "empowered-account-settings",
    templateUrl: "./account-settings.component.html",
    styleUrls: ["./account-settings.component.scss"],
})
export class AccountSettingsComponent implements OnInit {
    portal: string;
    notification: boolean;
    isAdmin: boolean;
    readonly CREATE_BRANDING_PERMISSION = UserPermissionList.CREATE_BRANDING;
    readonly permissionEnum = Permission;
    selfEnrollment$: Observable<boolean> = this.sharedService.checkAgentSelfEnrolled();
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.common.back",
        "primary.portal.members.account-setting.header",
        "primary.portal.members.account-setting.nav.notification-preferences",
        "primary.portal.members.account-setting.nav.change-password",
        "primary.portal.memberDashboard.profile",
        "primary.portal.common.producerInfo",
    ]);

    constructor(
        private readonly sharedService: SharedService,
        private readonly store: Store,
        private readonly location: Location,
        private readonly languageService: LanguageService,
        private readonly router: Router,
    ) {}
    /**
     * Displaying notification preferences when portal is member portal
     */
    ngOnInit(): void {
        this.portal = this.store.selectSnapshot(SharedState.portal);
        if (this.portal.toUpperCase() === Portals.MEMBER) {
            this.notification = true;
        } else if (this.portal.toUpperCase() === Portals.ADMIN) {
            this.isAdmin = true;
        }
    }
    /**
     * @description back functionality on click of back button
     */
    backClick(): void {
        if (this.sharedService.backURL === MEMBER_HOUSEHOLD_WITH_TAB_ID_PARAM) {
            this.location.back();
        } else {
            this.router.navigate([this.sharedService.backURL]);
        }
    }
}
