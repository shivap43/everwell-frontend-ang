import { Component, OnInit, Input, OnChanges, ChangeDetectorRef, AfterViewChecked, Output, EventEmitter, OnDestroy } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { BenefitsOfferingService, PriceOrRates, PriceOrRatesDisplay, DefaultEmployerContribution, MigratePricing } from "@empowered/api";
import { BenefitsOfferingState, SetProductCombinations, SetPopupExitStatus, UtilService } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { PricingPopupComponent } from "../pricing-popup/pricing-popup.component";
import { Subscription } from "rxjs";

import { take } from "rxjs/operators";

const action = {
    UPDATE: "update",
    REMOVED: "removed",
    EMPTY: "empty",
};

@Component({
    selector: "empowered-set-pricing",
    templateUrl: "./set-pricing.component.html",
    styleUrls: ["./set-pricing.component.scss"],
})
export class SetPricingComponent implements OnInit, OnChanges, AfterViewChecked, OnDestroy {
    priceRateForm: FormGroup;
    priceRateMetaForm: FormGroup;
    hoverIndex = "";
    formType: string;
    currentCombination: any;
    appliedAnotherCombinationPrice = false;
    appliedEmployerContribution = false;
    editView = false;
    priceDisplayedColumns = [
        "age",
        "tobaccoStatus",
        "coverageLevel",
        "price",
        "employerContributionPercent",
        "employerContributionPrice",
        "packageCode",
    ];
    rateDisplayedColumns = ["age", "tobaccoStatus", "coverageLevel", "ratePer", "rate", "packageCode"];
    customDisplayedColumns = [];
    dataSource: PriceOrRatesDisplay[] = [];
    dataSourceValidity: PriceOrRatesDisplay[] = [];
    completedPricesCombinations = [];
    isPriceTemplate: boolean;
    isRateTemplate: boolean;
    displayAgeColumn: boolean;
    displayTobaccoColumn: boolean;
    MpGroup: number;
    planchoiceId: string;
    defaultEmployerContributions = [DefaultEmployerContribution.PERCENT, DefaultEmployerContribution.VALUE];
    planTemplatePriceData: PriceOrRates[];
    pricingData: PriceOrRates[];
    employerContrType = "%";
    isAllEmployeeCombination = false;
    panelExpanded = "";
    isLoading: boolean;
    isSaved: boolean;
    isApplyingPrices = true;
    AGE = "age";
    PRICE = "price";
    TOBACCOSTATUS = "tobaccoStatus";
    UUID = "uuid";
    RATEPER = "ratePer";
    RATE = "rate";
    PACKAGECODE = "packageCode";
    EMPLOYERCONTRIBUTIONPERCENT = "employerContributionPercent";
    EMPLOYERCONTRIBUTIONPRICE = "employerContributionPrice";
    DEFAULTEMPLOYERCONTRTYPE = "defaultEmployerContrType";
    DEFAULTEMPLOYERCONTR = "defaultEmployerContr";
    TYPE = "type";
    COPYPRICINGFROM = "copyPricingFrom";
    editingIndex: number = null;
    subscription: Subscription[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.setPrices.title",
        "primary.portal.setPrices.instructions",
        "primary.portal.setPrices.makeIneligible",
        "primary.portal.setPrices.Ineligible",
        "primary.portal.setPrices.makeEligible",
        "primary.portal.setPrices.setPrices",
        "primary.portal.setPrices.copyPricing",
        "primary.portal.setPrices.noPricing",
        "primary.portal.setPrices.defaultEmployer",
        "primary.portal.common.edit",
        "primary.portal.common.apply",
        "primary.portal.setPrices.selectClasses",
        "primary.portal.setPrices.regions",
        "primary.portal.setPrices.of",
        "primary.portal.setPrices.chooseEmployment",
        "primary.portal.setPrices.applied",
        "primary.portal.setPrices.errorAtleastZeroPercent",
        "primary.portal.setPrices.errorAtleastZeroDollar",
        "primary.portal.setPrices.percentage",
        "primary.portal.setPrices.declineCode",
        "primary.portal.setPrices.age",
        "primary.portal.setPrices.tobacoStatus",
        "primary.portal.setPrices.coverageLevel",
        "primary.portal.setPrices.price",
        "primary.portal.setPrices.dollar",
        "primary.portal.setPrices.ratePer",
        "primary.portal.setPrices.rate",
        "primary.portal.setPrices.employerContributePerecntage",
        "primary.portal.setPrices.employerContributeDollar",
        "primary.portal.setPrices.packageCode",
        "primary.portal.common.cancel",
        "primary.portal.common.savePrices",
        "primary.portal.setPrices.forAllEmp",
        "primary.portal.setPrices.forAllEmpInstruction",
        "primary.portal.common.saved",
    ]);
    @Input() employeeCategoryCombinations: any;
    @Input() newEmployeeCategoryCombinations: any;
    @Input() isPopupRequired: boolean;
    @Output() emitCancelAction = new EventEmitter<string>();
    @Output() emitEditActionFlag = new EventEmitter<any>();

    constructor(
        private readonly fb: FormBuilder,
        private readonly benefiOfferingService: BenefitsOfferingService,
        private readonly store: Store,
        private readonly route: ActivatedRoute,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly cdRef: ChangeDetectorRef,
        private readonly utilService: UtilService,
    ) {
        this.MpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.planchoiceId = this.route.snapshot.params.planId;
        this.isSaved = false;
    }

    ngOnInit(): void {
        this.isLoading = true;
        this.priceRateForm = this.fb.group({});
        this.priceRateMetaForm = this.fb.group({
            copyPricingFrom: [""],
            defaultEmployerContrType: [DefaultEmployerContribution.PERCENT],
            defaultEmployerContr: ["", Validators.min(0)],
        });
        this.subscription.push(
            this.priceRateMetaForm.valueChanges.subscribe(() => {
                this.setExitStatus(false);
            }),
        );
        this.getPlanTemplate();
        this.emitEditActionFlag.emit(false);
    }

    ngOnChanges(): void {
        if (!this.isPopupRequired) {
            if (this.employeeCategoryCombinations.length === 0 && this.newEmployeeCategoryCombinations.length > 0) {
                this.employeeCategoryCombinations = this.newEmployeeCategoryCombinations;
            } else if (this.employeeCategoryCombinations.length > 0 && this.newEmployeeCategoryCombinations.length > 0) {
                this.employeeCategoryCombinations = this.newEmployeeCategoryCombinations;
            }
        } else if (
            this.isPopupRequired &&
            this.employeeCategoryCombinations.length > 0 &&
            this.newEmployeeCategoryCombinations.length > 0
        ) {
            if (this.employeeCategoryCombinations.length <= this.newEmployeeCategoryCombinations.length) {
                this.openDialog(action.UPDATE);
            } else if (this.employeeCategoryCombinations.length > this.newEmployeeCategoryCombinations.length) {
                this.openDialog(action.REMOVED);
            } else if (
                this.newEmployeeCategoryCombinations.length === 1 &&
                this.newEmployeeCategoryCombinations[0].regions.length === 0 &&
                this.newEmployeeCategoryCombinations[0].classes.length === 1 &&
                this.newEmployeeCategoryCombinations[0].classes[0].name === "All Employees"
            ) {
                this.openDialog(action.EMPTY);
            }
        }

        if (
            this.employeeCategoryCombinations.length === 1 &&
            this.employeeCategoryCombinations[0].regions.length === 0 &&
            this.employeeCategoryCombinations[0].classes.length === 1 &&
            this.employeeCategoryCombinations[0].classes[0].name === "All Employees"
        ) {
            this.isAllEmployeeCombination = true;
        } else {
            this.isAllEmployeeCombination = false;
        }
    }

    ngAfterViewChecked(): void {
        this.cdRef.detectChanges();
    }

    getPlanTemplate(): void {
        this.benefiOfferingService
            .getChoicePricingTemplate(this.planchoiceId, this.MpGroup.toString(), true)
            .pipe(take(1))
            .subscribe(
                (res) => {
                    this.planTemplatePriceData = res;
                    this.isLoading = false;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    getCompletedPricesCombination(combinationId: number): void {
        this.completedPricesCombinations = this.employeeCategoryCombinations.filter(
            (x) => x.priceOrRates.length > 0 && x.id !== this.currentCombination.id,
        );
    }

    cancel(): void {
        this.panelExpanded = "";
        this.editView = false;
        this.setExitStatus(false);
        this.editingIndex = null;
        this.emitEditActionFlag.emit(false);
    }

    setPanelExpanded(id: string): void {
        this.panelExpanded = id;
    }

    savePrices(combinationId: string): void {
        this.isLoading = true;
        const saveObject = {};
        const formObject = this.utilService.copy(this.priceRateForm.value);
        if (this.formType === this.PRICE.toUpperCase()) {
            Object.keys(formObject).forEach((key) => {
                saveObject[key] = {
                    memberPortionMonthly: formObject[key].price - formObject[key].employerContributionPrice,
                    priceMonthly: formObject[key].price - 0,
                    packageCode: formObject[key].packageCode,
                    validity: formObject[key].validity,
                };
            });
        } else if (this.formType === this.RATE.toUpperCase()) {
            Object.keys(formObject).forEach((key) => {
                saveObject[key] = {
                    memberPortionMonthly: formObject[key].ratePer,
                    priceMonthly: formObject[key].ratePer,
                    packageCode: formObject[key].packageCode,
                    validity: formObject[key].validity,
                };
            });
        }

        this.benefiOfferingService
            .savePricesToPlanPricingEligibilityCombination(
                Number.parseInt(this.planchoiceId, 10),
                Number.parseInt(combinationId, 10),
                saveObject,
                this.MpGroup,
            )
            .pipe(take(1))
            .subscribe(
                (res) => {
                    this.getPlanPricingEligibilityCombination(Number.parseInt(combinationId, 10));
                    this.setExitStatus(false);
                    this.isSaved = true;
                    this.cancel();
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    getPlanPricingEligibilityCombination(combinationId: number): void {
        this.benefiOfferingService
            .getPlanPricingEligibilityCombination(Number.parseInt(this.planchoiceId, 10), combinationId, this.MpGroup, true)
            .pipe(take(1))
            .subscribe(
                (res) => {
                    const localStoreData = JSON.parse(
                        JSON.stringify([...this.store.selectSnapshot(BenefitsOfferingState.getProductCombinations)]),
                    );
                    const planIndex = localStoreData.findIndex((x) => x.choiceId.toString() === this.planchoiceId.toString());
                    const combinationIndex = localStoreData[planIndex].combinations.findIndex(
                        (x) => x.id.toString() === combinationId.toString(),
                    );
                    localStoreData[planIndex].combinations[combinationIndex] = res;
                    this.store.dispatch(new SetProductCombinations(localStoreData));
                    this.employeeCategoryCombinations = localStoreData[planIndex].combinations;
                    this.isLoading = false;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    makeEligibleIneligible(combinationId: number, eligible: boolean): void {
        this.isLoading = true;
        this.benefiOfferingService
            .setEligibilityForPlanPricingEligibilityCombination(
                Number.parseInt(this.planchoiceId, 10),
                combinationId,
                eligible,
                this.MpGroup,
            )
            .pipe(take(1))
            .subscribe(
                (res) => {
                    const localStoreData = JSON.parse(
                        JSON.stringify([...this.store.selectSnapshot(BenefitsOfferingState.getProductCombinations)]),
                    );
                    const planIndex = localStoreData.findIndex((x) => x.choiceId.toString() === this.planchoiceId.toString());
                    const combinationIndex = localStoreData[planIndex].combinations.findIndex(
                        (x) => x.id.toString() === combinationId.toString(),
                    );
                    localStoreData[planIndex].combinations[combinationIndex].eligible = eligible;
                    this.store.dispatch(new SetProductCombinations(localStoreData));
                    this.employeeCategoryCombinations = localStoreData[planIndex].combinations;
                    this.setExitStatus(false);
                    this.isLoading = false;
                    this.cancel();
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    setOrEditPrices(combinationId: number, editIndex: number): void {
        this.editingIndex = editIndex;
        this.emitEditActionFlag.emit(true);
        this.isSaved = false;
        this.formType = null;
        this.editView = true;
        this.panelExpanded = combinationId.toString();
        this.appliedAnotherCombinationPrice = false;
        const currentCombinationArrayItem = this.employeeCategoryCombinations.filter((x) => x.id === combinationId)[0];
        this.pricingData =
            currentCombinationArrayItem.priceOrRates.length > 0 ? currentCombinationArrayItem.priceOrRates : this.planTemplatePriceData;

        this.constructFormControls(this.pricingData, combinationId);
        this.dataSource = [];
        this.dataSourceValidity = [];
        for (const [i, element] of this.pricingData.entries()) {
            this.dataSource.push({ uuid: this.pricingData[i][this.UUID] });
            if (element.minAge === null && element.maxAge !== null) {
                this.dataSource[i][this.AGE] = "Up to " + element.maxAge;
            } else if (element.minAge !== null && element.maxAge === null) {
                this.dataSource[i][this.AGE] = "Up to " + element.minAge + "+";
            } else if (element.minAge === element.maxAge) {
                this.dataSource[i][this.AGE] = element.minAge.toString();
            } else if (element.minAge !== null && element.maxAge !== null) {
                this.dataSource[i][this.AGE] = element.minAge + "-" + element.maxAge;
            }
            if (element.tobaccoStatus !== "UNDEFINED") {
                this.dataSource[i][this.TOBACCOSTATUS] = element.tobaccoStatus;
            }
            this.dataSource[i]["coverageLevel"] = element.coverageLevel.name;
            this.dataSource[i][this.TYPE] = element.type;
            if (element.type.toLowerCase() === this.PRICE) {
                this.formType = this.PRICE.toUpperCase();
                this.dataSource[i][this.PRICE] = element.priceMonthly.toString();
                this.dataSource[i][this.EMPLOYERCONTRIBUTIONPERCENT] = (
                    ((element.priceMonthly - element.memberPortionMonthly) / element.priceMonthly) *
                    100
                ).toString();
                this.dataSource[i][this.EMPLOYERCONTRIBUTIONPRICE] = (element.priceMonthly - element.memberPortionMonthly).toString();
            } else if (element.type.toLowerCase() === this.RATE) {
                this.formType = this.RATE.toUpperCase();
                this.dataSource[i][this.RATEPER] = element.pricePerIncrement.toString();
                this.dataSource[i][this.RATE] = (element.pricePerIncrement * element.incrementSize).toString();
            }
            this.dataSource[i][this.PACKAGECODE] = element.packageCode;
        }
        this.populatePriceRateForm(this.dataSource);
        this.getCompletedPricesCombination(combinationId);
        this.resetPriceRateMetaForm();
        this.createListner();
    }

    updatePricePercentValue(uuid: string, control: string): void {
        let value: number;
        let patchControl = "";
        const price = this.priceRateForm.get(uuid).get(this.PRICE).value;
        if (control === this.EMPLOYERCONTRIBUTIONPRICE) {
            const priceValue = this.priceRateForm.get(uuid).get(this.EMPLOYERCONTRIBUTIONPRICE).value;
            value = +((priceValue / price) * 100).toFixed(3);
            patchControl = this.EMPLOYERCONTRIBUTIONPERCENT;
        } else {
            const percentValue = this.priceRateForm.get(uuid).get(this.EMPLOYERCONTRIBUTIONPERCENT).value;
            value = (percentValue * price) / 100;
            patchControl = this.EMPLOYERCONTRIBUTIONPRICE;
        }
        this.priceRateForm.get(uuid).get(patchControl).patchValue(value);
    }

    resetPriceRateMetaForm(): void {
        this.priceRateMetaForm.reset();
        this.priceRateMetaForm.get(this.DEFAULTEMPLOYERCONTRTYPE).patchValue(DefaultEmployerContribution.PERCENT);
    }

    populatePriceRateForm(dataSource: PriceOrRatesDisplay[]): void {
        dataSource.forEach((element) => {
            if (element.type.toLowerCase() === this.PRICE) {
                this.priceRateForm.get(element.uuid).get(this.PRICE).patchValue(element.price);
                this.priceRateForm
                    .get(element.uuid)
                    .get(this.EMPLOYERCONTRIBUTIONPERCENT)
                    .patchValue(Number.parseFloat((+element.employerContributionPercent).toFixed(3)).toString());
                this.priceRateForm.get(element.uuid).get(this.EMPLOYERCONTRIBUTIONPRICE).patchValue(element.employerContributionPrice);
            } else if (element.type.toLowerCase() === this.RATE) {
                this.priceRateForm.get(element.uuid).get(this.RATEPER).patchValue(element.ratePer);
                this.priceRateForm.get(element.uuid).get(this.RATE).patchValue(element.rate);
            }
            this.priceRateForm.get(element.uuid).get(this.PACKAGECODE).patchValue(element.packageCode);
        });
    }

    onHover(i: string): void {
        this.hoverIndex = i;
    }

    applyAnotherCombinationPrice(combinationId: number): void {
        this.isApplyingPrices = true;
        const anotherCombination = this.employeeCategoryCombinations.filter(
            (x) => x.id === this.priceRateMetaForm.value.copyPricingFrom,
        )[0];
        const currentCombination = this.employeeCategoryCombinations.filter((x) => x.id === combinationId)[0];
        const previousDataSource = [];

        for (const [i, element] of anotherCombination.priceOrRates.entries()) {
            previousDataSource.push({ uuid: this.pricingData[i][this.UUID] });

            previousDataSource[i][this.TYPE] = element.type;
            if (element.type.toLowerCase() === this.PRICE) {
                previousDataSource[i][this.PRICE] = element.priceMonthly.toString();
                previousDataSource[i][this.EMPLOYERCONTRIBUTIONPERCENT] = (
                    ((element.priceMonthly - element.memberPortionMonthly) / element.priceMonthly) *
                    100
                ).toString();
                previousDataSource[i][this.EMPLOYERCONTRIBUTIONPRICE] = (element.priceMonthly - element.memberPortionMonthly).toString();
            } else if (element.type.toLowerCase() === this.RATE) {
                previousDataSource[i][this.RATEPER] = element.pricePerIncrement;
                previousDataSource[i][this.RATE] = (element.pricePerIncrement * element.incrementSize).toString();
            }
            previousDataSource[i][this.PACKAGECODE] = element.packageCode;
        }
        this.isSaved = false;
        this.populatePriceRateForm(previousDataSource);
        this.appliedAnotherCombinationPrice = true;
        this.setExitStatus(true);
        this.priceRateMetaForm.get(this.DEFAULTEMPLOYERCONTRTYPE).reset();
        this.priceRateMetaForm.get(this.DEFAULTEMPLOYERCONTRTYPE).patchValue(DefaultEmployerContribution.PERCENT);
        this.priceRateMetaForm.get(this.DEFAULTEMPLOYERCONTR).reset();
        this.appliedEmployerContribution = false;
        this.isApplyingPrices = false;
    }

    applyDefaultEmployerContribution(): void {
        this.isApplyingPrices = true;
        if (this.priceRateMetaForm.valid) {
            const meta = this.priceRateMetaForm.value;
            if (meta.defaultEmployerContrType === "%") {
                this.dataSource.forEach((element) => {
                    if (element.type.toLowerCase() === this.PRICE) {
                        this.priceRateForm.get(element.uuid).get(this.EMPLOYERCONTRIBUTIONPERCENT).patchValue(meta.defaultEmployerContr);
                        this.updatePricePercentValue(element.uuid, this.EMPLOYERCONTRIBUTIONPERCENT);
                    }
                });
            } else if (meta.defaultEmployerContrType === "$") {
                this.dataSource.forEach((element) => {
                    if (element.type.toLowerCase() === this.PRICE) {
                        this.priceRateForm.get(element.uuid).get(this.EMPLOYERCONTRIBUTIONPRICE).patchValue(meta.defaultEmployerContr);
                        this.updatePricePercentValue(element.uuid, this.EMPLOYERCONTRIBUTIONPRICE);
                    }
                });
            }
            this.appliedEmployerContribution = true;
        }
        this.isSaved = false;
        this.setExitStatus(true);
        this.priceRateMetaForm.get(this.COPYPRICINGFROM).reset();
        this.appliedAnotherCombinationPrice = false;
        this.isApplyingPrices = false;
    }

    isLengthGreaterThanZero(array: PriceOrRates[]): boolean {
        return array.length > 0;
    }

    constructFormControls(pricingData: PriceOrRates[], combinationId: number): void {
        this.priceRateForm = this.fb.group({});
        const currentCombinationArrayItem = this.employeeCategoryCombinations.filter((x) => x.id === combinationId)[0];
        this.currentCombination = currentCombinationArrayItem;
        const priceGroup = {
            price: [""],
            employerContributionPercent: [""],
            employerContributionPrice: [""],
            packageCode: [""],
        };
        const rateGroup = {
            ratePer: [""],
            rate: [""],
            packageCode: [""],
        };

        this.isPriceTemplate = false;
        this.isRateTemplate = false;
        this.displayAgeColumn = false;
        this.displayTobaccoColumn = false;

        this.pricingData.forEach((element) => {
            if (element.type.toLowerCase() === this.PRICE) {
                this.priceRateForm.addControl(element.uuid, this.fb.group(priceGroup));
                this.isPriceTemplate = true;
                if (!this.displayAgeColumn && (element.minAge !== null || element.maxAge !== null)) {
                    this.displayAgeColumn = true;
                }
                if (!this.displayTobaccoColumn && element.tobaccoStatus && element.tobaccoStatus.toLowerCase() !== "undefined") {
                    this.displayTobaccoColumn = true;
                }
            } else if (element.type.toLowerCase() === this.RATE) {
                this.priceRateForm.addControl(element.uuid, this.fb.group(rateGroup));
                this.isRateTemplate = true;
                if (!this.displayAgeColumn && (element.minAge !== null || element.maxAge !== null)) {
                    this.displayAgeColumn = true;
                }
                if (!this.displayAgeColumn && (element.minAge !== null || element.maxAge !== null)) {
                    this.displayAgeColumn = true;
                }
            }
        });

        if (this.isPriceTemplate) {
            this.customDisplayedColumns = this.priceDisplayedColumns;
            if (!this.displayAgeColumn) {
                this.customDisplayedColumns = this.customDisplayedColumns.filter((x) => x !== this.AGE);
            }
            if (!this.displayTobaccoColumn) {
                this.customDisplayedColumns = this.customDisplayedColumns.filter((x) => x !== this.TOBACCOSTATUS);
            }
        }
        if (this.isRateTemplate) {
            this.customDisplayedColumns = this.rateDisplayedColumns;
            if (!this.displayAgeColumn) {
                this.customDisplayedColumns = this.customDisplayedColumns.filter((x) => x !== this.AGE);
            }
            if (!this.displayTobaccoColumn) {
                this.customDisplayedColumns = this.customDisplayedColumns.filter((x) => x !== this.TOBACCOSTATUS);
            }
        }
        this.subscription.push(
            this.priceRateForm.valueChanges.subscribe(() => {
                this.setExitStatus(false);
            }),
        );
    }

    createListner(): void {
        this.subscription.push(
            this.priceRateMetaForm.get(this.COPYPRICINGFROM).valueChanges.subscribe((res) => {
                this.appliedAnotherCombinationPrice = false;
            }),
        );
        this.subscription.push(
            this.priceRateMetaForm.get(this.DEFAULTEMPLOYERCONTRTYPE).valueChanges.subscribe((res) => {
                this.appliedEmployerContribution = false;
                this.employerContrType = this.priceRateMetaForm.get(this.DEFAULTEMPLOYERCONTRTYPE).value;
            }),
        );
        this.subscription.push(
            this.priceRateMetaForm.get(this.DEFAULTEMPLOYERCONTR).valueChanges.subscribe((res) => {
                this.appliedEmployerContribution = false;
            }),
        );
        this.subscription.push(
            this.priceRateForm.valueChanges.subscribe((res) => {
                if (!this.isApplyingPrices) {
                    this.resetPriceRateMetaForm();
                    this.appliedAnotherCombinationPrice = false;
                    this.appliedEmployerContribution = false;
                }
            }),
        );
    }

    openDialog(actionType: string): void {
        Promise.resolve().then(() => {
            const dialogRef = this.dialog.open(PricingPopupComponent, {
                width: "600px",
                data: {
                    employeeCategoryCombinations: this.employeeCategoryCombinations,
                    newEmployeeCategoryCombinations: this.newEmployeeCategoryCombinations,
                    choiceId: this.planchoiceId,
                    action: actionType,
                },
            });

            this.subscription.push(
                dialogRef.afterClosed().subscribe((combinationData) => {
                    if (combinationData && combinationData.action === "update") {
                        this.migratePreviousToNewPlanPricingEligibilityCombinations(combinationData.updatedCombinations);
                    } else if (combinationData && combinationData.cancelAction === "undo") {
                        this.revertToPreviousPlanPricingEligibilityCombinations(combinationData.cancelAction);
                    } else if (combinationData && combinationData.cancelAction === "cancel") {
                        this.revertToPreviousPlanPricingEligibilityCombinations(combinationData.cancelAction);
                    }
                }),
            );
        });
        this.setExitStatus(false);
    }

    migratePreviousToNewPlanPricingEligibilityCombinations(migrationArray: MigratePricing[]): void {
        this.isLoading = true;
        this.benefiOfferingService
            .migratePreviousToNewPlanPricingEligibilityCombinations(Number.parseInt(this.planchoiceId, 10), migrationArray, this.MpGroup)
            .pipe(take(1))
            .subscribe(
                (res) => {
                    this.isLoading = false;
                    this.getPlanPricingEligibilityCombinations();
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    revertToPreviousPlanPricingEligibilityCombinations(revertaction: string): void {
        this.benefiOfferingService
            .revertToPreviousPlanPricingEligibilityCombinations(Number.parseInt(this.planchoiceId, 10), this.MpGroup)
            .pipe(take(1))
            .subscribe(
                (res) => {
                    this.getPlanPricingEligibilityCombinations();
                    this.emitCancelAction.emit(revertaction);
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    getPlanPricingEligibilityCombinations(): void {
        this.benefiOfferingService
            .getPlanPricingEligibilityCombinations(Number.parseInt(this.planchoiceId, 10), this.MpGroup, true)
            .pipe(take(1))
            .subscribe(
                (res) => {
                    this.employeeCategoryCombinations = res;
                    this.updateCombinationStore(res);
                    this.isLoading = false;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    setExitStatus(status: boolean): void {
        const storevalue = this.store.selectSnapshot(BenefitsOfferingState.GetExitPopupStatus);
        if (storevalue !== status) {
            this.store.dispatch(new SetPopupExitStatus(status));
        }
    }

    updateCombinationStore(newCombinations: any): void {
        const localStoreData = JSON.parse(JSON.stringify([...this.store.selectSnapshot(BenefitsOfferingState.getProductCombinations)]));
        const planIndex = localStoreData.findIndex((x) => x.choiceId.toString() === this.planchoiceId.toString());
        localStoreData[planIndex].combinations = newCombinations;
        this.store.dispatch(new SetProductCombinations(localStoreData));
    }
    ngOnDestroy(): void {
        this.subscription.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
