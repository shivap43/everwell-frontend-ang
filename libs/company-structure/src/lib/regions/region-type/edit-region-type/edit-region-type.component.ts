import { Component, OnInit, Inject } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { PayFrequency, AppSettings } from "@empowered/constants";
import { PortalsService } from "../../../portals.service";
import { CONTAINER_DATA } from "../../../container-data";
import { ContainerDataModel, ActionType } from "../../../shared/models/container-data-model";
import { Subscription, Observable } from "rxjs";
import { take } from "rxjs/operators";
import { Select, Store } from "@ngxs/store";
import { LanguageModel } from "@empowered/api";
import { LanguageService, LanguageState, LoadSecondaryLandingLanguage } from "@empowered/language";
import { AccountListState, SharedState } from "@empowered/ngxs-store";
import { CustomValidation } from "@empowered/ui";

@Component({
    selector: "empowered-edit-region-type",
    templateUrl: "./edit-region-type.component.html",
    styleUrls: ["./edit-region-type.component.scss"],
})
export class EditRegionTypeComponent implements OnInit {
    editRegionTypeForm: FormGroup;
    payFrequencies: PayFrequency[];
    ZeroState: boolean;
    validationConfigurations = [];
    getConfigurationSubscriber: Subscription;
    MP_GROUP: number;
    validationRegex: any;
    isEditForm = false;
    @Select(SharedState.regex) regex$: Observable<any>;
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.regions.regionTypeName",
        "primary.portal.regions.regionDescription",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.regions.create",
    ]);

    constructor(
        private readonly portalsService: PortalsService,
        private readonly formBuilder: FormBuilder,
        @Inject(CONTAINER_DATA)
        readonly data: ContainerDataModel,
        private readonly store: Store,
        private readonly language: LanguageService,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.*"));
        this.MP_GROUP = +this.store.selectSnapshot(AccountListState.getMpGroupId);
        this.ZeroState = this.portalsService.zeroState;
        this.regex$.pipe(take(2)).subscribe((regexData) => {
            if (regexData) {
                this.validationRegex = regexData;
            }
        });
        // Create new region type
        if (this.data.actionType === ActionType.region_type_create) {
            this.isEditForm = false;
            this.editRegionTypeForm = this.formBuilder.group(
                {
                    name: [
                        "",
                        Validators.compose([
                            Validators.required,
                            Validators.pattern(new RegExp(this.validationRegex.REGION_TYPE_NAME)),
                            Validators.maxLength(AppSettings.MAX_LENGTH_20),
                        ]),
                    ],
                    description: [
                        "",
                        Validators.compose([
                            Validators.pattern(new RegExp(this.validationRegex.REGION_TYPE_DESC)),
                            Validators.maxLength(AppSettings.MAX_LENGTH_200),
                        ]),
                    ],
                    determinesPlanAvailabilityOrPricing: [false],
                },
                { updateOn: "blur" },
            );
            // Edit region type
        } else if (this.data.actionType === ActionType.region_type_update) {
            this.isEditForm = true;
            this.editRegionTypeForm = this.formBuilder.group(
                {
                    name: [
                        this.data.regionType.name,
                        Validators.compose([
                            Validators.required,
                            Validators.pattern(new RegExp(this.validationRegex.REGION_TYPE_NAME)),
                            Validators.maxLength(AppSettings.MAX_LENGTH_20),
                        ]),
                    ],
                    description: [
                        this.data.regionType.description,
                        Validators.compose([
                            Validators.pattern(new RegExp(this.validationRegex.REGION_TYPE_DESC)),
                            Validators.maxLength(AppSettings.MAX_LENGTH_200),
                        ]),
                    ],
                    determinesPlanAvailabilityOrPricing: [this.data.regionType.determinesPlanAvailabilityOrPricing],
                },
                { updateOn: "blur" },
            );
        }
    }

    ngOnInit(): void {
        const customValidator = new CustomValidation();
        this.payFrequencies = this.portalsService.payFrequencies;
    }
    // method called post submitting the form
    editRegionType(): void {
        this.checkNameExists();
        if (this.editRegionTypeForm.valid) {
            if (this.data.actionType === ActionType.region_type_create) {
                this.portalsService.setAction({
                    action: ActionType.region_type_create,
                    data: this.editRegionTypeForm.value,
                });
            } else if (this.data.actionType === ActionType.region_type_update) {
                this.portalsService.setAction({
                    action: ActionType.region_type_update,
                    data: {
                        updateRegionTypeReq: this.editRegionTypeForm.value,
                        regionTypeId: this.data.regionType.id,
                    },
                });
            }
            const expPanels = document.querySelectorAll(".mat-expansion-panel");
            expPanels.forEach((each) => {
                each.classList.remove("panel-white-out");
            });
        }
    }
    cancel(): void {
        this.portalsService.detachPortal();
    }

    checkNameExists(): void {
        const regionTypeWithSameName = this.data.regionTypesList.find(
            (regionTypeDetails) =>
                regionTypeDetails.regionType.name.toLowerCase().trim() === this.editRegionTypeForm.controls.name.value.toLowerCase().trim(),
        );

        if (regionTypeWithSameName) {
            if (this.isEditForm && regionTypeWithSameName.regionType.id === this.data.regionType.id) {
                this.editRegionTypeForm.controls.name.setErrors(null);
            } else {
                this.editRegionTypeForm.controls.name.setErrors({ duplicateName: true });
            }
        }
    }
}
