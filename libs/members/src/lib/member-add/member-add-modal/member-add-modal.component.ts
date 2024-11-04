import { Component, Inject, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MemberAddDialogData } from "./member-add-modal.model";
import { LanguageService } from "@empowered/language";
import { MemberService } from "@empowered/api";
import { ClientErrorResponseCode } from "@empowered/constants";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

export interface ModalData {
    actionTaken: string;
    employeeData: any;
}

@Component({
    selector: "empowered-member-add-dialog",
    templateUrl: "./member-add-modal.component.html",
})
export class MemberAddModalComponent implements OnDestroy {
    message: string;
    confirmButtonText: string;
    dismissButtonText: string;
    languageStrings = {
        ariaClose: this.language.fetchPrimaryLanguageValue("primary.portal.common.close"),
    };
    ERROR = "error";
    DETAILS = "details";
    errorMessageArray = [];
    errorMessage: string;
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly dialogRef: MatDialogRef<MemberAddModalComponent>,
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA) readonly data: MemberAddDialogData,
        private readonly memberService: MemberService,
    ) {}

    primaryButtonClick(): void {
        if (this.data.primaryButton) {
            this.memberService
                .deleteMember(this.data.mpGroupId, this.data.memberId)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (result) => {
                        this.dialogRef.close("Save");
                    },
                    (error) => {
                        if (error) {
                            this.showErrorAlertMessage(error);
                        } else {
                            this.errorMessage = null;
                        }
                    },
                );
        }
    }
    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS].length > 0) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.members.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }
    closePopup(): void {
        this.dialogRef.close();
    }

    secondaryButtonClick(): void {
        if (this.data.secondaryButton) {
            this.dialogRef.close();
        }
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
