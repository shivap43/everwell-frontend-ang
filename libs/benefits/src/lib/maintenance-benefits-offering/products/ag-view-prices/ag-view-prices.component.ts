import { Component, OnInit, Inject, ChangeDetectorRef, OnDestroy } from "@angular/core";
import {
    BenefitsOfferingService,
    AflacGroupPlanPriceDetail,
    PriceOrRates,
    AflacGroupPlanPriceDetailFilter,
    MemberTypes,
    AflacGroupPlanPriceMemberMapping,
} from "@empowered/api";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatSelectChange } from "@angular/material/select";
import { takeUntil, tap, switchMap } from "rxjs/operators";
import { Subject, Observable } from "rxjs";
import { FormGroup, FormBuilder } from "@angular/forms";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { ConfigName, DateInfo, PlanChoice, TobaccoStatus, PlanYear } from "@empowered/constants";
import { HttpErrorResponse } from "@angular/common/http";
import { Store } from "@ngxs/store";

import { StaticUtilService } from "@empowered/ngxs-store";

enum AGPriceTemplates {
    COVERAGE_LEVEL = "COVERAGE_LEVEL",
    TOBACCO_AGE_RANGE = "TOBACCO_AGE_RANGE",
    TOBACCO_INDIVIDUAL_AGE = "TOBACCO_INDIVIDUAL_AGE",
    SALARY_RANGE = "SALARY_RANGE",
}
enum AgCoverageLevelNames {
    ENROLLED_COVERAGE = "Enrolled",
    SPOUSE_COVERAGE = "Spouse Coverage",
    EMPLOYEE_COVERAGE = "Employee Only",
    EMPLOYEE_AND_SPOUSE_COVERAGE = "Employee + Spouse",
    EMPLOYEE_AND_FAMILY_COVERAGE = "Employee + Family",
    EMPLOYEE_AND_CHILDREN_COVERAGE = "Employee + Children",
    CHILD_COVERAGE = "CHILD",
}
interface AGPriceTableData {
    coverageLevelId?: number;
    coverageLevelName?: string;
    annualPrice?: string;
    tobaccoStatus?: string;
    minAge?: number;
    maxAge?: number;
    spousePremium?: string;
    employeePremium?: string;
    benefitAmount?: number;
    minEligibleSalary?: string | number;
    memberType?: string;
    age?: number;
}
interface MemberFilter {
    name: string;
    value: AgCoverageLevelNames;
    viewValue: string;
}

const AG_PRICE_COLUMN_NAMES = {
    COVERAGE_LEVEL: ["coverageLevel", "annualPrice"],
    SALARY_RANGE: ["age", "minEligibleSalary", "benefitAmount", "annualPrice"],
    TOBACCO_INDIVIDUAL_AGE: ["memberType", "tobaccoStatus", "age", "benefitAmount", "annualPrice"],
    TOBACCO_AGE_RANGE: ["tobaccoStatus", "age", "benefitAmount", "employeePremium", "spousePremium"],
};

const SYMBOLS = {
    EQUAL: "=",
    COMMA: ",",
    OPEN_BRACE: "[",
    CLOSE_BRACE: "]",
    SEMICOLON: ";",
    SPACE_REPLACE_CONST: /\s/g,
};
const RESTRICT_DECIMAL_TO_TWO_PLACES = 2;
const MEMBER_TYPE_CHILD = "CHILD";

@Component({
    selector: "empowered-ag-view-prices",
    templateUrl: "./ag-view-prices.component.html",
    styleUrls: ["./ag-view-prices.component.scss"],
})
export class AgViewPricesComponent implements OnInit, OnDestroy {
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    agPricingDetails: AflacGroupPlanPriceDetail;
    templateAndProductDetails: { templateVar: AGPriceTemplates; products: string[] }[] = [];
    templateVar: AGPriceTemplates;
    agPricingTemplates = AGPriceTemplates;
    agPriceTemplateColumns = AG_PRICE_COLUMN_NAMES;
    showSpinner: boolean;
    pricingTableData: AGPriceTableData[] = [];
    aflacGroupFilterDataForm: FormGroup;
    noFilterDataError: string;
    aflacGroupFilterData: AflacGroupPlanPriceDetailFilter;
    tobaccoStatusFilterData: {
        value: TobaccoStatus;
        viewValue: string;
    }[] = [];
    ageFilterData: number[];
    memberTypesFilterData: MemberFilter[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portal.aflacGroup.ridersIncludedInCoverage",
        "primary.portal.common.search",
        "primary.portal.common.placeholderSelect",
        "primary.portal.aflacGroup.offering.lblMember",
        "primary.portal.editCoverage.tobaccoStatus",
        "primary.portal.shopQuote.label.age",
        "primary.portal.tpiEnrollment.coverageLevel",
        "primary.portal.aflacGroup.annualPriceAmount",
        "primary.portal.aflacGroup.clearSelections",
        "primary.portal.aflacGroup.offering.lblMember",
        "primary.portal.agProductPrice.benefitDollar",
        "primary.portal.agProductPrice.annualPremiumAmount",
        "primary.portal.agProductPrice.annualPriceEmp",
        "primary.portal.agProductPrice.spousePremium",
        "primary.portal.agProductPrice.minEligibleSalary",
        "primary.portal.aflacGroup.allEmployees",
        "primary.portal.aflacGroup.reviewPricesEligibility",
        "primary.portal.aflacGroup.dropdownSelectionRequired",
        "primary.portal.members.personalLabel.tobaccoText",
        "primary.portal.members.personalLabel.nonTobaccoText",
        "primary.portal.aflacGroup.uniTobacco",
        "primary.portal.aflacGroup.employee",
        "primary.portal.aflacGroup.spouse",
        "primary.portal.aflacGroup.child",
        "primary.portal.aflacGroup.employeeDependentSpouse",
        "primary.portal.aflacGroup.family",
        "primary.portal.aflacGroup.employeeDependentChildren",
    ]);
    errorMessage: string;
    tobaccoStatusDisable = false;

    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param benefitsOfferingService is reference of BenefitsOfferingService
     * @param injectedData is injected data while opening modal
     * @param staticUtilService is reference of StaticUtilService
     * @param changeDetectorRef is reference of ChangeDetectorRef
     * @param formBuilder is reference of FormBuilder
     * @param language is reference of LanguageService
     * @param sheetRef is mat-sheet reference of AgViewPricesComponent
     * @param store is reference of Store
     */
    constructor(
        private readonly benefitsOfferingService: BenefitsOfferingService,
        @Inject(MAT_BOTTOM_SHEET_DATA)
        readonly injectedData: { planChoiceDetail: PlanChoice; mpGroup: number; planYearDetail: PlanYear },
        private readonly staticUtilService: StaticUtilService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly formBuilder: FormBuilder,
        private readonly language: LanguageService,
        private readonly sheetRef: MatBottomSheetRef<AgViewPricesComponent>,
        private readonly store: Store,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * used to call @method getPlanPricingDetails which fetches plan price details
     * used to initializeForm which initializes form group
     */
    ngOnInit(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.getPlanPricingDetails();
        this.aflacGroupFilterDataForm = this.formBuilder.group({
            memberType: [],
            age: [],
            tobaccoStatus: [],
        });
    }
    /**
     * This method is used to fetch aflac group price layout config
     * This method is used to fetch plan price details
     * This method is used to fetch aflac group required filters
     */
    getPlanPricingDetails(): void {
        this.showSpinner = true;
        this.staticUtilService
            .cacheConfigValue(ConfigName.AFLAC_GROUP_PRICING_LAYOUT)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((res) => {
                    this.arrangePriceLayoutObject(res);
                    this.changeDetectorRef.detectChanges();
                }),
                switchMap((res) =>
                    this.benefitsOfferingService.getAflacGroupPlanDetail(
                        this.injectedData.planChoiceDetail.plan.id,
                        null,
                        this.injectedData.mpGroup,
                    ),
                ),
                tap((priceDetails: AflacGroupPlanPriceDetail) => {
                    this.agPricingDetails = priceDetails;
                    const productSpecificTemplate: {
                        templateVar: AGPriceTemplates;
                        products: string[];
                    } = this.templateAndProductDetails.find(
                        (eachTemplate) =>
                            eachTemplate.products.findIndex(
                                (productName) =>
                                    productName.replace(SYMBOLS.SPACE_REPLACE_CONST, "") ===
                                    this.agPricingDetails.productName.replace(SYMBOLS.SPACE_REPLACE_CONST, ""),
                            ) !== -1,
                    );
                    if (productSpecificTemplate) {
                        this.templateVar = productSpecificTemplate.templateVar;
                        this.arrangePricingTable();
                    }
                    this.changeDetectorRef.detectChanges();
                }),
                switchMap((res) => this.benefitsOfferingService.getRequiredAflacGroupPlanDetailFilters(this.injectedData.mpGroup)),
                tap((filterData) => {
                    this.aflacGroupFilterData = filterData
                        .filter((eachData) => eachData.planId === this.injectedData.planChoiceDetail.plan.id)
                        .pop();
                    this.initializeDropDownData();
                    this.changeDetectorRef.detectChanges();
                }),
            )
            .subscribe(
                () => {
                    this.showSpinner = false;
                    this.changeDetectorRef.detectChanges();
                },
                (error: HttpErrorResponse) => {
                    this.displayDefaultError(error);
                },
            );
    }
    /**
     * This method is used to form price layout object based on config value
     * @param priceLayoutConfigValue is the aflac group price layout value coming from config
     */
    arrangePriceLayoutObject(priceLayoutConfigValue: string): void {
        const pricingTemplateInfo: string[] = priceLayoutConfigValue.split(SYMBOLS.SEMICOLON);
        pricingTemplateInfo.forEach((template) => {
            const templateProductOptions: string[] = template.split(SYMBOLS.EQUAL);
            this.templateAndProductDetails.push({
                templateVar: templateProductOptions[0] as AGPriceTemplates,
                products: templateProductOptions[1].replace(SYMBOLS.OPEN_BRACE, "").replace(SYMBOLS.CLOSE_BRACE, "").split(SYMBOLS.COMMA),
            });
        });
    }
    /**
     * This method is used to initialize dropdown data
     */
    initializeDropDownData(): void {
        if (this.aflacGroupFilterData) {
            this.aflacGroupFilterData.memberMappings.forEach((memberDetails) => {
                if (memberDetails.memberType === MemberTypes.EMPLOYEE) {
                    this.memberTypesFilterData.push({
                        name: memberDetails.memberType,
                        value: AgCoverageLevelNames.ENROLLED_COVERAGE,
                        viewValue: this.languageStrings["primary.portal.aflacGroup.employee"],
                    });
                } else if (memberDetails.memberType === MemberTypes.SPOUSE) {
                    this.memberTypesFilterData.push({
                        name: memberDetails.memberType,
                        value: AgCoverageLevelNames.SPOUSE_COVERAGE,
                        viewValue: this.languageStrings["primary.portal.aflacGroup.spouse"],
                    });
                } else {
                    this.memberTypesFilterData.push({
                        name: memberDetails.memberType,
                        value: AgCoverageLevelNames.CHILD_COVERAGE,
                        viewValue: this.languageStrings["primary.portal.aflacGroup.child"],
                    });
                }
            });
            // Used JSON.stringify to get unique elements and used JSON.parse to get unique set of data
            this.memberTypesFilterData = [...new Set(this.memberTypesFilterData.map((res) => JSON.stringify(res)))].map((res) =>
                JSON.parse(res),
            );
            this.aflacGroupFilterData.memberMappings[0].tobaccoStatusOptions.forEach((tobaccoStatus) => {
                this.tobaccoStatusFilterData.push({
                    value: tobaccoStatus,
                    viewValue: this.getTobaccoStatusModifiedName(tobaccoStatus),
                });
            });
            this.ageFilterData = this.ageFilterDataOptions(
                this.aflacGroupFilterData.memberMappings[0].ageMinOption,
                this.aflacGroupFilterData.memberMappings[0].ageMaxOption,
            );
        }
    }
    /**
     * This method is used to form array of age based on minAge and maxAge to display in dropdown
     * @param minAge is the minimum age
     * @param maxAge is the maximum age
     * @returns an array of age
     */
    ageFilterDataOptions(minAge: number, maxAge: number): number[] {
        const ageOptions: number[] = [];
        for (let ageOption = minAge; ageOption <= maxAge; ageOption++) {
            ageOptions.push(ageOption);
        }
        return ageOptions;
    }
    /**
     * This method will execute on change of memberType dropdown value
     * @param event is the mat-select change event
     */
    onMemberFilterChanged(event: MatSelectChange): void {
        const MEMBER_MAPPING_MIN_LENGTH = 1;
        const MEMBER_TYPE_CHILD1 = 0;
        const MEMBER_TYPE_CHILD2 = 1;
        this.tobaccoStatusFilterData = [];
        this.ageFilterData = [];
        this.aflacGroupFilterDataForm.controls.tobaccoStatus.patchValue(null);
        const memberData: MemberFilter = this.memberTypesFilterData.find((memberType) => memberType.value === event.value);
        let memberTypeName: string;
        if (memberData) {
            memberTypeName = memberData.name;
        }
        const memberSpecificFilterData: AflacGroupPlanPriceMemberMapping[] = this.aflacGroupFilterData.memberMappings.filter(
            (memberDetails) => memberDetails.memberType === memberTypeName,
        );
        if (memberSpecificFilterData) {
            const memberSpecificData: AflacGroupPlanPriceMemberMapping = memberSpecificFilterData[0];
            if (memberSpecificData.memberType === MEMBER_TYPE_CHILD) {
                this.tobaccoStatusDisable = true;
            } else {
                this.tobaccoStatusDisable = false;
                memberSpecificData.tobaccoStatusOptions.forEach((tobaccoStatus) => {
                    this.tobaccoStatusFilterData.push({
                        value: tobaccoStatus,
                        viewValue: this.getTobaccoStatusModifiedName(tobaccoStatus),
                    });
                });
            }
            let ageMinOption = memberSpecificFilterData[MEMBER_TYPE_CHILD1].ageMinOption;
            let ageMaxOption = memberSpecificFilterData[MEMBER_TYPE_CHILD1].ageMaxOption;
            if (
                memberSpecificFilterData.length > MEMBER_MAPPING_MIN_LENGTH &&
                ageMinOption > memberSpecificFilterData[MEMBER_TYPE_CHILD2].ageMinOption
            ) {
                ageMinOption = memberSpecificFilterData[MEMBER_TYPE_CHILD2].ageMinOption;
            }
            if (
                memberSpecificFilterData.length > MEMBER_MAPPING_MIN_LENGTH &&
                ageMaxOption < memberSpecificFilterData[MEMBER_TYPE_CHILD2].ageMaxOption
            ) {
                ageMaxOption = memberSpecificFilterData[MEMBER_TYPE_CHILD2].ageMaxOption;
            }
            this.ageFilterData = this.ageFilterDataOptions(ageMinOption, ageMaxOption);
        }
    }
    /**
     * This method will execute on click of search button
     * This method is used to fetch aflac group price details based on dropdown selected values
     */
    onSearch(): void {
        this.noFilterDataError = "";
        this.pricingTableData = [];
        const selectedAgeValue: number = this.aflacGroupFilterDataForm.controls.age.value;
        if (
            !this.aflacGroupFilterDataForm.controls.memberType.value ||
            selectedAgeValue === undefined ||
            selectedAgeValue === null ||
            selectedAgeValue < 0 ||
            (!this.tobaccoStatusDisable && !this.aflacGroupFilterDataForm.controls.tobaccoStatus.value) ||
            this.aflacGroupFilterDataForm.invalid
        ) {
            this.noFilterDataError = this.languageStrings["primary.portal.aflacGroup.dropdownSelectionRequired"];
            return;
        }
        this.arrangeTobaccoIndividualAgeTableData()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.showSpinner = false;
                    this.changeDetectorRef.detectChanges();
                },
                (error: HttpErrorResponse) => {
                    this.displayDefaultError(error);
                },
            );
    }
    /**
     * This method will execute on click of clear selections
     * This method is used to set price table to empty and to reset formGroup
     */
    clearSelections(): void {
        this.pricingTableData = [];
        this.aflacGroupFilterDataForm.reset();
    }
    /**
     * This method is used to call respective method to arrange price table information
     */
    arrangePricingTable(): void {
        if (this.templateVar === AGPriceTemplates.COVERAGE_LEVEL) {
            this.arrangeCoverageLevelTableData();
        } else if (this.templateVar === AGPriceTemplates.TOBACCO_AGE_RANGE) {
            this.arrangeTobaccoAgeRangeTableData();
        } else if (this.templateVar === AGPriceTemplates.SALARY_RANGE) {
            this.arrangeSalaryRangeTableData();
        }
    }
    /**
     * This method is used to arrange price details based on coverage level
     */
    arrangeCoverageLevelTableData(): void {
        this.agPricingDetails.pricing.forEach((eachPricing) => {
            this.pricingTableData.push({
                coverageLevelId: eachPricing.coverageLevel.id,
                coverageLevelName: this.getModifiedCoverageLevelName(eachPricing.coverageLevel.name),
                annualPrice: this.convertMonthlyPriceToYearly(eachPricing),
            });
        });
        this.pricingTableData.sort((a, b) => a.coverageLevelId - b.coverageLevelId);
    }
    /**
     * This method takes coverage level name as input and returns modified coverage level name from language
     * @param coverageLevelName is the coverage level name to be modified
     * @returns modified coverage level name
     */
    getModifiedCoverageLevelName(coverageLevelName: string): string {
        let modifiedCoverageLevelName = "";
        switch (coverageLevelName) {
            case AgCoverageLevelNames.EMPLOYEE_COVERAGE:
                modifiedCoverageLevelName = this.languageStrings["primary.portal.aflacGroup.employee"];
                break;
            case AgCoverageLevelNames.EMPLOYEE_AND_SPOUSE_COVERAGE:
                modifiedCoverageLevelName = this.languageStrings["primary.portal.aflacGroup.employeeDependentSpouse"];
                break;
            case AgCoverageLevelNames.EMPLOYEE_AND_FAMILY_COVERAGE:
                modifiedCoverageLevelName = this.languageStrings["primary.portal.aflacGroup.family"];
                break;
            case AgCoverageLevelNames.EMPLOYEE_AND_CHILDREN_COVERAGE:
                modifiedCoverageLevelName = this.languageStrings["primary.portal.aflacGroup.employeeDependentChildren"];
                break;
            default:
                break;
        }
        return modifiedCoverageLevelName;
    }
    /**
     * This method is used to arrange price details based on salary range
     */
    arrangeSalaryRangeTableData(): void {
        // Used JSON.stringify to get unique elements and used JSON.parse to get unique set of data
        const uniqueAgeDetails: {
            minAge: number;
            maxAge: number;
        }[] = [
            ...new Set(
                this.agPricingDetails.pricing.map((res) =>
                    JSON.stringify({
                        minAge: res.minAge,
                        maxAge: res.maxAge,
                    }),
                ),
            ),
        ].map((eachAgeInfo) => JSON.parse(eachAgeInfo));
        uniqueAgeDetails.sort((ageDetail1, ageDetail2) => ageDetail1.minAge - ageDetail2.minAge || ageDetail1.maxAge - ageDetail2.maxAge);
        this.agPricingDetails.pricing.forEach((priceDetail) => {
            if (!priceDetail.benefitAmount) {
                priceDetail.benefitAmount = 0;
            }
            if (!priceDetail.minEligibleSalary) {
                priceDetail.minEligibleSalary = 0;
            }
        });
        uniqueAgeDetails.forEach((eachUniqueAge) => {
            const ageSpecificPriceDetails: PriceOrRates[] = this.agPricingDetails.pricing.filter(
                (eachPricing) => eachPricing.minAge === eachUniqueAge.minAge && eachPricing.maxAge === eachUniqueAge.maxAge,
            );
            if (ageSpecificPriceDetails && ageSpecificPriceDetails.length) {
                ageSpecificPriceDetails.sort(
                    (priceDetail1, priceDetail2) =>
                        priceDetail1.minEligibleSalary - priceDetail2.minEligibleSalary ||
                        priceDetail1.benefitAmount - priceDetail2.benefitAmount,
                );
                const priceTableData: AGPriceTableData[] = ageSpecificPriceDetails.map((eachPriceDetail) => ({
                    minAge: 0,
                    maxAge: 0,
                    annualPrice: this.convertMonthlyPriceToYearly(eachPriceDetail),
                    benefitAmount: eachPriceDetail.benefitAmount,
                    minEligibleSalary: eachPriceDetail.minEligibleSalary,
                }));
                priceTableData[0].minAge = ageSpecificPriceDetails[0].minAge;
                priceTableData[0].maxAge = ageSpecificPriceDetails[0].maxAge;
                this.pricingTableData.push(...priceTableData);
            }
        });
    }
    /**
     * This method is used to arrange price details based on tobacco and age range
     */
    arrangeTobaccoAgeRangeTableData(): void {
        this.pricingTableData.push(...this.getTobaccoAgeTableData(TobaccoStatus.TOBACCO));
        this.pricingTableData.push(...this.getTobaccoAgeTableData(TobaccoStatus.NONTOBACCO));
        this.pricingTableData.push(...this.getTobaccoAgeTableData(TobaccoStatus.UNDEFINED));
    }
    /**
     * This method is used to filter price details based on tobaccoStatus
     * @param tobaccoStatus is the tobaccoStatus to be filtered
     * @returns an array of AGPriceTableData
     */
    getTobaccoAgeTableData(tobaccoStatus: TobaccoStatus): AGPriceTableData[] {
        const pricing: AGPriceTableData[] = [];
        const tobaccoFilterPlanPricingDetails: PriceOrRates[] = this.agPricingDetails.pricing.filter(
            (eachPricing) => eachPricing.tobaccoStatus === tobaccoStatus,
        );
        if (tobaccoFilterPlanPricingDetails.length) {
            tobaccoFilterPlanPricingDetails.forEach((eachPricing) => {
                const sameAgeBenefitAmountPrice: PriceOrRates[] = tobaccoFilterPlanPricingDetails.filter(
                    (eachPricingDetail: PriceOrRates) =>
                        eachPricingDetail.benefitAmount === eachPricing.benefitAmount &&
                        eachPricingDetail.minAge === eachPricing.minAge &&
                        eachPricingDetail.maxAge === eachPricing.maxAge,
                );
                if (sameAgeBenefitAmountPrice.length && sameAgeBenefitAmountPrice[0]) {
                    const pricingDetailObject: AGPriceTableData = this.getTobaccoAgePriceObject(sameAgeBenefitAmountPrice);
                    // Used JSON.stringify to compare objects
                    if (!pricing.some((eachPricingDetail) => JSON.stringify(eachPricingDetail) === JSON.stringify(pricingDetailObject))) {
                        pricing.push(this.getTobaccoAgePriceObject(sameAgeBenefitAmountPrice));
                    }
                }
            });
            if (pricing.length) {
                pricing.sort(
                    (priceDetail1, priceDetail2) =>
                        priceDetail1.minAge - priceDetail2.minAge ||
                        priceDetail1.maxAge - priceDetail2.maxAge ||
                        priceDetail1.benefitAmount - priceDetail2.benefitAmount,
                );
                pricing[0].tobaccoStatus = this.getTobaccoStatusModifiedName(tobaccoStatus);
            }
        }
        return pricing;
    }
    /**
     * This method is used to form price object based on tobaccoStatus and age range
     * @param sameAgeBenefitAmountPrice is filtered price object based on age and benefit amount
     * @returns an price object of type AGPriceTableData
     */
    getTobaccoAgePriceObject(sameAgeBenefitAmountPrice: PriceOrRates[]): AGPriceTableData {
        return {
            tobaccoStatus: "",
            minAge: sameAgeBenefitAmountPrice[0].minAge,
            maxAge: sameAgeBenefitAmountPrice[0].maxAge,
            benefitAmount: sameAgeBenefitAmountPrice[0].benefitAmount,
            employeePremium: this.getCoverageLevelPricing(sameAgeBenefitAmountPrice, AgCoverageLevelNames.ENROLLED_COVERAGE),
            spousePremium: this.getCoverageLevelPricing(sameAgeBenefitAmountPrice, AgCoverageLevelNames.SPOUSE_COVERAGE),
        };
    }
    /**
     * This method is used to convert monthly pricing to annual price after filtering price based on coverage level name
     * @param priceDetail is array of PriceOrRates to filter
     * @param coverageLevelNameToFilter is the coverage level name to filter
     * @returns price detail
     */
    getCoverageLevelPricing(priceDetail: PriceOrRates[], coverageLevelNameToFilter: string): string {
        const filteredPrice: PriceOrRates = priceDetail.filter((price) => price.coverageLevel.name === coverageLevelNameToFilter).pop();
        if (filteredPrice) {
            return this.convertMonthlyPriceToYearly(filteredPrice);
        }
        return "-";
    }
    /**
     * This method takes tobaccoStatus as input and returns modified tobaccoStatus from language
     * @param tobaccoStatus is the tobaccoStatus to be modified
     * @returns tobaccoStatus
     */
    getTobaccoStatusModifiedName(tobaccoStatus: string): string {
        let modifiedTobaccoName = "";
        if (tobaccoStatus === TobaccoStatus.TOBACCO) {
            modifiedTobaccoName = this.languageStrings["primary.portal.members.personalLabel.tobaccoText"];
        } else if (tobaccoStatus === TobaccoStatus.NONTOBACCO) {
            modifiedTobaccoName = this.languageStrings["primary.portal.members.personalLabel.nonTobaccoText"];
        } else {
            modifiedTobaccoName = this.languageStrings["primary.portal.aflacGroup.uniTobacco"];
        }
        return modifiedTobaccoName;
    }
    /**
     * This method is used to fetch tobacco individual age table data and forms price data table
     * @returns an observable of AflacGroupPlanPriceDetail
     */
    arrangeTobaccoIndividualAgeTableData(): Observable<AflacGroupPlanPriceDetail> {
        this.showSpinner = true;
        this.changeDetectorRef.detectChanges();
        return this.benefitsOfferingService
            .getAflacGroupPlanDetail(
                this.injectedData.planChoiceDetail.plan.id,
                {
                    memberType: this.memberTypesFilterData.filter(
                        (memberType) => memberType.value === this.aflacGroupFilterDataForm.controls.memberType.value,
                    )[0].name,
                    age: this.aflacGroupFilterDataForm.controls.age.value,
                    tobaccoStatus: this.aflacGroupFilterDataForm.controls.tobaccoStatus.value,
                },
                this.injectedData.mpGroup,
            )
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((priceDetails: AflacGroupPlanPriceDetail) => {
                    this.agPricingDetails = priceDetails;
                    this.agPricingDetails.pricing.forEach((eachPriceDetail) => {
                        this.pricingTableData.push({
                            memberType: this.memberTypesFilterData.filter(
                                (memberType) => memberType.value === this.aflacGroupFilterDataForm.controls.memberType.value,
                            )[0].viewValue,
                            tobaccoStatus:
                                this.aflacGroupFilterDataForm.controls.memberType.value !== MEMBER_TYPE_CHILD
                                    ? this.getTobaccoStatusModifiedName(this.aflacGroupFilterDataForm.controls.tobaccoStatus.value)
                                    : undefined,
                            age: this.aflacGroupFilterDataForm.controls.age.value,
                            benefitAmount: eachPriceDetail.benefitAmount,
                            annualPrice: this.convertMonthlyPriceToYearly(eachPriceDetail),
                        });
                    });
                    this.pricingTableData.sort((priceDetail1, priceDetail2) => priceDetail1.benefitAmount - priceDetail2.benefitAmount);
                    this.showSpinner = false;
                    this.changeDetectorRef.detectChanges();
                }),
            );
    }
    /**
     * This method is used to convert monthly price to yearly and restrict decimal value to two
     * @param priceDetail is the price object containing monthly price
     * @returns modified price detail
     */
    convertMonthlyPriceToYearly(priceDetail: PriceOrRates): string {
        return (priceDetail.priceMonthly * DateInfo.NUMBER_OF_MONTHS).toFixed(RESTRICT_DECIMAL_TO_TWO_PLACES);
    }
    /**
     * This method is used to close empowered sheet modal
     */
    onClose(): void {
        this.sheetRef.dismiss();
    }
    /**
     * This method is used to display default error status and error code defined error messages
     * @param error is the HttpErrorResponse
     */
    displayDefaultError(error: HttpErrorResponse): void {
        this.showSpinner = false;
        if (error && error.error) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
        }
        this.changeDetectorRef.detectChanges();
    }
    /**
     * ng life cycle hook
     * This method will execute before component is destroyed
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
