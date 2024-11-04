import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { ControlValueAccessor, FormBuilder, FormControl, NgControl } from "@angular/forms";
import { RateSheetCoverageLevelOption } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { Subject } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";

@Component({
    selector: "empowered-elimination-period",
    templateUrl: "./elimination-period.component.html",
    styleUrls: ["./elimination-period.component.scss"],
})
export class EliminationPeriodComponent implements ControlValueAccessor, OnInit, OnDestroy {
    @Input() eliminationPeriodOptions: RateSheetCoverageLevelOption[];
    @Input() disableEliminationOptions: boolean[];
    @Input() requiredEliminationOptions: boolean[];

    private readonly unsubscribe$ = new Subject<void>();

    formControl: FormControl = this.formBuilder.control([]);
    toolTipMessage = "";
    languageStrings: Record<string, string>;
    onChange: (value: string) => void;
    onTouched = () => {};
    onValidationChange = () => {};

    constructor(private readonly formBuilder: FormBuilder, public ngControl: NgControl, private readonly languageService: LanguageService) {
        ngControl.valueAccessor = this;
    }

    /**
     * initializes the component and sets the tooltip message
     */
    ngOnInit(): void {
        this.languageStrings = this.languageService.fetchPrimaryLanguageValues(["primary.portal.rateSheets.disabled.checkbox.message"]);
        this.toolTipMessage = this.languageStrings["primary.portal.rateSheets.disabled.checkbox.message"].replace(
            "##selection##",
            "benefit period(s)",
        );
        this.ngControl.statusChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((status) => {
            this.formControl.setErrors(this.ngControl.errors);
            if (status === "TOUCHED") {
                this.formControl.markAsTouched();
            }
        });
        this.formControl.valueChanges
            .pipe(
                tap((value) => this.onChange(value)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Called by the forms API to write to the view when programmatic changes from model to view are requested.
     *
     * @param value the new value for the element
     */
    writeValue(value: RateSheetCoverageLevelOption[]): void {
        this.formControl.setValue(value);
    }

    /**
     * ControlValueAccessor interface function, sets the onChange function
     *
     * @param fn The onChange Function
     */
    registerOnChange(fn: () => void): void {
        this.onChange = fn;
    }

    /**
     * ControlValueAccessor interface function, sets the onTouched Function
     *
     * @param fn The onTouched Function
     */
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    /**
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
