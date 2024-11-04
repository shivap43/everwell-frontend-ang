import { BenefitsOfferingService } from "@empowered/api";
import { Component, OnInit, OnDestroy, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CensusComponent } from "../census.component";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { Select } from "@ngxs/store";
import { SharedState } from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";
import { Subscription, Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-census-estimate",
    templateUrl: "./census-estimate.component.html",
    styleUrls: ["./census-estimate.component.scss"],
})
export class CensusEstimateComponent implements OnInit, OnDestroy {
    validationRegex: any;
    @Select(SharedState.regex) regex$: Observable<any>;
    censusStimateForm: FormGroup;
    hasError = false;
    langStrings = {};
    mpGroup: number;
    isloaded: boolean;
    languageStrings = {
        mainTitleLabel: this.language.fetchPrimaryLanguageValue("primary.portal.census.censusEstimate.mainTitle"),
        censusEstimateLabel: this.language.fetchPrimaryLanguageValue("primary.portal.census.censusEstimate.label"),
        ariaClose: this.language.fetchPrimaryLanguageValue("primary.portal.common.close"),
        ariaEdit: this.language.fetchPrimaryLanguageValue("primary.portal.common.edit"),
        ariaCancel: this.language.fetchPrimaryLanguageValue("primary.portal.common.cancel"),
        ariaSave: this.language.fetchPrimaryLanguageValue("primary.portal.common.save"),
    };
    isEmployeeFormSubmit = false;
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly dialogRef: MatDialogRef<CensusComponent>,
        @Inject(MAT_DIALOG_DATA) private readonly employee: any,
        private readonly language: LanguageService,
        private readonly fb: FormBuilder,
        private readonly benefitsOfferingService: BenefitsOfferingService,
    ) {
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
    }

    getLanguageStrings(): void {
        this.langStrings = this.language.fetchPrimaryLanguageValues(["primary.portal.census.censusEstimate.mainTitle"]);
    }

    ngOnInit(): void {
        this.mpGroup = this.employee.mpGroupId;
        this.getLanguageStrings();
        this.censusStimateForm = this.fb.group({
            eligibleEmployees: [null, [Validators.required, Validators.pattern(new RegExp(this.validationRegex.POSITIVENUMBER_NONZERO))]],
        });
        if (this.employee.totalEligible !== 0) {
            this.censusStimateForm.get("eligibleEmployees").setValue(this.employee.totalEligible);
        }
    }
    /**
     * get error message for employee form data
     * @param formControlName form control data
     * @returns error message
     */
    getEmployeeFormErrorMessage(formControlName: string): string {
        return this.censusStimateForm.controls[formControlName].hasError("required") ? "primary.portal.common.requiredField" : "";
    }

    onNoClick(): void {
        this.dialogRef.close(this.employee.totalEligible);
    }

    closeForm(): void {
        this.dialogRef.close(this.employee.totalEligible);
    }
    /**
     * This method saves the census estimate details
     */
    addEligibleEmployee(): void {
        this.isEmployeeFormSubmit = true;
        if (this.censusStimateForm.valid) {
            this.isloaded = true;
            const updatedCensusInfo = {
                totalEligibleEmployees: this.censusStimateForm.controls.eligibleEmployees.value,
            };
            this.benefitsOfferingService
                .saveBenefitOfferingSettings(updatedCensusInfo, this.mpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (sucess) => {
                        this.isloaded = false;
                        this.hasError = false;
                        this.dialogRef.close(this.censusStimateForm.controls.eligibleEmployees.value);
                    },
                    (error) => {
                        this.isloaded = false;
                        this.hasError = true;
                    },
                );
        }
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
