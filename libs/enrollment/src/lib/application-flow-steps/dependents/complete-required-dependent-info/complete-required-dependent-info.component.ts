import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from "@angular/material/bottom-sheet";
import { StaticService } from "@empowered/api";
import { shareReplay, takeUntil } from "rxjs/operators";
import { combineLatest, Observable, Subject } from "rxjs";
import { LanguageService } from "@empowered/language";

import { Select } from "@ngxs/store";
import { ConfigName, Address, CountryState } from "@empowered/constants";
import { SharedState, RegexDataType, StaticUtilService } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-complete-required-dependent-info",
    templateUrl: "./complete-required-dependent-info.component.html",
    styleUrls: ["./complete-required-dependent-info.component.scss"],
})
export class CompleteRequiredDependentInfoComponent implements OnInit, OnDestroy {
    formGroup: FormGroup;
    sameAsEmployee: FormControl = new FormControl();
    placeHolderSelect = this.language.fetchPrimaryLanguageValue("primary.portal.common.placeholderSelect");
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    states$: Observable<CountryState[]> = this.staticService.getStates().pipe(shareReplay(1));

    constructor(
        @Inject(MAT_BOTTOM_SHEET_DATA)
        readonly data: {
            dependent: { name: string; address: Address };
            member: { name: string; address: Address };
        },
        private readonly formBuilder: FormBuilder,
        private readonly staticService: StaticService,
        private readonly language: LanguageService,
        private readonly bottomSheet: MatBottomSheetRef<CompleteRequiredDependentInfoComponent>,
        private readonly staticUtil: StaticUtilService,
        private readonly changeDetector: ChangeDetectorRef,
    ) {}

    /**
     * Initializes the main form and sets up any listeners for value changes
     */
    ngOnInit(): void {
        const dependentAddress = this.data && this.data.dependent && this.data.dependent.address;
        this.sameAsEmployee.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            if (value) {
                this.formGroup.patchValue(this.data && this.data.member && this.data.member.address);
                this.formGroup.disable();
            } else {
                this.formGroup.patchValue(dependentAddress);
                this.formGroup.markAsPristine();
                this.formGroup.markAsUntouched();
                this.formGroup.enable();
            }
        });
        combineLatest([this.regex$, this.staticUtil.cacheConfigValue(ConfigName.SINGLE_LINE_INPUT_MAX_LENGTH)])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([regex, maxLength]) => {
                this.formGroup = this.formBuilder.group({
                    address1: [
                        dependentAddress && dependentAddress.address1,
                        [Validators.required, Validators.pattern(new RegExp(regex.ADDRESS)), Validators.maxLength(+maxLength)],
                    ],
                    address2: [
                        dependentAddress && dependentAddress.address2,
                        [Validators.pattern(new RegExp(regex.ADDRESS)), Validators.maxLength(+maxLength)],
                    ],
                    city: [
                        dependentAddress && dependentAddress.city,
                        [
                            Validators.required,
                            Validators.pattern(new RegExp(regex.NAME_WITH_SPACE_ALLOWED)),
                            Validators.maxLength(+maxLength),
                        ],
                    ],
                    state: [dependentAddress && dependentAddress.state, [Validators.required]],
                    zip: [dependentAddress && dependentAddress.zip, [Validators.required]],
                });
                this.changeDetector.markForCheck();
            });
    }

    /**
     * Handles form submission
     */
    onSubmit(): void {
        if (this.formGroup.valid || this.sameAsEmployee.value) {
            this.bottomSheet.dismiss(this.formGroup.value);
        }
    }

    /**
     * Cleans up subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
