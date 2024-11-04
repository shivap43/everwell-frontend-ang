import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { UserService } from "@empowered/user";
import { ProducerCredential, Admin } from "@empowered/constants";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

export interface DialogData {
    dataSourceLength: number;
    selectedAdmin: Admin;
    value: boolean;
}
@Component({
    selector: "empowered-deactivate-reactivate-popup",
    templateUrl: "./deactivate-reactivate-popup.component.html",
    styleUrls: ["./deactivate-reactivate-popup.component.scss"],
})
export class DeactivateReactivatePopupComponent implements OnInit, OnDestroy {
    isLoading: boolean;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portal.common.gotIt",
        "primary.portal.deactivateReactivateAdmin.successfullyDeactivated",
        "primary.portal.deactivateReactivateAdmin.successfullyReactivated",
        "primary.portal.deactivateReactivateAdmin.deactivateReactivateSubtitle",
    ]);
    loggedInId: number;
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        private readonly dialogRef: MatDialogRef<DeactivateReactivatePopupComponent>,
        private readonly language: LanguageService,
        private readonly userService: UserService,
    ) {}

    /**
     * This is the initial function that gets executed in this component
     */
    ngOnInit(): void {
        // service call to get the loggedIn user credentials
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: ProducerCredential) => {
            this.loggedInId = credential.producerId;
        });
    }

    /**
     * Closes the dialog box
     */
    closeForm(): void {
        this.dialogRef.close();
    }

    /**
     * This method destroys all subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
