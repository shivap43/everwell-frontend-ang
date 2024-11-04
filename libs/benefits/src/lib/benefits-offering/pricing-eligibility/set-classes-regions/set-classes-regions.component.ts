import { Component, OnInit, ViewChild, OnDestroy, Output, EventEmitter, Input, OnChanges } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { LanguageService } from "@empowered/language";

import { CoreService, BenefitsOfferingService, RegionNames, ClassNames, RegionTypeDisplay } from "@empowered/api";
import { RiskClass } from "@empowered/constants";
import { Observable, Subscription } from "rxjs";
import { startWith, map, take } from "rxjs/operators";
import { Store } from "@ngxs/store";
import { BenefitsOfferingState, SetPopupExitStatus, SetProductCombinations } from "@empowered/ngxs-store";
import { ActivatedRoute } from "@angular/router";
import { MonDialogComponent } from "@empowered/ui";
import { MatDialog } from "@angular/material/dialog";
import { MatCheckboxChange } from "@angular/material/checkbox";

@Component({
    selector: "empowered-set-classes-regions",
    templateUrl: "./set-classes-regions.component.html",
    styleUrls: ["./set-classes-regions.component.scss"],
})
export class SetClassesRegionsComponent implements OnInit, OnDestroy, OnChanges {
    regionTypesDisplay: { regionType: RegionTypeDisplay; regions: RegionNames[] }[];
    setclassregionForm: FormGroup;
    regions: any[];
    isChecked = false;
    isRegionChecked = false;
    isClassChecked = false;
    isSkiped = false;
    isInitialLoad = true;
    selectedRegionListOriginal: RegionNames[] = [];
    selectedRegionList: RegionNames[] = [];
    selectedRegionIds: number[] = [];
    filteredRegion: Observable<RegionNames[]>;
    allRegions: RegionNames[] = [];
    selectedClassListOriginal: ClassNames[] = [];
    selectedClassList: ClassNames[] = [];
    selectedClassIds: number[] = [];
    filteredClasses: Observable<ClassNames[]>;
    allClasses: ClassNames[] = [];
    @ViewChild("regioninput") matInput;
    @ViewChild("classinput") classinput;
    lastFilter: string;
    mpGroup: number;
    riskClass: RiskClass[] = [];
    carrierName: string;
    planchoiceId: number;
    carrierId: number;
    isReadonly = false;
    isDisplayForm = true;
    isRegionClassHidden = true;
    isNoClassRegionSetup = false;
    employeeCategoryCombinations: any = [];
    newEmployeeCategoryCombinations: any = [];
    initialEmployeeCategoryCombinations: any = [];
    isDisplaySetPricing = false;
    isAllRegionAdded = false;
    isAllClassAdded = false;
    isPopupRequired = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.setClassRegions.title",
        "primary.portal.setClassRegions.instructions",
        "primary.portal.setClassRegions.isRegionHidden",
        "primary.portal.setClassRegions.addClasses",
        "primary.portal.setClassRegions.youHaveNotCreated",
        "primary.portal.setClassRegions.createClasses",
        "primary.portal.setClassRegions.selectClasses",
        "primary.portal.setClassRegions.regions",
        "primary.portal.setClassRegions.of",
        "primary.portal.setClassRegions.chooseEmployment",
        "primary.portal.setClassRegions.atleast1region",
        "primary.portal.setClassRegions.atleast1Class",
        "primary.portal.setClassRegions.common.update",
        "primary.portal.setClassRegions.searchAndSetRegion",
        "primary.portal.setClassRegions.searchAndSetClass",
        "primary.portal.setClassRegions.employmentClass",
        "primary.portal.setClassRegions.chooseUnions",
        "primary.portal.setClassRegions.unionClasses",
        "primary.portal.setClassRegions.riskClaases",
        "primary.portal.setClassRegions.riskinfoDetermine",
        "primary.portal.setClassRegions.riskinfoIncluded",
        "primary.portal.setClassRegions.createEmployee",
        "primary.portal.setClassRegions.classesAndRegions",
        "primary.portal.common.edit",
        "primary.portal.common.skip",
        "primary.portal.setClassRegions.yourSelections",
        "primary.portal.setClassRegions.Employment",
        "primary.portal.setClassRegions.popup.withoutSelectingHeading",
        "primary.portal.setClassRegions.popup.withoutSelectingContent",
        "primary.portal.common.continue",
        "primary.portal.common.cancel",
        "primary.portal.common.update",
        "primary.portal.setClassRegions.removeClass",
        "primary.portal.setClassRegions.removeRegion",
        "primary.portal.common.apply",
    ]);
    @Input() regionList: RegionNames[];
    @Input() classList: ClassNames[];
    @Input() riskClassList: ClassNames[];
    @Input() undoOrCancel: string;
    @Output() emitEmployeeCombinations = new EventEmitter<any>();
    @Output() emitNewEmployeeCombinations = new EventEmitter<any>();
    @Output() emitdisplaySetPricing = new EventEmitter<any>();
    @Output() emitshowCombinationPopup = new EventEmitter<any>();
    @Input() isEditPricesFlag: boolean;
    $event: any;
    isLoading = false;
    subscription: Subscription[] = [];
    isEditPricing: boolean;

    constructor(
        private readonly fb: FormBuilder,
        private readonly coreService: CoreService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly store: Store,
        private readonly route: ActivatedRoute,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
    ) {
        this.subscription.push(
            this.route.params.subscribe((params) => {
                this.reset();

                this.planchoiceId = +this.route.snapshot.paramMap.get("planId");
                this.initializeForm();
                this.displayOption("Select");
                this.readCombinationFromStore();
                this.newEmployeeCategoryCombinations = [];
                this.emitEvent();
            }),
        );
    }

    ngOnInit(): void {
        this.reset();
        this.emitEvent();
    }

    ngOnChanges(): void {
        this.allRegions = this.regionList;
        this.allClasses = this.classList;
        this.checkboxChecked(this.$event, "");
        if (this.undoOrCancel === "undo") {
            this.displayOption("Save");
            this.onUndoOrCancel();
        } else if (this.undoOrCancel === "cancel") {
            this.displayOption("Select");
        }
        this.isEditPricing = this.isEditPricesFlag;
        if (this.isEditPricing) {
            this.cancel();
        }
    }

    initializeForm(): void {
        this.setclassregionForm = this.fb.group({
            regionControl: ["", Validators.required],
            classControl: ["", Validators.required],
            unionControl: [null],
        });
    }
    readCombinationFromStore(): void {
        const localstore = this.store.selectSnapshot(BenefitsOfferingState.getProductCombinations);
        const index = localstore.findIndex((x) => x.choiceId === this.planchoiceId);
        if (index > -1 && localstore[index] != null) {
            this.employeeCategoryCombinations = localstore[index].combinations.slice();
            this.initialEmployeeCategoryCombinations = this.employeeCategoryCombinations.slice();
            this.isDisplaySetPricing = localstore[index].combinations.length > 0 === true;
            this.isInitialLoad = this.employeeCategoryCombinations.length > 0 ? false : true;
            if (this.employeeCategoryCombinations.length > 0) {
                this.displayOption("Save");
                this.getEligibleRegionsAndClasses();
            }
            if (
                localstore[index].product != null &&
                localstore[index].product.plansDetails != null &&
                localstore[index].product.plansDetails.length
            ) {
                this.carrierId = localstore[index].product.plansDetails[0].plan["carrierId"];

                this.getCarrier();
            }
        } else {
            this.employeeCategoryCombinations = [];
        }
    }
    onUndoOrCancel(): void {
        this.isLoading = true;
        this.resetCheckboxSelection();
        this.getEligibleRegionsAndClasses();
        this.isLoading = false;
    }

    addRegionIds(region: RegionNames): void {
        const index = this.selectedRegionIds.indexOf(region.id);
        if (index === -1) {
            this.selectedRegionIds.push(region.id);
            this.selectedRegionList.push(region);
        }
    }
    addClassIds(className: ClassNames): void {
        const index = this.selectedClassIds.indexOf(className.id);
        if (index === -1) {
            this.selectedClassIds.push(className.id);
            this.selectedClassList.push(className);
        }
    }
    updateCombinationStore(newCombinations: any): void {
        const localStoreData = JSON.parse(JSON.stringify([...this.store.selectSnapshot(BenefitsOfferingState.getProductCombinations)]));
        const planIndex = localStoreData.findIndex((x) => x.choiceId.toString() === this.planchoiceId.toString());
        localStoreData[planIndex].combinations = newCombinations;
        this.store.dispatch(new SetProductCombinations(localStoreData));
        this.isInitialLoad = newCombinations.length > 0 ? false : true;
    }

    checkboxChecked(change: MatCheckboxChange, type: string): void {
        if (typeof type !== "undefined" && type) {
            switch (type) {
                case "Region":
                    this.isRegionChecked = change.checked;
                    if (!this.isRegionChecked) {
                        this.selectedRegionList = [];
                        this.selectedRegionIds = [];
                        this.resetRegionSelection();
                    }
                    this.regionFieldValidation();
                    break;
                case "Class":
                    this.isClassChecked = change.checked;
                    if (!this.isClassChecked) {
                        this.selectedClassList = [];
                        this.selectedClassIds = [];
                        this.resetClassSelection();
                    }
                    this.classFieldValidation();
                    break;
                default:
                    this.isReadonly = change.checked;
            }
            this.setExitStatus(true);
        }
        this.setRegionCheckboxSelection();
        this.setClassCheckboxSelection();
        this.updateRegionsFilter();
        this.updateClassFilter();
    }

    private setRegionCheckboxSelection(): void {
        this.selectedRegionList.forEach((item) => {
            const filteredElements = this.allRegions.find((ele) => ele.id === item.id);
            if (filteredElements !== undefined) {
                filteredElements.isselected = true;
            }
        });
    }
    private setClassCheckboxSelection(): void {
        this.selectedClassList.forEach((item) => {
            const filteredElements = this.allClasses.find((ele) => ele.id === item.id);
            if (filteredElements !== undefined) {
                filteredElements.isselected = true;
            }
        });
    }
    private resetRegionSelection(): void {
        this.allRegions.forEach((item) => {
            item.isselected = false;
        });
    }
    private resetClassSelection(): void {
        this.allClasses.forEach((item) => {
            item.isselected = false;
        });
    }
    private resetCheckboxSelection(): void {
        this.resetClassSelection();
        this.resetRegionSelection();
    }

    addRemoveRegion(region: RegionNames): void {
        this.setclassregionForm.controls.regionControl.setValue("");
        let checked = false;
        if (region.id !== 0) {
            const index = this.selectedRegionList.findIndex((X) => X.id === region.id);
            if (index >= 0) {
                this.setRegionCheckboxSelection();
                this.selectedRegionList.splice(index, 1);
                this.selectedRegionIds.splice(index, 1);
                checked = false;
            } else {
                this.addRegionIds(region);
                checked = true;
            }
            const selectedRegion = this.allRegions.find((x) => x.id === region.id);
            selectedRegion.isselected = checked;
            this.setSelectAllRegion(false);
        } else if (region.id === 0) {
            this.addAllRegion(this.setSelectAllRegion(true));
        }
        this.regionList = this.allRegions;
        this.regionFieldValidation();
        this.setExitStatus(true);
    }
    setSelectAllRegion(isSelectAll: boolean): RegionNames {
        const allRegion = this.allRegions.find((x) => x.id === 0);
        if (isSelectAll) {
            if (allRegion.isselected === false) {
                allRegion.isselected = true;
            } else {
                allRegion.isselected = false;
            }
        } else if (!isSelectAll && allRegion.isselected === true) {
            allRegion.isselected = false;
        }
        return allRegion;
    }
    addAllRegion(region: RegionNames): void {
        if (region.isselected === true) {
            this.selectedRegionList = [];
            this.selectedRegionIds = [];
            this.allRegions.forEach((item) => {
                if (item.id !== 0) {
                    this.addRegionIds(item);
                    item.isselected = true;
                }
            });
        } else if (region.isselected === false) {
            this.selectedRegionList = [];
            this.selectedRegionIds = [];
            this.allRegions.forEach((item) => {
                item.isselected = false;
            });
        }
    }

    addAllClass(allclass: ClassNames): void {
        if (allclass.isselected === true) {
            this.selectedClassList = [];
            this.selectedClassIds = [];
            this.allClasses.forEach((item) => {
                if (item.id !== 0) {
                    this.addClassIds(item);
                    item.isselected = true;
                }
            });
        } else if (allclass.isselected === false) {
            this.selectedClassList = [];
            this.selectedClassIds = [];
            this.allClasses.forEach((item) => {
                item.isselected = false;
            });
        }
    }

    private classFieldValidation(): void {
        if (this.selectedClassList.length > 0) {
            this.setclassregionForm.get("classControl").clearValidators();
            this.setclassregionForm.get("classControl").setErrors({ required: null });
            this.setclassregionForm.get("classControl").updateValueAndValidity();
        } else {
            this.setclassregionForm.get("classControl").setValidators([Validators.required]);
            this.setclassregionForm.get("classControl").setErrors({ required: true });
            this.setclassregionForm.get("classControl").updateValueAndValidity();
        }
    }

    private regionFieldValidation(): void {
        if (this.selectedRegionList.length > 0) {
            this.setclassregionForm.get("regionControl").clearValidators();
            this.setclassregionForm.get("regionControl").setErrors({ required: null });
            this.setclassregionForm.get("regionControl").updateValueAndValidity();
        } else {
            this.setclassregionForm.get("regionControl").setValidators([Validators.required]);
            this.setclassregionForm.get("regionControl").setErrors({ required: true });
            this.setclassregionForm.get("regionControl").updateValueAndValidity();
        }
    }

    removeText(): void {
        /* setTimeout is required to remove the data typed when clicked outside input field and
             since it's a mat autocomplete clicking on any value from the dropdown will
             consider as click outside and the value will not get appended in the input field*/
        setTimeout(() => {
            this.matInput.nativeElement.value = "";
            this.setclassregionForm.controls.regionControl.setValue("");
        }, 250);
    }
    updateRegionsFilter(): void {
        this.filteredRegion = this.setclassregionForm.controls.regionControl.valueChanges.pipe(
            startWith<string | RegionNames[]>(""),
            map((value) => (typeof value === "string" ? value : this.lastFilter)),
            map((filter) => this.filter(filter)),
        );
    }

    filter(filter: string): RegionNames[] {
        this.lastFilter = filter;
        let filteredRegions;
        if (filter) {
            filteredRegions = this.allRegions.filter((option) => option.name.toLowerCase().indexOf(filter.toLowerCase()) >= 0);
        } else {
            filteredRegions = this.allRegions.slice();
        }
        return filteredRegions;
    }

    addRemoveClasses(classname: ClassNames): void {
        this.setclassregionForm.controls.classControl.setValue("");
        let checked = false;
        if (classname.id !== 0) {
            const index = this.selectedClassList.findIndex((X) => X.id === classname.id);

            if (index >= 0) {
                this.setClassCheckboxSelection();
                this.selectedClassList.splice(index, 1);
                this.selectedClassIds.splice(index, 1);
                checked = false;
            } else {
                this.addClassIds(classname);
                checked = true;
            }
            const selectedClass = this.allClasses.find((x) => x.id === classname.id);
            selectedClass.isselected = checked;
            this.setSelectAllClass(false);
        } else if (classname.id === 0) {
            this.addAllClass(this.setSelectAllClass(true));
        }
        this.setExitStatus(true);

        this.classList = this.allClasses;
        this.classFieldValidation();
    }

    setSelectAllClass(isSelectAll: boolean): ClassNames {
        const allclass = this.allClasses.find((x) => x.id === 0);
        if (isSelectAll) {
            if (allclass.isselected === false) {
                allclass.isselected = true;
            } else {
                allclass.isselected = false;
            }
        } else if (!isSelectAll && allclass.isselected === true) {
            allclass.isselected = false;
        }
        return allclass;
    }
    removeClassText(): void {
        /* setTimeout is required to remove the data typed when clicked outside input field and
             since it's a mat autocomplete clicking on any value from the dropdown will
             consider as click outside and the value will not get appended in the input field*/
        setTimeout(() => {
            this.classinput.nativeElement.value = "";
            this.setclassregionForm.controls.classControl.setValue("");
        }, 250);
    }

    updateClassFilter(): void {
        this.filteredClasses = this.setclassregionForm.controls.classControl.valueChanges.pipe(
            startWith<string | ClassNames[]>(""),
            map((value) => (typeof value === "string" ? value : this.lastFilter)),
            map((filter) => this.filterClasses(filter)),
        );
    }

    filterClasses(filter: string): ClassNames[] {
        this.lastFilter = filter;
        let filteredClasses;
        if (filter) {
            filteredClasses = this.allClasses.filter((option) => option.name.toLowerCase().indexOf(filter.toLowerCase()) >= 0);
        } else {
            filteredClasses = this.allClasses.slice();
        }
        return filteredClasses;
    }

    getRiskClasses(): void {
        this.subscription.push(
            this.coreService.getRiskClasses(this.carrierId).subscribe(
                (response) => {
                    this.riskClass = response;
                },
                (err) => {
                    this.isLoading = false;
                },
            ),
        );
    }
    getCarrier(): void {
        const localstore = this.store.selectSnapshot(BenefitsOfferingState.getAllCarriers);
        this.carrierName = localstore.find((x) => x.id === this.carrierId).name;
    }

    getEligibleRegionsAndClasses(): void {
        this.selectedClassIds = [];
        this.selectedClassList = [];
        this.selectedClassListOriginal = [];
        this.selectedRegionIds = [];
        this.selectedRegionList = [];
        this.selectedRegionListOriginal = [];
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.subscription.push(
            this.benefitsOfferingService.getEligibleRegionsAndClasses(this.planchoiceId, this.mpGroup, true).subscribe(
                (res) => {
                    Object.keys(res.regionMap).forEach((element) => {
                        res.regionMap[element].forEach((item) => {
                            this.selectedRegionList.push(item);
                            this.selectedRegionListOriginal.push(item);
                            this.selectedRegionIds.push(item.id);
                        });
                    });
                    if (this.selectedRegionIds.length > 0) {
                        this.isRegionChecked = true;
                    }

                    Object.keys(res.classMap).forEach((element) => {
                        res.classMap[element].forEach((item) => {
                            if (item.riskClass === undefined) {
                                this.selectedClassList.push(item);
                                this.selectedClassListOriginal.push(item);
                                this.selectedClassIds.push(item.id);
                            }
                        });
                    });
                    if (this.selectedClassIds.length > 0) {
                        this.isClassChecked = true;
                    }
                    this.setRegionCheckboxSelection();
                    this.setClassCheckboxSelection();
                    this.isLoading = false;
                },
                (error) => {
                    this.isLoading = false;
                    // TODO: Add MON-alert for errors
                },
            ),
        );
    }

    emitEvent(): void {
        this.emitEmployeeCombinations.emit(this.employeeCategoryCombinations);
        this.emitNewEmployeeCombinations.emit(this.newEmployeeCategoryCombinations);
        this.emitdisplaySetPricing.emit(this.isDisplaySetPricing);
        this.emitshowCombinationPopup.emit(this.isPopupRequired);
    }
    setCombinationPopupStatus(): void {
        const localstore = this.store.selectSnapshot(BenefitsOfferingState.getProductCombinations);
        const index = localstore.findIndex((x) => x.choiceId === this.planchoiceId);
        if (index > -1 && localstore[index] != null) {
            this.employeeCategoryCombinations = localstore[index].combinations.slice();
            this.initialEmployeeCategoryCombinations = this.employeeCategoryCombinations.slice();
        }
        this.isPopupRequired = false;
        if (
            (this.selectedRegionListOriginal.length === 0 && this.selectedRegionList.length > 0) ||
            (this.selectedRegionList.length === 0 && this.selectedRegionListOriginal.length > 0) ||
            (this.selectedClassListOriginal.length === 0 && this.selectedClassList.length > 0) ||
            (this.selectedClassList.length === 0 && this.selectedClassListOriginal.length > 0)
        ) {
            this.isPopupRequired = true;
        }
        if (this.isPopupRequired) {
            if (this.initialEmployeeCategoryCombinations.some((x) => x.priceOrRates.length > 0)) {
                this.isPopupRequired = true;
            } else {
                this.isPopupRequired = false;
            }
        }
    }
    saveEligibleRegionAndClass(): void {
        if (this.selectedClassIds.length > 0) {
            this.riskClassList.forEach((element) => {
                const index = this.selectedClassIds.indexOf(element.id);
                if (index === -1) {
                    this.selectedClassIds.push(element.id);
                }
            });
        }
        const requestpayload = {
            regionIds: this.selectedRegionIds,
            classIds: this.selectedClassIds,
        };
        this.setCombinationPopupStatus();
        this.isLoading = true;
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.subscription.push(
            this.benefitsOfferingService.saveEligibleRegionAndClass(requestpayload, this.planchoiceId, this.mpGroup).subscribe(
                (resp) => {
                    const location: string = resp.headers.get("location");
                    if (typeof location !== "undefined" && location) {
                        this.benefitsOfferingService
                            .getPlanPricingEligibilityCombinations(this.planchoiceId, this.mpGroup, true)
                            .pipe(take(1))
                            .subscribe(
                                (res) => {
                                    this.newEmployeeCategoryCombinations = res;
                                    this.readCombinationFromStore();
                                    this.isDisplaySetPricing = true;
                                    this.emitEvent();
                                    this.updateCombinationStore(res);
                                    this.isLoading = false;
                                    this.setExitStatus(false);
                                },
                                (err) => {
                                    this.isLoading = false;
                                },
                            );
                    }
                },
                (error) => {
                    this.isLoading = false;
                    // TODO: Add MON-alert for errors
                },
            ),
        );
    }

    displayOption(option: string): void {
        if (typeof option !== "undefined" && option) {
            switch (option) {
                case "Edit":
                    this.setRegionClassChecked();
                    this.setBooleanFlag(false, false, true, true, false);
                    this.regionFieldValidation();
                    this.classFieldValidation();
                    break;
                case "Save":
                    this.setRegionClassChecked();
                    this.setBooleanFlag(true, false, false, false, false);
                    break;
                case "Select":
                    this.setRegionClassChecked();
                    this.setBooleanFlag(false, false, true, true, false);
                    break;
                case "SelectType":
                    this.getEligibleRegionsAndClasses();
                    this.setRegionClassChecked();
                    this.setBooleanFlag(false, false, true, true, false);
                    break;
                case "Skip":
                    this.setRegionClassChecked();
                    this.setBooleanFlag(false, true, false, false, false);
                    this.selectedClassIds = [];
                    this.selectedRegionIds = [];
                    this.selectedClassList = [];
                    this.selectedRegionList = [];
                    this.resetCheckboxSelection();
                    break;
                default:
                    this.isReadonly = true;
            }
        }
    }
    setRegionClassChecked(): void {
        if (!this.selectedClassList.length) {
            this.isClassChecked = false;
        } else {
            this.isClassChecked = true;
        }
        if (!this.selectedRegionList.length) {
            this.isRegionChecked = false;
        } else {
            this.isRegionChecked = true;
        }
    }

    setBooleanFlag(
        isReadonly: boolean,
        isSkiped: boolean,
        isDisplayForm: boolean,
        isRegionClassHidden: boolean,
        isNoClassRegionSetup: boolean,
    ): void {
        this.isReadonly = isReadonly;
        this.isSkiped = isSkiped;
        this.isDisplayForm = isDisplayForm;
        this.isRegionClassHidden = isRegionClassHidden;
        this.isNoClassRegionSetup = isNoClassRegionSetup;
    }
    createEmployeeCategories(): void {
        this.validateAllFormFields();
        let isAllowSave = true;
        if ((this.isRegionChecked && this.selectedRegionList.length < 1) || (this.isClassChecked && this.selectedClassList.length < 1)) {
            isAllowSave = false;
        } else if (
            !this.isRegionChecked &&
            this.selectedRegionList.length < 1 &&
            !this.isClassChecked &&
            this.selectedClassList.length < 1
        ) {
            this.showSkipPopup();
        } else if (isAllowSave) {
            this.saveEligibleRegionAndClass();
            this.displayOption("Save");
            this.setExitStatus(false);
        }
    }
    validateAllFormFields(): void {
        Object.keys(this.setclassregionForm.controls).forEach((field) => {
            const control = this.setclassregionForm.get(field);
            if (control["controls"]) {
                for (const subField in control["controls"]) {
                    if (subField) {
                        control["controls"][subField].markAsTouched({ onlySelf: true });
                    }
                }
            } else {
                control.markAsTouched({ onlySelf: true });
            }
        });
    }
    onSkipConfirm(): void {
        this.saveEligibleRegionAndClass();
        this.displayOption("Skip");
    }

    cancel(): void {
        this.resetCheckboxSelection();
        this.setClassCheckboxSelection();
        this.setRegionCheckboxSelection();
        this.selectedClassList = this.selectedClassListOriginal.slice();
        this.selectedRegionList = this.selectedRegionListOriginal.slice();
        this.selectedClassIds = this.selectedClassListOriginal.map((x) => x.id);
        this.selectedRegionIds = this.selectedRegionListOriginal.map((x) => x.id);
        this.setExitStatus(false);
        if (!this.isRegionChecked && !this.isClassChecked) {
            this.displayOption("SelectType");
        } else {
            this.displayOption("Save");
        }
    }

    reset(): void {
        this.isClassChecked = false;
        this.isRegionChecked = false;
        this.allClasses = [];
        this.allRegions = [];
        this.selectedClassListOriginal = [];
        this.selectedRegionListOriginal = [];
        this.selectedClassList = [];
        this.selectedRegionList = [];
        this.selectedClassIds = [];
        this.selectedRegionIds = [];
        this.setExitStatus(false);
    }

    showSkipPopup(): void {
        const dialogData = {
            title: this.languageStrings["primary.portal.setClassRegions.popup.withoutSelectingHeading"],
            content: this.languageStrings["primary.portal.setClassRegions.popup.withoutSelectingContent"],
            primaryButton: {
                buttonTitle: this.languageStrings["primary.portal.common.continue"],
                buttonAction: this.onSkipConfirm.bind(this),
                buttonClass: "mon-btn-primary",
            },
            secondaryButton: {
                buttonTitle: this.languageStrings["primary.portal.common.cancel"],
            },
        };

        this.dialog.open(MonDialogComponent, {
            data: dialogData,
            width: "700px",
        });
    }
    setExitStatus(status: boolean): void {
        const storevalue = this.store.selectSnapshot(BenefitsOfferingState.GetExitPopupStatus);
        if (storevalue !== status) {
            this.store.dispatch(new SetPopupExitStatus(status));
        }
    }

    /* Unsubscribe the subscriptions to avoid memory leaks*/
    ngOnDestroy(): void {
        this.subscription.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
