import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { FormGroup, Validators } from "@angular/forms";
import { CoverageStartType } from "@empowered/api";
import { NEW_HIRE } from "../ag-import-form.constant";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
    selector: "empowered-ag-new-hire-form",
    templateUrl: "./ag-new-hire-form.component.html",
    styleUrls: ["./ag-new-hire-form.component.scss"],
})
export class AgNewHireFormComponent implements OnInit, OnDestroy {
    // new hire form
    @Input() agNewHireForm: FormGroup;
    // maxlength for input
    DAYS_MAX_LENGTH = 3;
    // collection of locales
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.prospects.stepThreeOfThree",
        "primary.portals.accounts.importAccount.newhireEligibility",
        "primary.portals.accounts.importAccount.settingsDetermine",
        "primary.portals.accounts.importAccount.enrollmentPeriod",
        "primary.portals.accounts.importAccount.newEmployees",
        "primary.portals.accounts.importAccount.daystoEnroll",
        "primary.portal.common.requiredField",
        "primary.portals.accounts.importAccount.coveragestartDate",
        "primary.portal.common.selectOption",
        "primary.portals.accounts.importAccount.immediatelySigned",
        "primary.portals.accounts.importAccount.immediatelyAfter",
        "primary.portals.accounts.importAccount.daysofEmployment",
        "primary.portal.common.requiredField",
        "primary.portals.accounts.importAccount.firstDay",
    ]);
    private readonly unsubscribe$: Subject<void> = new Subject();

    /**
     * constructor of class
     * @param language - injection of language service
     */
    constructor(private readonly language: LanguageService) {}

    /**
     * life cycle hook of angular.
     */
    ngOnInit(): void {
        this.updateValidity();
    }
    /**
     * this method updates validity of agNewHireForm depending on coverageStartDate.
     */
    updateValidity(): void {
        this.agNewHireForm
            .get(NEW_HIRE.coverageStartDate)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((coverageType) => {
                const monthsBeforeCoverageStart = this.agNewHireForm.get(NEW_HIRE.monthsBeforeCoverageStart);
                const daysBeforeCoverageStart = this.agNewHireForm.get(NEW_HIRE.daysBeforeCoverageStart);
                if (coverageType === CoverageStartType.AFTER_EVENT) {
                    monthsBeforeCoverageStart.reset();
                    monthsBeforeCoverageStart.setValidators(null);
                    monthsBeforeCoverageStart.disable();
                    daysBeforeCoverageStart.setValidators([Validators.required]);
                    daysBeforeCoverageStart.enable();
                }
                if (coverageType === CoverageStartType.FIRST_OF_THE_MONTH_AFTER_EVENT) {
                    daysBeforeCoverageStart.reset();
                    daysBeforeCoverageStart.setValidators(null);
                    daysBeforeCoverageStart.disable();
                    monthsBeforeCoverageStart.setValidators([Validators.required]);
                    monthsBeforeCoverageStart.enable();
                }
                if (coverageType === CoverageStartType.IMMEDIATELY) {
                    daysBeforeCoverageStart.reset();
                    monthsBeforeCoverageStart.reset();
                    daysBeforeCoverageStart.setValidators(null);
                    monthsBeforeCoverageStart.setValidators(null);
                    daysBeforeCoverageStart.disable();
                    monthsBeforeCoverageStart.disable();
                }
                this.agNewHireForm.updateValueAndValidity();
            });
    }

    /**
     * This method destroys all subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
