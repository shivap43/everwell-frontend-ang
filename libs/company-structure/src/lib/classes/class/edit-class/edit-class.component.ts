import { Component, OnInit, Inject, Optional, OnDestroy } from "@angular/core";
import { CoreService, LanguageModel } from "@empowered/api";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { PortalsService } from "../../../portals.service";
import { ContainerDataModel, ActionType } from "./../../../shared/models/container-data-model";
import { CONTAINER_DATA } from "../../../container-data";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Store } from "@ngxs/store";
import { Observable, Subject } from "rxjs";
import { takeUntil, share, map } from "rxjs/operators";
import { ConfigName, PayFrequency, RiskClass, CarrierId, UserPermissionList } from "@empowered/constants";
import { CustomValidation } from "@empowered/ui";
import { SharedState, RegexDataType, StaticUtilService, AccountInfoState } from "@empowered/ngxs-store";

const CLASS_NAME_MAX_LENGTH = 20;
const PEO_CLASS_NAME_MAX_LENGTH = 4;
const PEO_CLASS_NAME_MIN_LENGTH = 4;
const CLASS_DESCRIPTION_MAX_LENGTH = 200;

@Component({
    selector: "empowered-edit-class",
    templateUrl: "./edit-class.component.html",
    styleUrls: ["./edit-class.component.scss"],
})
export class EditClassComponent implements OnInit, OnDestroy {
    isSpinnerLoading: boolean;
    enablePayFrequency$: Observable<boolean> = this.staticUtilService.cacheConfigEnabled(ConfigName.DEFAULT_CLASS_PAY_FREQUENCY);
    CLASS_NAME_PATTERN: string;
    payFrequencies: PayFrequency[];
    editClassForm: FormGroup;
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    languageStrings: Record<string, string>;
    riskClasses$: Observable<RiskClass[]>;
    isPEOClass: boolean;
    classNameRegex: string;
    showPayFrequencySelect: boolean;
    showDefaultClassCheckbox: boolean;
    classNameMaxLength: number;
    CLASS_DESCRIPTION_MAX_LENGTH = CLASS_DESCRIPTION_MAX_LENGTH;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    hasPermissionDeductionFrequencyUpdate$: Observable<boolean>;
    hasTPPrestrictionForDeductionFrequencyUpdate$: Observable<boolean>;
    isTpiAccount = false;

    constructor(
        private readonly portalsService: PortalsService,
        @Optional()
        @Inject(CONTAINER_DATA)
        readonly data: ContainerDataModel,
        private readonly store: Store,
        private readonly formBuilder: FormBuilder,
        private readonly language: LanguageService,
        private readonly coreService: CoreService,
        private readonly staticUtilService: StaticUtilService,
    ) {}
    /**
     * This is the initial function that executes after login.
     * Few service calls to fetch the required data, filters etc are performed
     */
    ngOnInit(): void {
        this.fetchLanguage();
        const accountInfo = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        const customValidator = new CustomValidation();
        this.editClassForm = this.formBuilder.group(
            {
                name: [""],
                description: [""],
                payFrequencyId: [null],
                default: [null, { updateOn: "change" }],
            },
            { updateOn: "blur" },
        );
        this.initPEOClassVariables();
        this.editClassForm.markAsUntouched();
        this.updateEditClassValidators(false);
        this.payFrequencies = this.portalsService.payFrequencies;
        if (this.data.actionType === ActionType.class_create || this.data.actionType === ActionType.class_first) {
            this.editClassForm.setValue({
                name: "",
                description: "",
                payFrequencyId: this.data.defaultPayFreq || null,
                default: false,
            });
            // Edit class
        } else if (this.data.actionType === ActionType.class_update) {
            this.editClassForm.patchValue({
                name: this.data.className.name,
                description: this.data.className.description,
                payFrequencyId: this.data.className["payFrequencyId"] || null,
                default: this.data.className.default,
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
    editClass(): void {
        this.updateEditClassValidators(true);
        if (this.editClassForm.valid) {
            let data;
            if (this.data.actionType === ActionType.class_first) {
                data = { classType: this.data.classType, class: this.editClassForm.value };
            } else if (this.data.actionType === ActionType.class_create) {
                data = { createClassReq: this.editClassForm.value, classTypeId: this.data.classType.id };
            } else if (this.data.actionType === ActionType.class_create_peo) {
                data = this.editClassForm.value;
            } else if (this.data.actionType === ActionType.class_update) {
                data = {
                    updateClassReq: this.editClassForm.value,
                    classTypeId: this.data.classType.id,
                    classId: this.data.className.id,
                };
            }
            this.portalsService.setAction({
                action: this.data.actionType,
                data: data,
            });
        }
        this.editClassForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(() => this.updateEditClassValidators(false));
    }
    updateEditClassValidators(submit: boolean): void {
        const validators = [
            Validators.minLength(PEO_CLASS_NAME_MIN_LENGTH),
            Validators.maxLength(this.classNameMaxLength),
            Validators.pattern(this.classNameRegex),
        ];
        if (this.data.className) {
            validators.push(
                CustomValidation.duplicateNameValidator(this.data.classesList.filter((name) => name !== this.data.className.name)),
            );
        } else {
            validators.push(CustomValidation.duplicateNameValidator(this.data.classesList));
        }
        if (submit) {
            validators.push(Validators.required);
        }
        this.editClassForm.get("name").setValidators(validators);
        this.editClassForm.get("name").updateValueAndValidity({ emitEvent: false });

        this.editClassForm
            .get("description")
            .setValidators([Validators.pattern(new RegExp(this.CLASS_NAME_PATTERN)), Validators.maxLength(CLASS_DESCRIPTION_MAX_LENGTH)]);
        this.editClassForm.get("description").updateValueAndValidity({ emitEvent: false });
        if (submit && this.data.classType.determinesPayFrequency) {
            this.editClassForm.get("payFrequencyId").setValidators([Validators.required]);
            this.editClassForm.get("payFrequencyId").updateValueAndValidity({ emitEvent: false });
        }
    }
    cancel(): void {
        this.portalsService.detachPortal();
        if (this.data.actionType === ActionType.class_first) {
            this.portalsService.setAction({ action: ActionType.class_type_remove, data: null });
        }
    }
    /**
     * PEO-class-specific customization
     * @returns nothing
     */
    initPEOClassVariables(): void {
        this.isPEOClass = this.data.classType.carrierId === CarrierId.AFLAC;
        if (this.isPEOClass) {
            this.riskClasses$ = this.coreService.getCarrierRiskClasses(CarrierId.AFLAC.toString()).pipe(
                map((riskClasses) => riskClasses.filter((riskClass) => !riskClass.groupRatingCode)),
                share(),
            );
            this.editClassForm.addControl("riskClassId", this.formBuilder.control(null, Validators.required));
            if (this.data.actionType === ActionType.class_update) {
                this.isSpinnerLoading = true;
                this.riskClasses$.pipe(takeUntil(this.unsubscribe$)).subscribe((riskClasses) => {
                    const riskClass = riskClasses.find((riskClassData) => riskClassData.name === this.data.className.riskClass);
                    if (riskClass) {
                        this.editClassForm.get("riskClassId").setValue(riskClass.id);
                    }
                    this.isSpinnerLoading = false;
                });
            }
        }
        this.classNameMaxLength = this.isPEOClass ? PEO_CLASS_NAME_MAX_LENGTH : CLASS_NAME_MAX_LENGTH;
        const regex: RegexDataType = this.store.selectSnapshot(SharedState.regex);
        this.classNameRegex = this.isPEOClass ? regex.ALPHANUMERIC : regex.CLASS_NAME_PATTERN;
    }
    fetchLanguage(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.*"));
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.common.cancel",
            "primary.portal.regions.create",
            "primary.portal.common.save",
            "primary.portal.classes.name",
            "primary.portal.classes.description",
            "primary.portal.classtypePopup.industryCode",
            "primary.portal.common.select",
            "primary.portal.members.document.addUpdate.MaxChar",
            "primary.portal.formPageQuestion.alphaNumMaxLengthValidation",
            "primary.portal.classes.className.PEO",
        ]);
    }
    /**
     * Cleans up subscriptions
     * @returns nothing
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
