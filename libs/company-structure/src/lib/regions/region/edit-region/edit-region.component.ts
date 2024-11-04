import { Component, OnInit, Inject, ViewChild, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { PortalsService } from "../../../portals.service";
import { CONTAINER_DATA } from "../../../container-data";
import { LanguageModel, AccountProfileService, State } from "@empowered/api";
import { Observable, Subscription, of } from "rxjs";
import { startWith, map, tap, catchError, take } from "rxjs/operators";
import { ContainerDataModel, ActionType } from "../../../shared/models/container-data-model";
import { AppSettings, CountryState } from "@empowered/constants";
import { Select, Store } from "@ngxs/store";
import { LanguageService, LanguageState, LoadSecondaryLandingLanguage } from "@empowered/language";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { HttpErrorResponse } from "@angular/common/http";
import { AccountListState, SharedState } from "@empowered/ngxs-store";
enum InvalidZipCodeRangeErrors {
    INVALID_POSTAL_CODE = "invalid_postal_code",
    EXISTING_POSTAL_CODE = "existing_postal_code",
    EXISTING_STATE_POSTAL_CODE = "existing_state_postal_code",
}
@Component({
    selector: "empowered-edit-region",
    templateUrl: "./edit-region.component.html",
    styleUrls: ["./edit-region.component.scss"],
})
export class EditRegionComponent implements OnInit, OnDestroy {
    defineRegionBy = ["By state", "By zip code range"];
    showSelectState = true;
    showZipCodeRange = false;
    editRegionForm: FormGroup;
    isChecked = false;
    statesList: string[] = [];
    stateListAbbr = [];
    stateChipList = [];
    allState: CountryState[];
    filteredState: Observable<CountryState[]>;
    lastFilter: string;
    rangesArray = [];
    isEditForm = false;
    validationConfigurations = [];
    getConfigurationSubscriber: Subscription;
    validationRegex: any;
    showErrorZipRange = false;
    showDuplicateErr = false;
    errRegionName: string;
    errRegionType: string;
    errStateNumber: number;
    errCode: string;
    @ViewChild("input") matInput;
    @Select(SharedState.regex) regex$: Observable<any>;
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    isInvalidZipSubscription: Subscription;
    isDuplicateRange = false;
    stateName: string;
    description: string;
    separatorKeysCodes: number[] = [ENTER, COMMA];
    selectable = true;
    showInvalidZipErr = false;
    inValidPostalCode = false;
    MpGroup: number;
    errorMessage: string;
    showErrorMessage = false;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.regions.addNewRegion",
        "primary.portal.regions.regionName",
        "primary.portal.regions.description",
        "primary.portal.regions.defineRegion",
        "primary.portal.regions.chooseStates",
        "primary.portal.regions.zipCode",
        "primary.portal.regions.addanotherRange",
        "primary.portal.common.cancel",
        "primary.portal.regions.create",
        "primary.portal.common.save",
        "primary.portal.common.remove",
    ]);
    regionTypeStates: string[];
    ActionType = ActionType;

    constructor(
        private readonly portalsService: PortalsService,
        private readonly formBuilder: FormBuilder,
        @Inject(CONTAINER_DATA)
        readonly data: ContainerDataModel,
        private readonly ref: ChangeDetectorRef,
        private readonly store: Store,
        private readonly accountProfileService: AccountProfileService,
        private readonly languageService: LanguageService,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.*"));
        this.regex$.subscribe((regexData) => {
            if (regexData) {
                this.validationRegex = regexData;
            }
        });
    }

    ngOnInit(): void {
        // states that are already selected in other regions under the same type
        this.regionTypeStates = [].concat(
            ...this.data.regionsList.map((region) => region.composition["states"]).filter((states) => states),
        );

        this.allState = this.portalsService.allStates;
        this.MpGroup = +this.store.selectSnapshot(AccountListState.getMpGroupId);
        this.createFormControls();
    }
    /**
     * Method to create form controls
     */
    createFormControls = () => {
        if (this.data.actionType === ActionType.region_create) {
            this.isEditForm = false;
            this.editRegionForm = this.formBuilder.group(
                {
                    name: [
                        "",
                        Validators.compose([
                            Validators.required,
                            Validators.pattern(new RegExp(this.validationRegex.REGIONS_NAME)),
                            Validators.maxLength(AppSettings.MAX_LENGTH_20),
                        ]),
                    ],
                    description: [
                        "",
                        [
                            Validators.pattern(new RegExp(this.validationRegex.REGIONS_DESC)),
                            Validators.maxLength(AppSettings.MAX_LENGTH_200),
                        ],
                    ],
                    defineRegionBy: ["By state"],
                    stateControl: [null, { updateOn: "change" }],
                    ZipCodeFrom: ["", Validators.pattern(new RegExp(this.validationRegex.ZIP_CODE))],
                    ZipCodeTo: ["", Validators.pattern(new RegExp(this.validationRegex.ZIP_CODE))],
                },
                { updateOn: "blur" },
            );
            this.updateFilteredState();
        } else if (this.data.actionType === ActionType.region_update && this.data.regionName) {
            let regionBy = "";
            this.isEditForm = true;
            if (this.data.regionName.composition.states) {
                this.filterStatesAbbrivation(this.allState);
                regionBy = "By state";
            } else {
                this.rangesArray = this.data.regionName.composition.ranges.slice(1);
                regionBy = "By zip code range";
            }
            this.editRegionForm = this.formBuilder.group(
                {
                    name: [
                        this.data.regionName.name,
                        Validators.compose([
                            Validators.required,
                            Validators.pattern(new RegExp(this.validationRegex.REGIONS_NAME)),
                            Validators.maxLength(AppSettings.MAX_LENGTH_20),
                        ]),
                    ],
                    description: [
                        this.data.regionName.description,
                        [
                            Validators.pattern(new RegExp(this.validationRegex.REGIONS_DESC)),
                            Validators.maxLength(AppSettings.MAX_LENGTH_200),
                        ],
                    ],
                    defineRegionBy: [regionBy],
                    stateControl: [this.statesList, { updateOn: "change" }],
                    ZipCodeFrom: [
                        this.data.regionName.composition.ranges && this.data.regionName.composition.ranges[0].start,
                        Validators.pattern(new RegExp(this.validationRegex.ZIP_CODE)),
                    ],
                    ZipCodeTo: [
                        this.data.regionName.composition.ranges && this.data.regionName.composition.ranges[0].end,
                        Validators.pattern(new RegExp(this.validationRegex.ZIP_CODE)),
                    ],
                },
                { updateOn: "blur" },
            );
            this.updateFilteredState();
        }
    };
    /**
     * Method to filter state abbreviation
     * @param states : States to filter based on abbreviation
     */
    filterStatesAbbrivation(states: CountryState[]): void {
        states.forEach((element) =>
            this.data.regionName.composition.states.forEach((ele2) => {
                if (element.abbreviation === ele2) {
                    this.statesList.push(element.name);
                    this.stateListAbbr.push(element.abbreviation);
                }
            }),
        );
    }

    get regionFormsControls(): any {
        return this.editRegionForm.controls;
    }

    createOrEditRegion(): void {
        this.checkNameExists();
        if (this.editRegionForm.value.defineRegionBy === "By state" && !this.statesList.length) {
            this.editRegionForm.controls.stateControl.setErrors({ required: true });
        }
        if (
            this.editRegionForm.value.defineRegionBy === "By zip code range" &&
            (!this.regionFormsControls.ZipCodeFrom.value || !this.regionFormsControls.ZipCodeTo.value)
        ) {
            this.editRegionForm.controls.ZipCodeFrom.setErrors({ required: true });
            this.editRegionForm.controls.ZipCodeTo.setErrors({ required: true });
        }
        if (this.editRegionForm.valid) {
            this.validateZipRange();
            if (this.data.actionType === ActionType.region_create) {
                this.createRegion();
            } else {
                this.updateRegion();
            }
        }
    }

    // create region
    createRegion(): void {
        const stateFormValues = this.editRegionForm.value;
        if (!stateFormValues.description) {
            stateFormValues.description = "";
        }
        if (this.editRegionForm.value.defineRegionBy === "By state") {
            this.portalsService.setAction({
                action: this.data.actionType,
                data: {
                    createRegionReq: {
                        name: stateFormValues.name,
                        description: stateFormValues.description,
                        composition: { states: this.stateListAbbr },
                    },
                    regionTypeId: this.data.regionType.id,
                },
            });
        } else if (this.editRegionForm.value.defineRegionBy === "By zip code range") {
            this.addSuccessRanges();
            if (!this.isDuplicateRange) {
                this.portalsService.setAction({
                    action: this.data.actionType,
                    data: {
                        createRegionReq: {
                            name: stateFormValues.name,
                            description: stateFormValues.description,
                            composition: { ranges: this.rangesArray },
                        },
                        regionTypeId: this.data.regionType.id,
                    },
                });
            }
        }
    }

    // update region
    updateRegion(): void {
        const stateFormValues = this.editRegionForm.value;
        if (!stateFormValues.description) {
            stateFormValues.description = "";
        }
        if (this.editRegionForm.value.defineRegionBy === "By state") {
            this.portalsService.setAction({
                action: this.data.actionType,
                data: {
                    updateRegionReq: {
                        name: stateFormValues.name,
                        description: stateFormValues.description,
                        composition: { states: this.stateListAbbr },
                    },
                    regionTypeId: this.data.regionType.id,
                    regionId: this.data.regionName.id,
                },
            });
        } else if (this.editRegionForm.value.defineRegionBy === "By zip code range") {
            this.addSuccessRanges();
            if (!this.isDuplicateRange) {
                this.portalsService.setAction({
                    action: this.data.actionType,
                    data: {
                        updateRegionReq: {
                            name: stateFormValues.name,
                            description: stateFormValues.description,
                            composition: { ranges: this.rangesArray },
                        },
                        regionTypeId: this.data.regionType.id,
                        regionId: this.data.regionName.id,
                    },
                });
            }
        }
    }
    /**
     * Adding and removing state
     * @param state as State
     * @returns void
     */
    addRemoveState(state: State): void {
        if (this.regionTypeStates.includes(state.abbreviation) && this.data.actionType === ActionType.region_create) {
            return;
        }
        this.stateName = state.name;
        this.removeText();
        const index = this.statesList.indexOf(this.stateName);
        if (index < 0) {
            this.statesList.push(this.stateName);
            const i = this.allState.findIndex((x) => x.name === this.stateName);
            this.stateListAbbr.push(this.allState[i].abbreviation);
        }
        if (this.statesList.length === this.allState.length) {
            this.isChecked = true;
        }
        if (!this.editRegionForm.controls.stateControl.value) {
            this.editRegionForm.controls.stateControl.reset();
        }
        if (this.statesList.length > 0) {
            this.showDuplicateErr = true;
            this.showErrorZipRange = false;
        } else {
            this.showDuplicateErr = false;
            this.showErrorZipRange = false;
        }
    }
    isStateSelected(state: string): boolean {
        return this.statesList.indexOf(state) >= 0 ? true : false;
    }
    removeState(statename: string): void {
        this.editRegionForm.controls.stateControl.setValue("");
        const index = this.statesList.indexOf(statename);
        if (index >= 0) {
            this.isChecked = false;
            this.statesList.splice(index, 1);
            this.stateListAbbr.splice(index, 1);
        }
        if (this.statesList.length > 0) {
            this.showDuplicateErr = true;
        } else {
            this.showDuplicateErr = false;
        }
    }
    /* setTimeOut required in this file since the changes of remove text is not reflecting
    in the view appropriately*/
    removeText(): void {
        /* setTimeout is required to remove the data typed when clicked outside input field and
             since it's a mat autocomplete clicking on any value from the dropdown will
             consider as click outside and the value will not get appended in the input field*/
        setTimeout(() => {
            this.matInput.nativeElement.value = "";
            this.editRegionForm.controls.stateControl.setValue("");
        }, 250);
    }
    /**
     * This method will get selected state in dropdown
     */
    updateFilteredState(): void {
        this.filteredState = this.editRegionForm.controls.stateControl.valueChanges.pipe(
            startWith<string | CountryState[]>(""),
            map((value) => (typeof value === "string" ? value : this.lastFilter)),
            map((filter) => this.filter(filter)),
        );
    }
    /**
     * This method will return the searched state.
     * @param filter : Filter to search state
     * @returns {CountryState[]} List of State matching the filter
     */
    filter(filter: string): CountryState[] {
        this.lastFilter = filter;
        let filteredStates;
        if (filter) {
            filteredStates = this.allState.filter((option) => option.name.toLowerCase().indexOf(filter.toLowerCase()) >= 0);
        } else {
            filteredStates = this.allState.slice();
        }
        return filteredStates;
    }

    // add zip ranges
    addRanges(): void {
        const zipCodeFromControl = this.editRegionForm.get("ZipCodeFrom");
        const zipCodeToControl = this.editRegionForm.get("ZipCodeTo");
        if (
            this.data.actionType === ActionType.region_update &&
            this.data.regionName.composition.ranges &&
            this.data.regionName.composition.ranges[0].start === zipCodeFromControl.value &&
            this.data.regionName.composition.ranges[0].end === zipCodeToControl.value
        ) {
            // Skip zip code range validation when in edit mode, if the form fields have not been updated.
            this.showInvalidZipErr = false;
            this.inValidPostalCode = false;
            this.addSuccessRanges();
        } else if (zipCodeFromControl.valid && zipCodeToControl.valid) {
            this.accountProfileService
                .validatePostalRange(this.data.regionType.id, zipCodeFromControl.value, zipCodeToControl.value, this.MpGroup)
                .pipe(
                    take(1),
                    tap(() => {
                        this.showInvalidZipErr = false;
                        this.inValidPostalCode = false;
                        this.addSuccessRanges();
                    }),
                    catchError((httpErrorResponse: HttpErrorResponse) => {
                        const error = httpErrorResponse.error;
                        if (error.status === AppSettings.API_RESP_400 && error.details.length) {
                            this.inValidPostalCode = httpErrorResponse.error.details.find(
                                (detail) => detail.code === InvalidZipCodeRangeErrors.INVALID_POSTAL_CODE,
                            );
                            this.showInvalidZipErr = httpErrorResponse.error.details.find((detail) =>
                                [
                                    InvalidZipCodeRangeErrors.EXISTING_POSTAL_CODE,
                                    InvalidZipCodeRangeErrors.EXISTING_STATE_POSTAL_CODE,
                                ].includes(detail.code),
                            );
                        } else {
                            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                                `secondary.api.${error.status}.${error.code}`,
                            );
                            this.showErrorMessage = true;
                        }
                        this.ref.detectChanges();
                        return of(null);
                    }),
                )
                .subscribe();
        }
    }
    addSuccessRanges(): void {
        const regionFormValues = this.editRegionForm.value;
        const rangeObj = { start: regionFormValues.ZipCodeFrom, end: regionFormValues.ZipCodeTo };
        const rangeAvailable = this.rangesArray.filter(
            (rangeZip) =>
                (rangeObj.start >= rangeZip.start && rangeObj.start <= rangeZip.end) ||
                (rangeObj.end >= rangeZip.start && rangeObj.end <= rangeZip.end),
        );
        if (rangeAvailable.length) {
            this.isDuplicateRange = true;
            // setTimeout is required to subscribe the changes if any
            setTimeout(() => {
                this.ref.detectChanges();
            }, 500);
        } else {
            this.isDuplicateRange = false;
            this.rangesArray.push(rangeObj);
            this.regionFormsControls.ZipCodeFrom.setValue("");
            this.regionFormsControls.ZipCodeTo.setValue("");
        }
    }
    cancel(): void {
        this.portalsService.detachPortal();
    }

    checkNameExists(): void {
        const regionWithSameName = this.data.regionsList.find(
            (region) => region.name.toLowerCase().trim() === this.editRegionForm.controls.name.value.toLowerCase().trim(),
        );
        if (regionWithSameName) {
            if (this.isEditForm && regionWithSameName.id === this.data.regionName.id) {
                this.editRegionForm.controls.name.setErrors(null);
            } else {
                this.editRegionForm.controls.name.setErrors({ duplicateName: true });
            }
        }
    }

    validateZipRange(): void {
        this.isInvalidZipSubscription = this.portalsService.isInvalidZip$.subscribe((value) => {
            if (value && value.valid === true) {
                this.showErrorZipRange = true;
                this.errRegionType = value.type;
                this.errStateNumber = value.numberOfState;
                this.errCode = value.code;
                if (value.code === "invalid_postal_code") {
                    this.rangesArray.pop();
                    this.inValidPostalCode = true;
                } else if (value.code === "existing_postal_code" || value.code === "existing_state_postal_code") {
                    this.rangesArray.pop();
                    this.showInvalidZipErr = true;
                }
                // setTimeout is required to subscribe the changes if any
                setTimeout(() => {
                    this.ref.detectChanges();
                }, 300);
            }
        });
    }
    removeZipCodeErr(): void {
        this.showErrorZipRange = false;
        this.isDuplicateRange = false;
        this.showInvalidZipErr = false;
        this.inValidPostalCode = false;
        // setTimeout is required to subscribe the changes if any
        setTimeout(() => {
            this.ref.detectChanges();
        }, 300);
    }

    removeZipRange(index: number): void {
        this.rangesArray.splice(index, 1);
    }
    ngOnDestroy(): void {
        this.ref.detach();
        if (this.isInvalidZipSubscription) {
            this.isInvalidZipSubscription.unsubscribe();
        }
    }
}
