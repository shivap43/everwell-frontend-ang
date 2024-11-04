import { ClassTypeDisplay } from "@empowered/api";
import { PayFrequency, AppSettings, UserPermissionList } from "@empowered/constants";
import { Component, OnInit, Inject, ChangeDetectorRef, Optional, OnDestroy } from "@angular/core";
import { Store, Select } from "@ngxs/store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { CONTAINER_DATA } from "../../../container-data";
import { PortalsService } from "../../../portals.service";
import { ContainerDataModel, ActionType } from "../../../shared/models/container-data-model";
import { Validators, FormBuilder, FormGroup } from "@angular/forms";
import { Observable, Subject } from "rxjs";
import { take, takeUntil } from "rxjs/operators";
import { PartnerId } from "@empowered/constants";
import { AccountInfoState, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { CustomValidation } from "@empowered/ui";

const MIN_LENGTH_5 = 5;

@Component({
    selector: "empowered-edit-class-type",
    templateUrl: "./edit-class-type.component.html",
    styleUrls: ["./edit-class-type.component.scss"],
})
export class EditClassTypeComponent implements OnInit, OnDestroy {
    @Select(SharedState.regex) regex$: Observable<any>;
    private unsubscribe$: Subject<void> = new Subject<void>();
    CLASS_NAME_PATTERN: string;
    payFrequencies: PayFrequency[];
    defaultClassType: ClassTypeDisplay;
    editClassTypeForm: FormGroup;
    zeroState: boolean;
    showDeterminesPlanAvailabilityOption = false;
    hasPermissionDeductionFrequencyUpdate$: Observable<boolean>;
    hasTPPrestrictionForDeductionFrequencyUpdate$: Observable<boolean>;
    isTpiAccount = false;

    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.classes.tooltipPayFrequency",
        "primary.portal.classes.classTypeName",
        "primary.portal.classes.classDescription",
        "primary.portal.common.optional",
        "primary.portal.common.settings",
        "primary.portal.classes.payFrequencyCategory",
        "primary.portal.classes.defaultPayFrequency",
        "primary.portal.common.cancel",
        "primary.portal.regions.create",
        "primary.portal.common.save",
    ]);

    /**
     * Display secondary language strings.
     */

    secondaryLanguages: Record<string, string> = this.languageService.fetchSecondaryLanguageValues([
        "secondary.portal.classes.classDescription.minLength",
    ]);

    constructor(
        private readonly portalsService: PortalsService,
        @Optional() @Inject(CONTAINER_DATA) readonly data: ContainerDataModel,
        private readonly cdr: ChangeDetectorRef,
        private readonly store: Store,
        private readonly languageService: LanguageService,
        private readonly formBuilder: FormBuilder,
        private readonly staticUtilService: StaticUtilService,
    ) {
        this.zeroState = this.portalsService.zeroState;
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.*"));
        if (this.regex$) {
            this.regex$.pipe(take(2)).subscribe((regexes) => {
                if (data) {
                    this.CLASS_NAME_PATTERN = regexes.CLASS_NAME_PATTERN;
                }
            });
        }
    }

    /**
     * Create form and set values of form elements based on action
     */
    ngOnInit(): void {
        const customValidator = new CustomValidation();
        this.cdr.markForCheck();
        const accountInfo = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        if (accountInfo.partnerId !== PartnerId.AFLAC) {
            this.showDeterminesPlanAvailabilityOption = true;
        }
        this.editClassTypeForm = this.formBuilder.group(
            {
                name: [""],
                description: [""],
                determinesPayFrequency: [false, { updateOn: "change" }],
                determinesPlanAvailabilityOrPricing: [false],
            },
            { updateOn: "blur" },
        );
        this.editClassTypeForm.markAsUntouched();
        if (this.data.classType && this.data.classType.determinesPayFrequency) {
            this.editClassTypeForm.addControl(
                "payFrequencyId",
                this.formBuilder.control(this.data.classes.find((className) => className.default === true)["payFrequencyId"]),
            );
        } else {
            this.editClassTypeForm.controls.determinesPayFrequency.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
                if (value) {
                    this.editClassTypeForm.addControl("payFrequencyId", this.formBuilder.control(""));
                } else {
                    this.editClassTypeForm.removeControl("payFrequencyId");
                }
            });
        }
        this.updateEditClassTypeValidators(false);
        this.payFrequencies = this.portalsService.payFrequencies;
        this.defaultClassType = this.portalsService.defaultClassType;
        if (this.data.actionType === ActionType.class_type_update) {
            this.editClassTypeForm.patchValue({
                name: this.data.classType.name,
                description: this.data.classType.description,
                determinesPayFrequency: this.data.classType.determinesPayFrequency,
                determinesPlanAvailabilityOrPricing: this.data.classType.determinesPlanAvailabilityOrPricing,
            });
        } else if (this.data.actionType === ActionType.class_type_create) {
            this.editClassTypeForm.patchValue({
                name: null,
                description: null,
                determinesPayFrequency: this.zeroState ? true : false,
                determinesPlanAvailabilityOrPricing: false,
            });
        }

        // This method checks if role has permission to update deduction frequency
        this.hasPermissionDeductionFrequencyUpdate$ = this.staticUtilService.hasPermission(
            UserPermissionList.DEFAULT_CLASS_DEDUCTION_FREQUENCY_ENABLE_DROPDOWN,
        );
        // Check if role has restrict permission to disable deduction frequency toggle
        this.hasTPPrestrictionForDeductionFrequencyUpdate$ = this.staticUtilService.hasPermission(
            UserPermissionList.DEFAULT_CLASS_DEDUCTION_FREQUENCY_RESTRICT_UPDATE,
        );
        this.isTpiAccount = accountInfo.thirdPartyPlatformsEnabled;
    }
    editClassType(): void {
        this.updateEditClassTypeValidators(true);
        if (this.editClassTypeForm.valid) {
            if (this.data.actionType === ActionType.class_type_create) {
                this.portalsService.setAction({
                    action: ActionType.class_type_create,
                    data: {
                        classType: Object.assign(this.editClassTypeForm.value, { visible: true }),
                        classes: [],
                        defaultPayFreq: this.editClassTypeForm.controls.payFrequencyId
                            ? this.editClassTypeForm.controls.payFrequencyId.value
                            : null,
                    },
                });
            } else if (this.data.actionType === ActionType.class_type_update) {
                const dataObj = {
                    updateClassTypeReq: this.editClassTypeForm.value,
                    classTypeId: this.data.classType.id,
                };
                if (this.editClassTypeForm.controls.payFrequencyId) {
                    dataObj["classes"] = this.data.classes;
                    dataObj["classTypeId"] = this.data.classType.id;
                }
                this.portalsService.setAction({
                    action: ActionType.class_type_update,
                    data: dataObj,
                });
            }
        }
        this.editClassTypeForm.valueChanges.pipe(take(1)).subscribe(() => this.updateEditClassTypeValidators(false));
    }
    cancel(): void {
        this.portalsService.detachPortal();
    }
    updateEditClassTypeValidators(submit: boolean): void {
        const validators = [Validators.maxLength(AppSettings.MAX_LENGTH_20), Validators.pattern(new RegExp(this.CLASS_NAME_PATTERN))];
        if (this.data.classType) {
            validators.push(
                CustomValidation.duplicateNameValidator(this.data.classTypesList.filter((name) => name !== this.data.classType.name)),
            );
        } else {
            validators.push(CustomValidation.duplicateNameValidator(this.data.classTypesList));
        }
        if (submit) {
            validators.push(Validators.required);
        }
        this.editClassTypeForm.get("name").setValidators(validators);
        this.editClassTypeForm.get("name").updateValueAndValidity({ emitEvent: false });

        this.editClassTypeForm
            .get("description")
            .setValidators([
                Validators.pattern(new RegExp(this.CLASS_NAME_PATTERN)),
                Validators.maxLength(AppSettings.MAX_LENGTH_200),
                Validators.minLength(MIN_LENGTH_5),
            ]);
        this.editClassTypeForm.get("description").updateValueAndValidity({ emitEvent: false });
        if (submit && this.editClassTypeForm.controls.determinesPayFrequency.value) {
            this.editClassTypeForm.get("payFrequencyId").setValidators([Validators.required]);
            this.editClassTypeForm.get("payFrequencyId").updateValueAndValidity({ emitEvent: false });
        }
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
    }
}
