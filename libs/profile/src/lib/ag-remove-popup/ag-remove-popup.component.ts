import { Component, Inject, OnDestroy, Optional } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { AflacService } from "@empowered/api";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

export interface AgBOStatus {
    mpGroup: string;
    benefitOfferingStatus: string;
}

@Component({
    selector: "empowered-ag-remove-popup",
    templateUrl: "./ag-remove-popup.component.html",
    styleUrls: ["./ag-remove-popup.component.scss"],
})
export class AgRemovePopupComponent implements OnDestroy {
    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.aflacGroup.removeAflacGroup",
        "primary.portal.aflacGroup.info",
        "primary.portal.aflacGroup.reviewInfo",
        "primary.portal.common.remove",
        "primary.portal.aflacGroup.removeInfoWhenIncompleteBO",
    ]);

    constructor(
        private readonly language: LanguageService,
        private readonly aflacService: AflacService,
        private readonly dialogRef: MatDialogRef<AgRemovePopupComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: AgBOStatus,
    ) {}

    /**
     * This method is used to unlink aflac group account
     */
    unlinkAflacAccount(): void {
        this.aflacService
            .unlinkAflacGroupAccount(this.data.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.dialogRef.close(true);
            });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
