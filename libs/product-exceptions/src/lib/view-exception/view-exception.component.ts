import { Component, OnInit, Optional, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from "@angular/material/dialog";
import { AllowWithdrawnPlan } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { DateFormats, Exceptions } from "@empowered/constants";
import { DateService } from "@empowered/date";

export interface DialogData {
    mpGroup: any;
    createPermission: boolean;
    accountCheckedOut: boolean;
    isVasExceptionUser: boolean;
    exception: Exceptions;
}

@Component({
    selector: "empowered-view-exception",
    templateUrl: "./view-exception.component.html",
    styleUrls: ["./view-exception.component.scss"],
})
export class ViewExceptionComponent implements OnInit {
    exceptionData: Exceptions;
    languageStrings: Record<string, string>;
    showEdit = this.data.createPermission && !this.data.accountCheckedOut && this.data.exception.plan;
    dateFormat = DateFormats.MONTH_DAY_YEAR;
    AllowWithdrawnPlan = AllowWithdrawnPlan.ALLOW_DROPDOWN;
    showDeleteWarning = false;
    isVasMultiAflacFunded = false;
    isExpired: boolean;
    isVasException = false;

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly data: DialogData,
        @Optional() private readonly matDialogRef: MatDialogRef<ViewExceptionComponent>,
        private readonly dialog: MatDialog,
        private readonly langService: LanguageService,
        private readonly dateService: DateService,
    ) {}

    /**
     * Function to initialize variable and language strings
     */
    ngOnInit(): void {
        this.isExpired = this.dateService.isBefore(this.dateService.toDate(this.data.exception.validity.expiresAfter.toString()));
        this.fetchLanguageData();
        this.isVasException = !this.data.exception.plan;
        this.exceptionData = this.data.exception;
        if (
            this.exceptionData.planYear &&
            this.exceptionData.enrolledCount > 0 &&
            this.dateService.parseDate(new Date().toString(), DateFormats.YEAR_MONTH_DAY) >=
                this.dateService.parseDate(
                    this.exceptionData.planYear.coveragePeriod.effectiveStarting.toString(),
                    DateFormats.YEAR_MONTH_DAY,
                )
        ) {
            this.showDeleteWarning = true;
        }
        if (this.exceptionData.type === "VAS_MULTIPLE_AFLAC_FUNDED") {
            this.isVasMultiAflacFunded = true;
        }
    }

    /**
     * Closes view
     * @param isEdit is true when edit button is clicked
     */
    closeView(isEdit: boolean): void {
        this.matDialogRef.close(isEdit);
    }

    /**
     * Function to fetch language strings
     */
    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.productExceptions.viewException.availability",
            "primary.portal.productExceptions.viewException.states",
            "primary.portal.productExceptions.viewException.exceptionType",
            "primary.portal.productExceptions.viewException.approvedBy",
            "primary.portal.common.close",
            "primary.portal.common.edit",
            "primary.portal.customer.all",
            "primary.portal.productExceptions.viewException.vasException",
            "primary.portal.productExceptions.viewException.availabilityDateWarning",
            "primary.portal.productExceptions.viewException.deleteWarning",
            "primary.portal.productExceptions.newException.maxPlans",
        ]);
    }
}
