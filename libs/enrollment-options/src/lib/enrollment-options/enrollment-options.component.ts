import { HttpErrorResponse } from "@angular/common/http";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { PagePrivacy } from "@empowered/constants";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { AccountListState, SharedState } from "@empowered/ngxs-store";
import { SharedService } from "@empowered/common-services";
import { Store } from "@ngxs/store";
import { Subject } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";
import { SetAllowedExceptionTypes, SetPINSignatureExceptions, SetAccountCallCenters, ResetEnrollmentOptions } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-enrollment-options",
    templateUrl: "./enrollment-options.component.html",
    styleUrls: ["./enrollment-options.component.scss"],
})
export class EnrollmentOptionsComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(["primary.portal.profile.enrollmentOptions.title"]);
    errors: string[] = [];
    unsubscribe$: Subject<void> = new Subject<void>();
    isEnroller: boolean;
    isPrivacyOnForEnroller: boolean;
    constructor(private readonly language: LanguageService, private readonly store: Store, private readonly sharedService: SharedService) {
        this.isEnroller = this.store.selectSnapshot(SharedState.getPrivacyForEnroller);
        if (this.isEnroller) {
            this.isPrivacyOnForEnroller = this.sharedService.getPrivacyConfigforEnroller(PagePrivacy.ACCOUNT_ENROLLMENT_OPTIONS);
        }
    }

    /**
     * Initialize required data.
     */
    ngOnInit(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.store
            .selectOnce(AccountListState.getMpGroupId)
            .pipe(
                filter((mpGroup) => !!mpGroup),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((mpGroup) =>
                this.store.dispatch([
                    new SetAllowedExceptionTypes(),
                    new SetPINSignatureExceptions(mpGroup),
                    new SetAccountCallCenters(mpGroup, "callCenterId"),
                ]),
            );
    }

    /**
     * Shows an alert on the screen in case of an error.
     * @param err http error response
     */
    showErrorAlertMessage(err: HttpErrorResponse): void {
        if (err && err.error && err.error.status) {
            this.errors.push(this.language.fetchSecondaryLanguageValue(`secondary.api.${err.error.status}.${err.error.code}`));
        } else {
            this.errors.push(this.language.fetchSecondaryLanguageValue("secondary.portal.callCenter.8x8.api.common.error.message"));
        }
    }

    /**
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        this.store.dispatch(new ResetEnrollmentOptions());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
