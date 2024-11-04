import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import { ControlValueAccessor, FormBuilder, FormControl, NgControl } from "@angular/forms";
import { RateSheetCoverageLevelOption } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { Subject } from "rxjs";
import { tap, takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-coverage-level",
    templateUrl: "./coverage-level.component.html",
    styleUrls: ["./coverage-level.component.scss"],
})
export class CoverageLevelComponent implements ControlValueAccessor, OnInit, OnDestroy {
    @Input() coverageLevels: RateSheetCoverageLevelOption[];
    @Input() disableCoverageLevels: boolean[];

    private readonly unsubscribe$ = new Subject<void>();

    formControl: FormControl = this.formBuilder.control([]);
    toolTipMessage = "";
    languageStrings: Record<string, string>;
    onChange: (value: string) => void;
    onTouched = () => {};
    onValidationChange = () => {};

    constructor(public ngControl: NgControl, private readonly formBuilder: FormBuilder, private readonly languageService: LanguageService) {
        ngControl.valueAccessor = this;
    }

    /**
     * initializes the component and sets the tooltip message
     */
    ngOnInit(): void {
        this.languageStrings = this.languageService.fetchPrimaryLanguageValues(["primary.portal.rateSheets.disabled.checkbox.message"]);
        this.toolTipMessage = this.languageStrings["primary.portal.rateSheets.disabled.checkbox.message"].replace(
            "##selection##",
            "plan(s)",
        );
        this.ngControl.statusChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(() => this.formControl.setErrors(this.ngControl.errors));
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
