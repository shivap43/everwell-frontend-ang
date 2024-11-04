import { Injectable } from "@angular/core";
import {
    ThirdPartyPlatformRequirement,
    Carrier,
    ApprovalRequest,
    ApprovalRequestStatus,
    AccountProfileService,
    ClassType,
    ApplicationStatusTypes,
    AccountService,
    BenefitsOfferingService,
    CarrierFormSetupStatus,
    CarrierSetupStatus,
} from "@empowered/api";
import { catchError, concatMap, map, mergeMap, switchMap, tap } from "rxjs/operators";
import { Observable, of, BehaviorSubject, combineLatest, forkJoin } from "rxjs";
import { Store } from "@ngxs/store";

import {
    SetEligibleEmployees,
    BenefitsOfferingState,
    SetAccountThirdPartyPlatforms,
    SetThirdPartyPlatformRequirement,
    InitialBenefitsOfferingSteps,
    GetCarrierSetupStatuses,
    SaveCarrierSetupStatus,
    SetCarrierForms,
    ExceptionBusinessService,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { CensusBusinessService } from "@empowered/api-service";
import { AbstractControl, ValidationErrors } from "@angular/forms";
import {
    CarrierId,
    ConfigName,
    DateInfo,
    GroupAttributeEnum,
    IndustryCodes,
    Exceptions,
    PlanChoice,
    VasFunding,
    PolicyOwnershipType,
    Plan,
    Product,
    PlanPanel,
    PlansProductData,
} from "@empowered/constants";
import { SideNavProductData } from "./constants/side-nav-product-data.model";
import { HttpResponse } from "@angular/common/http";
import { DateService } from "@empowered/date";

const APPROVAL_ITEM_TYPE_PLAN = "PLAN";
const MAXIMUM_PLAN_YEAR_NAME_LENGTH = 85;
const INDIVIDUAL_LINK = "i";
const GROUP_LINK = "g";
const MIN_ELIGIBLE_EMPLOYEE_COUNT = 3;
const MAX_ELIGIBLE_EMPLOYEE_COUNT = 4;

@Injectable({
    providedIn: "root",
})
export class BenefitOfferingHelperService {
    private readonly selectedProducts$ = new BehaviorSubject<Product[]>(null);
    private readonly resetProducts$ = new BehaviorSubject<boolean>(false);
    currentSelectedProduct$ = this.selectedProducts$.asObservable();
    resetProductsApproval$ = this.resetProducts$.asObservable();
    industryCode: boolean;
    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param store is instance of Store
     * @param exceptionBusinessService is instance of ExceptionBusinessService
     * @param censusBusinessService is instance of CensusBusinessService
     * @param utilService is instance of UtilService
     */
    constructor(
        private readonly store: Store,
        private readonly exceptionBusinessService: ExceptionBusinessService,
        private readonly censusBusinessService: CensusBusinessService,
        private readonly utilService: UtilService,
        private readonly staticUtilService: StaticUtilService,
        private readonly accountProfileService: AccountProfileService,
        private readonly accountService: AccountService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly dateService: DateService,
    ) {}

    /**
     * This method is used to fetch estimated number of employee value from API
     * This method will create an Observable to fetch, map eligible employee value and returns it
     * @returns an observable of number which contains estimated employee value
     */
    getCensusEstimate(): Observable<number> {
        return this.censusBusinessService.getCensusEstimate().pipe(
            tap((res) => {
                this.store.dispatch(new SetEligibleEmployees(res));
            }),
        );
    }
    /**
     * This method is used to fetch exceptions from API
     * This method is used to fetch all exceptions, filter them, checks if @var vasExceptionToCheck
     * is present in filtered exceptions or not and returns the same
     *
     * @param vasExceptionToCheck is an exception which is used to check whether it is present or not
     * @param mpGroup is the group id of the account
     * @returns an observable of boolean which represents whether @var vasExceptionToCheck is present or not
     */
    getVasExceptions(mpGroup: string): Observable<Exceptions[]> {
        return this.exceptionBusinessService.getVasExceptions(mpGroup);
    }
    /**
     * This selector is used to return boolean value which represents whether account has TPP or not
     * @returns an observable of boolean which represents whether account has TPP or not
     */
    fetchAccountTPPStatus(): Observable<boolean> {
        const isTPPAccount: boolean = this.store.selectSnapshot(BenefitsOfferingState.getAccountTPPStatus);
        if (isTPPAccount === null) {
            return this.store
                .dispatch(new SetAccountThirdPartyPlatforms())
                .pipe(map((res) => this.store.selectSnapshot(BenefitsOfferingState.getAccountTPPStatus)));
        }
        return of(isTPPAccount);
    }
    /**
     * This method is used to fetch third party platform requirements
     * @param isTppUpdated {boolean} if true call service and dispatch to store with new value
     * @returns an observable of boolean which represents whether account has TPP or not
     */
    getThirdPartyPlatformRequirements(isTppUpdated?: boolean): Observable<ThirdPartyPlatformRequirement> {
        const thirdPartyRequirement: ThirdPartyPlatformRequirement = this.store.selectSnapshot(
            BenefitsOfferingState.getThirdPartyPlatformRequirements,
        );
        if (thirdPartyRequirement === null || isTppUpdated) {
            return this.store
                .dispatch(new SetThirdPartyPlatformRequirement())
                .pipe(map((res) => this.store.selectSnapshot(BenefitsOfferingState.getThirdPartyPlatformRequirements)));
        }
        return of(thirdPartyRequirement);
    }
    /* Selected product
     * @param product selectedProduct array
     */
    changeProductSelected(product: Product[]): void {
        this.selectedProducts$.next(product);
    }
    /**
     * Set the status to reset products tab
     * @param isRefreshed boolean value to check if ag offering is refreshed
     */
    updateResetProducts$(isRefreshed: boolean): void {
        this.resetProducts$.next(isRefreshed);
    }
    /**
     * The below method is used to reset particular error in the formControl
     * @param control is the abstract control
     * @param error is error variable
     */
    resetSpecificFormControlErrors(control: AbstractControl, error: string): void {
        const err: ValidationErrors = control.errors; // get control errors
        if (err) {
            delete err[error]; // delete error
            if (!Object.keys(err).length) {
                // if no errors left
                control.setErrors(null); // set control errors to null making it VALID
            } else {
                control.setErrors(err); // controls got other errors so set them back
            }
        }
    }
    /**
     * This method is used set product, carrier and rider tooltip information to plans
     * @param allProducts contains all products information
     * @param allCarriers contains all carriers information
     * @param eligiblePlans contains all eligible plans information
     * @returns all plans related to aflac group after arranging product, carrier data
     */
    getAflacGroupPlans(allProducts: Product[], allCarriers: Carrier[], eligiblePlans: Plan[]): Plan[] {
        eligiblePlans.forEach((eachEligiblePlan) => {
            eachEligiblePlan.ridersTooltipInfo = eachEligiblePlan.riders
                .map((eachRider) => eachRider.name)
                .sort((a, b) => a.localeCompare(b))
                .join(",\n");
            eachEligiblePlan.product = this.utilService
                .copy(allProducts)
                .filter((eachProduct: Product) => eachProduct.id === eachEligiblePlan.productId)
                .pop();
            eachEligiblePlan.carrier = this.utilService
                .copy(allCarriers)
                .filter((eachCarrier: Carrier) => eachCarrier.id === eachEligiblePlan.carrierId)
                .pop();
        });
        return eligiblePlans.filter((eachPlan) => eachPlan.carrierId === CarrierId.AFLAC_GROUP);
    }
    /**
     * This method is used to return plans count to be displayed in pending alert
     * @param approvalItem is latest approval request from which we are setting plans count and alert
     * @param planChoices contains array of plan choices
     * @returns plans count to be displayed in pending alert
     */
    getPlansCountToDisplayInPendingAlert(approvalItem: ApprovalRequest, planChoices?: PlanChoice[]): number {
        let plansCount = 0;
        const planChoicesToFilter: PlanChoice[] =
            planChoices && planChoices.length ? planChoices : this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices);
        if (approvalItem.status === ApprovalRequestStatus.SUBMITTED_TO_HQ) {
            plansCount = planChoicesToFilter.filter((eachPlanChoice) => eachPlanChoice.requiredSetup).length;
        } else {
            plansCount = approvalItem.approvalItems
                .map((element) => element.object)
                .filter((res) => res === APPROVAL_ITEM_TYPE_PLAN).length;
        }
        return plansCount;
    }

    /**
     * Validate plan year name to restrict maximum characters
     * @param planYearName Plan year name
     * @return boolean true when exceeds maximum length
     */
    checkForPlanYearNameValidation(planYearName: string): boolean {
        return planYearName.length > MAXIMUM_PLAN_YEAR_NAME_LENGTH;
    }

    /**
     * Get the product ids for which both tax status is hidden
     * @returns observable of product ids for which both tax status needs to be hidden
     */
    getTaxStatusConfig(): Observable<number[]> {
        return this.staticUtilService
            .cacheConfigValue(ConfigName.HIDE_BOTH_TAX_STATUS_IDS)
            .pipe(map((productIds) => productIds.split(",").map((productId) => +productId)));
    }

    /**
     * giPastDateCheck is to check the past date and required date validations entered with mat input box
     * @param inputDate entered or selected control gi end date
     * @param oiEndDate entered or selected control OE end date
     * @param date current date to validate manually.
     * @param dayDiff days difference between gi start date and gi end date to validation min 5days and max 45days
     * @returns Validation errors.
     */
    giPastDateCheck(inputDate: Date, date: Date, dayDiff: number, oiEndDate: Date): ValidationErrors {
        if (!inputDate || isNaN(inputDate.getTime())) {
            return { requirement: true };
        }
        inputDate.setUTCHours(0, 0, 0, 0);
        date.setUTCHours(0, 0, 0, 0);
        if (!this.dateService.isValid(inputDate)) {
            return { invalid: true };
        }
        if (dayDiff < DateInfo.GI_MIN_ENROLL_PERIOD_IN_DAYS) {
            return { lessFiveDays: true };
        }
        if (inputDate <= oiEndDate && dayDiff > DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS) {
            return { greaterThanStartDateAfter45: true };
        }
        if (inputDate > oiEndDate && dayDiff > DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS) {
            return { greaterThanOEendDateAnd45DaysStartDate: true };
        }
        return null;
    }
    /**
     * disableGIEnrollmentEndDate function to disable GI enrollment end dates, if it is greater that 45
     * and greater open enrollment end date
     * @param date gi enrollment start date
     * @param days number days calculated from start date and gi enrollment date
     * @returns Date with adding 45 days
     */
    disableGIEnrollmentEndDate(date: Date, days: number): Date {
        // date cannot be returned directly as value assigned at func is getting updated
        return date ? this.dateService.addDays(date, days) : null;
    }

    /**
     * fetchJobClasses is to get the industry codes for the group.
     * @param mpGroup
     * @returns boolean value to the component if industry code D or not.
     */
    fetchIndustryCode(mpGroup: string): Observable<boolean> {
        return this.accountProfileService.getClassTypes(mpGroup).pipe(
            switchMap((res: ClassType[]) => {
                const classTypeId = res.find((classType: ClassType) => classType?.carrierId === CarrierId.AFLAC);
                return this.accountProfileService.getClasses(classTypeId.id, mpGroup);
            }),
            switchMap((response) => of(response[0].riskClass === IndustryCodes.INDUSTRY_CODE_D)),
        );
    }

    /**
     * Checks if current product plans are selected or not
     * @param plans current product screen plans
     * @param isNoneSelected indicates if none is selected
     * @param productId product Id created based on individual or group selection
     * @param plansList list of all plans
     * @param productIdNumber actual product id, will always be a number
     * @param isHQFunded indicates if HQ plans screen
     * @param isEmpFunded indicates if Emp funded plans screen
     * @returns boolean indicating if current product plans are selected or not
     */
    isProductPlansSelected(
        plans: PlanPanel[],
        isNoneSelected: boolean,
        productId: string,
        plansList: PlanPanel[],
        productIdNumber: string,
        isHQFunded: boolean,
        isEmpFunded: boolean,
    ): boolean {
        // if plans are selected and none id not selected
        // or if its individual products screen, selection is not mandatory
        if ((plans.some((plan) => plan.selected) && !isNoneSelected) || productId.indexOf(INDIVIDUAL_LINK) >= 0) {
            return true;
        }
        if (productId.indexOf(GROUP_LINK) >= 0) {
            return plansList.some(
                (plan) =>
                    plan.selected &&
                    plan.productIdNumber === productIdNumber &&
                    plan.policyOwnershipType === PolicyOwnershipType.INDIVIDUAL,
            );
        }
        if (isHQFunded) {
            return plansList.some((plan) => plan.vasFunding && plan.vasFunding.toString() !== VasFunding.HQ);
        }
        if (isEmpFunded) {
            return plansList.some((plan) => plan.vasFunding && plan.selected);
        }
        return false;
    }

    /**
     * Checks if previous completed product is clicked
     * @param isHQFunded indicates if HQ plans screen
     * @param isEmpFunded indicates if Emp funded plans screen
     * @param productList product list based on plans data
     * @param plansList list of all plans
     * @param productIdToBeNavigated product Id to be navigated created based on individual or group selection
     * @returns boolean indicating if we are clicking on previous completed product
     */
    isPreviousProduct(
        isHQFunded: boolean,
        isEmpFunded: boolean,
        productList: PlansProductData[],
        plansList: PlanPanel[],
        productIdToBeNavigated?: string,
    ): boolean {
        // All products are previous to HQ or Emp Funded hence return true
        if (isHQFunded || isEmpFunded) {
            return true;
        }
        let plansSelected = true;
        const completedProducts = productList.filter((product) => {
            if (plansList.some((plan) => plansSelected && plan.selected && +plan.productIdNumber === product.productId)) {
                return true;
            } else {
                plansSelected = false;
                return false;
            }
        });
        // Else if found in completed products then also its previous product
        return completedProducts.some((completedProduct) => completedProduct.id === productIdToBeNavigated);
    }

    /**
     * checks if next is restricted based on plan selections
     * @param isHQFunded indicates if HQ plans screen
     * @param isEmpFunded indicates if Emp funded plans screen
     * @param productList product list based on plans data
     * @param plansList list of all plans
     * @param productId product Id created based on individual or group selection
     * @param plans current product screen plans
     * @param isNoneSelected indicates if none is selected
     * @param productIdNumber actual product id, will always be a number
     * @param productIdToBeNavigated product Id to be navigated created based on individual or group selection
     * @returns boolean indicating if next is restricted based on plan selections
     */
    isNextRestricted(
        isHQFunded: boolean,
        isEmpFunded: boolean,
        productList: PlansProductData[],
        plansList: PlanPanel[],
        productId: string,
        plans: PlanPanel[],
        isNoneSelected: boolean,
        productIdNumber: string,
        productIdToBeNavigated?: string,
    ): boolean {
        return (
            (!productIdToBeNavigated || !this.isPreviousProduct(isHQFunded, isEmpFunded, productList, plansList, productIdToBeNavigated)) &&
            !this.isProductPlansSelected(plans, isNoneSelected, productId?.toString(), plansList, productIdNumber, isHQFunded, isEmpFunded)
        );
    }

    /**
     * Checks if plans are selected or not for current product screen
     * @param productList product list
     * @param presentProductIndex present product index
     * @returns boolean indicating if plan selection is made or not
     */
    isCurrentProductPlansSelected(productList: SideNavProductData[], presentProductIndex: number): boolean {
        const productId = productList[presentProductIndex].id;
        // if product screen is already completed or is Individual product screen
        // Individual product screen selection is not mandatory as group plans also can be selected
        if (productList[presentProductIndex].completed || (isNaN(+productId) && productId.indexOf(INDIVIDUAL_LINK) >= 0)) {
            return true;
        }
        // If current screen is not completed and is a group plan screen
        // then check if its individual screen is completed
        if (isNaN(+productId) && productId.indexOf(GROUP_LINK) >= 0) {
            return productList[presentProductIndex - 1].completed;
        }
        return false;
    }

    /**
     * Checks if we changing product is valid or not
     * @param productList list of products
     * @param presentProductIndex present product index
     * @param completedProducts list of completed products
     * @param productIdToBeNavigated product id to be navigated/ changed
     * @param defaultStepPosition default step poistion
     * @returns boolean indicating if change product is valid
     */
    isChangeProductValid(
        productList: SideNavProductData[],
        presentProductIndex: number,
        completedProducts: string[],
        productIdToBeNavigated: string,
        defaultStepPosition: number,
    ): boolean {
        // If we are going to previous product screen, no need to check for any conditions
        // If we are going to next product screens, we have to make sure current product plans are selected and
        // we are changing to valid product screen without missing any screen
        return (
            defaultStepPosition > InitialBenefitsOfferingSteps.withPricing.PLANS + 1 ||
            this.isPreviousProductClicked(completedProducts, productIdToBeNavigated) ||
            (this.isCurrentProductPlansSelected(productList, presentProductIndex) &&
                this.isChangingToValidProduct(productList, productIdToBeNavigated, presentProductIndex))
        );
    }

    /**
     * Checks if we are going to previous product screen or not
     * @param completedProducts list of completed products
     * @param productIdToBeNavigated product id to be navigated/ changed
     * @returns boolean indicating if we are going to previous product screen
     */
    isPreviousProductClicked(completedProducts: string[], productIdToBeNavigated: string): boolean {
        return completedProducts.includes(productIdToBeNavigated);
    }

    /**
     * Checks if we are going to next product screen only
     * @param productList list of products
     * @param productIdToBeNavigated product id to be navigated/ changed
     * @param presentProductIndex present product index
     * @returns boolean indicating if we are going to next step only
     */
    isChangingToValidProduct(productList: SideNavProductData[], productIdToBeNavigated: string, presentProductIndex: number): boolean {
        return productIdToBeNavigated === productList[presentProductIndex + 1]?.id;
    }

    /*
     * isMasterAppStatusApproved is to returns true if the master app status for the group is approved
     * @returns observable of boolean
     */
    isMasterAppStatusApproved(): Observable<boolean> {
        return this.accountService
            .getGroupAttributesByName([GroupAttributeEnum.MASTER_APP_STATUS])
            .pipe(map((res) => res?.length && res[0].value === ApplicationStatusTypes.Approved));
    }

    /*
     * getBenefitEligibleEmployeeCount returns Observable of number of eligible employee
     * @returns observable of boolean
     */
    getBenefitEligibleEmployeeCount(): Observable<number> {
        return this.accountService
            .getGroupAttributesByName([GroupAttributeEnum.ELIGIBLE_EMPLOYEE_COUNT])
            .pipe(map((res) => res?.length && +res[0].value));
    }

    /**
     * enableGIEligibleDateMessage will enable message if Industry code is 'D' or eligible employee count is either 3 or 4
     * @param mpGroup mpGroupId for the particular group
     * @returns observable of boolean
     */
    enableGIEligibleDateMessage(mpGroup: string): Observable<boolean> {
        return combineLatest([this.getBenefitEligibleEmployeeCount(), this.fetchIndustryCode(mpGroup)]).pipe(
            map(
                ([employeeCount, industryCodeIsD]) =>
                    (employeeCount >= MIN_ELIGIBLE_EMPLOYEE_COUNT && employeeCount <= MAX_ELIGIBLE_EMPLOYEE_COUNT) || industryCodeIsD,
            ),
        );
    }

    /**
     *  Get all forms, update status of forms which have status undefined. Reload all forms.
     *  transFormObservable takes care of unsubscribing
     *  @param fromCarrierPage boolean request from carrier form page
     *  @param productCarrierId number
     *  @returns Observable<HttpResponse<void>[]>
     */
    setupCarrierFormDataToStore(fromCarrierPage?: boolean, productCarrierId?: number): Observable<HttpResponse<void>[]> {
        return this.benefitOfferingService.getBenefitOfferingCarriers(true).pipe(
            map((carriers) => {
                let carrierIds: number[] = [];
                if (carriers.length) {
                    carrierIds = carriers.map((carrier) => carrier.id);
                } else if (productCarrierId && fromCarrierPage) {
                    carrierIds = [productCarrierId];
                }
                return carrierIds;
            }),
            mergeMap((resp) => this.store.dispatch(new GetCarrierSetupStatuses(resp, true)).pipe()),
            mergeMap(() => this.updateAndFetchStatus()),
        );
    }

    /**
     *  Save the carrier setup status as INCOMPLETE and fetch the updated statuses and forms.
     *  @param fromCarrierPage boolean request from carrier form page
     *  @param productCarrierId number
     *  @returns Observable<HttpResponse<void>[]>
     */
    updateAndFetchStatus(fromCarrierPage?: boolean, productCarrierId?: number): Observable<HttpResponse<void>[]> {
        return this.saveCarrierSetupStatus().pipe(
            mergeMap(() => this.benefitOfferingService.getBenefitOfferingCarriers(true).pipe()),
            map((carriers) => {
                let carrierIds: number[] = [];
                if (carriers.length) {
                    carrierIds = carriers.map((carrier) => carrier.id);
                } else if (productCarrierId && fromCarrierPage) {
                    carrierIds = [productCarrierId];
                }
                return carrierIds;
            }),
            concatMap((resp) => this.store.dispatch(new GetCarrierSetupStatuses(resp, true))),
            mergeMap(() => this.store.dispatch(new SetCarrierForms(true, true))),
        );
    }

    /**
     * Save carrier Setup status as Incomplete for all, if carrier setup statuses are not present
     * @returns Observable<HttpResponse<void>[]>
     */
    saveCarrierSetupStatus(): Observable<HttpResponse<void>[]> {
        const carrierIds: number[] = this.store.selectSnapshot(BenefitsOfferingState.getPlanCarriers);
        return forkJoin(
            carrierIds.map((carrier) => {
                const statusPayload: CarrierSetupStatus = {
                    status: CarrierFormSetupStatus.INCOMPLETE,
                };
                return this.store.dispatch(new SaveCarrierSetupStatus(statusPayload, carrier, true)).pipe(catchError(() => of(null)));
            }),
        );
    }
}
