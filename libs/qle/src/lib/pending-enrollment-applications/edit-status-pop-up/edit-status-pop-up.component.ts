import { AccountService } from "@empowered/api";
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AccountListState } from "@empowered/ngxs-store";
import { AppSettings } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { ActivatedRoute } from "@angular/router";
import { FormControl } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-edit-status-pop-up",
    templateUrl: "./edit-status-pop-up.component.html",
    styleUrls: ["./edit-status-pop-up.component.scss"],
})
export class EditStatusPopUpComponent implements OnInit, OnDestroy {
    pendingStatus = [];
    statusForm = new FormControl("");
    enableAdd = false;
    mpGroup: any;
    memberId: any;
    enrollmentId: any;
    isLoading: boolean;
    defaultStatus: string;
    radioValue: string;
    errMsg: string;
    errorFlag = false;
    private readonly unsubscribe$ = new Subject<void>();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.accountPendingEnrollments.editStatus",
        "primary.portal.accountPendingEnrollments.remove",
        "primary.portal.accountPendingEnrollments.customStatus",
        "primary.portal.accountPendingEnrollment.statusNameAlready",
        "primary.portal.accountPendingEnrollments.add",
        "primary.portal.accountPendingEnrollments.cancel",
        "primary.portal.accountPendingEnrollments.update",
        "primary.portal.accountPendingEnrollment.internalServerError",
        "primary.portal.accountPendingEnrollment.unspecified",
    ]);

    constructor(
        private readonly dialogRef: MatDialogRef<EditStatusPopUpComponent>,
        @Inject(MAT_DIALOG_DATA) private readonly data: any,
        private readonly accountService: AccountService,
        private readonly store: Store,
        private readonly route: ActivatedRoute,
        private readonly language: LanguageService,
    ) {}

    ngOnInit(): void {
        this.mpGroup = this.store.selectSnapshot(AccountListState.getGroup).id;
        this.memberId = this.route.snapshot.params.memberId;
        this.defaultStatus = this.data.particularStatus;
        this.fetchPendingEnrollments();
    }

    fetchPendingEnrollments(addedStatus?: string): void {
        this.isLoading = true;
        this.accountService
            .getPendingEnrollmentCategories(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.pendingStatus = [];
                // TODO  Static values will be removed once language is implemented
                this.pendingStatus.push({
                    id: -1,
                    name: this.languageStrings["primary.portal.accountPendingEnrollment.unspecified"],
                });
                response.forEach((each) => {
                    this.pendingStatus.push(each);
                });
                if (addedStatus) {
                    this.defaultStatus = addedStatus;
                    this.enableAdd = false;
                    this.statusForm.reset();
                }
                this.isLoading = false;
            });
    }

    closeForm(): void {
        this.dialogRef.close(null);
    }

    updateStatus(event: any): void {
        this.radioValue = this.defaultStatus;
        this.pendingStatus.forEach((status) => {
            if (status.name === this.radioValue) {
                this.dialogRef.close(status);
            }
        });
    }
    onChange(event: any): void {
        if (this.defaultStatus !== this.radioValue) {
            this.radioValue = event.value;
        }
    }
    // editStatus(event: any): void {}
    enableAddStatus(): void {
        this.enableAdd = true;
    }
    removeStatus(event: any, element: any): void {
        this.pendingStatus.forEach((status) => {
            if (status.name === element) {
                this.enrollmentId = status.id;
            }
        });
        this.isLoading = true;
        this.accountService
            .deletePendingEnrollmentCategory(this.mpGroup, this.enrollmentId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.fetchPendingEnrollments();
                    this.errorFlag = false;
                },
                (error) => {
                    this.isLoading = false;
                    this.errorFlag = true;
                    if (error.status === AppSettings.API_RESP_409) {
                        this.errMsg = this.language.fetchSecondaryLanguageValue(
                            "secondary.portal.accountPendingEnrollments.duplicateStatus",
                        );
                    } else if (error.status === AppSettings.API_RESP_400 && error.error.details.length) {
                        this.errMsg = this.language.fetchSecondaryLanguageValue("secondary.portal.register.personalInfo.badParameter");
                    } else if (error.status === AppSettings.API_RESP_500) {
                        this.errMsg = this.languageStrings["primary.portal.accountPendingEnrollment.internalServerError"];
                    } else {
                        this.errMsg = this.language.fetchSecondaryLanguageValue("secondary.portal.accountPendingEnrollments.failedtosave");
                    }
                },
            );
    }
    addStatus(): void {
        const category = {
            name: this.statusForm.value,
        };

        this.isLoading = true;
        this.accountService
            .createPendingEnrollmentCategories(this.mpGroup, category)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {},
                (error) => {
                    this.isLoading = false;
                    this.errorFlag = true;
                    if (error.status === AppSettings.API_RESP_500) {
                        this.errMsg = this.language.fetchSecondaryLanguageValue(
                            "primary.portal.accountPendingEnrollment.internalServerError",
                        );
                    } else if (error.status === AppSettings.API_RESP_400 && error.error.details.length) {
                        this.errMsg = this.language.fetchSecondaryLanguageValue("secondary.portal.register.personalInfo.badParameter");
                    } else {
                        this.errMsg = this.language.fetchSecondaryLanguageValue("secondary.portal.accountPendingEnrollments.failedtosave");
                    }
                },
                () => {
                    this.fetchPendingEnrollments(category.name);
                },
            );
    }
    checkExistingStatus(): void {
        if (this.statusForm.value) {
            const index = this.pendingStatus.findIndex((status) => status.name === this.statusForm.value);
            if (index === -1) {
                this.addStatus();
            } else {
                this.statusForm.setErrors({ incorrect: true });
            }
        }
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
