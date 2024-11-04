import { Component, OnInit, Inject, Output, EventEmitter, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Subject, Subscription } from "rxjs";
import { AdminService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { UserService } from "@empowered/user";
import { ProducerCredential } from "@empowered/constants";
import { takeUntil } from "rxjs/operators";
@Component({
    selector: "empowered-remove-admin",
    templateUrl: "./remove-admin.component.html",
    styleUrls: ["./remove-admin.component.scss"],
})
export class RemoveAdminComponent implements OnInit, OnDestroy {
    removeAdminSubscription: Subscription;
    @Output() errorFlag = new EventEmitter<any>();
    isLoading: boolean;
    @Output() errorMessage = new EventEmitter<any>();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.administrators.remove.lastAdmin",
        "primary.portal.administrators.remove.self",
        "primary.portal.administrators.remove.subordinatesPresent",
        "primary.portal.administrators.remove.removedFromAdminList",
        "primary.portal.administrators.remove.infoRemainInSystem",
        "primary.portal.common.cancel",
        "primary.portal.common.close",
        "primary.portal.common.remove",
    ]);
    cred: any;
    loggedInId: any;
    private readonly unsubscribe$: Subject<void> = new Subject();
    constructor(
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly adminService: AdminService,
        private readonly dialogRef: MatDialogRef<RemoveAdminComponent>,
        private readonly language: LanguageService,
        private readonly userService: UserService,
    ) {}

    ngOnInit(): void {
        this.cred = this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: ProducerCredential) => {
            this.loggedInId = credential.producerId;
        });
    }
    remove(): void {
        this.dialogRef.close(this.adminService.removeAsAccountAdmin(this.data.selectedAdmin.id, this.data.mpgroup));
    }

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
