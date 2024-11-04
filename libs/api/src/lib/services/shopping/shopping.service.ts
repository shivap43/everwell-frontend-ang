import { EnrollmentMethodDetail } from "./../shared/models/enrollment-method.model";
import { map } from "rxjs/operators";
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { Configuration } from "../configuration";
import { BASE_PATH } from "../variables";
import { GetShoppingCart } from "./models/getShoppingCart.model";
import { KnockoutQuestion } from "../enrollments/models";
import { MP_APPLICATION_TYPE } from "./enums/mp-application-type.enum";
import { PayrollDeductions } from "./models/payroll-deductions.model";
import { CartDisplayOrder } from "./models/cartDisplayOrder.model";
import { EmailPlanDocuments } from "./models/email-plan-documents.model";
import {
    EnrollmentType,
    AddCartItem,
    CoverageLevelRule,
    PlanOffering,
    ProductOffering,
    GetCartItems,
    CoverageDatesRecord,
    PlanOfferingPricing,
    MoreSettings,
    PlanOfferingPanel,
} from "@empowered/constants";
import { EnrollmentMethod } from "@empowered/constants";

@Injectable({
    providedIn: "root",
})
export class ShoppingService {
    defaultHeaders = new HttpHeaders().set("MP-Group", "");
    configuration = new Configuration();
    protected basePath = "/api";
    isVASPlanEligible$ = new BehaviorSubject<boolean>(true);
    private readonly withdrawApplicationSubject$: BehaviorSubject<number> = new BehaviorSubject(0);
    withdrawApplicationValue$: Observable<number> = this.withdrawApplicationSubject$.asObservable();

    constructor(
        protected httpClient: HttpClient,
        @Optional() @Inject(BASE_PATH) basePath: string,
        @Optional() configuration: Configuration,
    ) {
        if (configuration) {
            this.configuration = configuration;
            this.configuration.basePath = configuration.basePath || basePath || this.basePath;
        } else {
            this.configuration.basePath = basePath || this.basePath;
        }
    }
    /**
     * Method to call getEnrollmentMethods API to determine the eligible enrollment methods for a group
     * @param productOfferingId product offering id
     * @param memberId member id
     * @param enrollmentMethod selected enrollment method
     * @param mpGroup mpGroup id
     * @param assistingAdminId assisting admin id
     * @returns {Observable<HttpResponse<unknown>>} - returns http responses i.e. 204, 403 or 409
     */
    declineProduct(
        productOfferingId: string,
        memberId: number,
        enrollmentMethod?: string,
        mpGroup?: number,
        assistingAdminId?: number,
    ): Observable<HttpResponse<unknown>> {
        const apiEndPoint = this.configuration.basePath + "/enrollment/shopping/products/" + productOfferingId + "/decline";
        let params = new HttpParams();
        params = params.append("memberId", memberId ? memberId.toString() : "");
        if (enrollmentMethod) {
            params = params.append("enrollmentMethod", enrollmentMethod);
        }
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup != null ? mpGroup.toString() : "");
        return this.httpClient.post<HttpResponse<unknown>>(apiEndPoint, {}, { headers: headers, params: params });
    }
    /**
     * Method to get shopping cart
     * @param memberId: Member id
     * @param mpGroup: Group number
     * @param planYearId: Plan year ids array to get PY based shopping cart
     * @returns {Observable<GetShoppingCart>} Observable of GetShoppingCart
     */
    getShoppingCart(memberId: number, mpGroup: number, planYearId?: number[]): Observable<GetShoppingCart> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        if (planYearId && planYearId.length) {
            planYearId.forEach((pyId) => {
                params = params.append("planYearIds", pyId.toString());
            });
        }
        return this.httpClient.get<GetShoppingCart>(apiEndPoint, { headers: headers, params: params });
    }

    /**
     * Method to call getEnrollmentMethods API to determine the eligible enrollment methods for a group
     * @param mpGroup Group number of the group in session
     */
    getEnrollmentMethods(mpGroup?: number): Observable<EnrollmentMethodDetail[]> {
        // const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : '');
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/enrollment/shopping/enrollmentMethods";
        return this.httpClient.get<EnrollmentMethodDetail[]>(apiEndPoint, {
            headers: headers,
        });
    }
    getProductOfferings(mpGroup?: number): Observable<ProductOffering[]> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup != null ? mpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/enrollment/shopping/products";
        return this.httpClient.get<ProductOffering[]>(apiEndPoint, {
            headers: headers,
        });
    }

    getProductOffering(productOfferingId: number, mpGroup?: number): Observable<ProductOffering> {
        const header = this.defaultHeaders.set("MP-Group", mpGroup != null ? mpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/enrollment/shopping/products/" + productOfferingId;
        return this.httpClient.get<ProductOffering>(apiEndPoint, {
            headers: header,
        });
    }

    /**
     * https://api-contracts-nonprod.empoweredbenefits.com/redoc.html?api=shopping#operation/getPlanCoverageDatesMap
     *
     * Get coverage dates for plan PlanOffering.id
     *
     * Includes:
     * 1. defaultCoverageStartDate - default coverage start date
     * 2. earliestCoverageStartDate - earliest coverage start date
     * 3. latestCoverageStartDate - latest coverage start date,
     * 4. isContinuous - if plan offering is continuous
     *
     * @param memberId {number} member id
     * @param mpGroup {number} group id
     * @param enrollmentType {EnrollmentType} (Optional) Should only be used for Dual Year Plans: QUALIFYING_LIFE_EVENT or OPEN_ENROLLMENT
     * @param referenceDate {string} Format is YYYY-MM-DD (TODAY default if no date is provided)
     * @returns {Observable<CoverageDatesRecord>} Record of CoverageDates where keys are PlanOffering.id
     */
    getPlanCoverageDatesMap(
        memberId: number,
        mpGroup: number,
        enrollmentType?: EnrollmentType | null,
        referenceDate?: string,
    ): Observable<CoverageDatesRecord> {
        let headers = this.defaultHeaders.set("MP-Group", mpGroup != null ? mpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/enrollment/shopping/plans/coverageDates";

        let params = new HttpParams();

        if (referenceDate) {
            headers = headers.append("referenceDate", referenceDate);
        }

        if (enrollmentType) {
            params = params.append("enrollmentType", enrollmentType);
        }

        params = params.append("memberId", memberId);

        return this.httpClient.get<CoverageDatesRecord>(apiEndPoint, {
            headers,
            params,
        });
    }

    /**
     * fetch sorted ProductOfferings from API
     * @param mpGroup groupId
     * @returns Observable of array of ProductOffering
     */
    getProductOfferingsSorted(mpGroup?: number): Observable<ProductOffering[]> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/enrollment/shopping/products";
        return this.httpClient
            .get<ProductOffering[]>(apiEndPoint, {
                headers: headers,
            })
            .pipe(
                map((element) =>
                    element.sort(
                        (a1: ProductOffering, a2: ProductOffering) =>
                            (a1.product.displayOrder as number) - (a2.product.displayOrder as number),
                    ),
                ),
            );
    }

    /**
     * Method to get Plan Offerings data
     * @param productOfferingId product offering id
     * @param enrollmentMethod selected enrollment method
     * @param state selected enrollment state
     * @param moreSetting more settings
     * @param memberId member id
     * @param mpGroup mpGroup id
     * @param expand boolean flag for expand
     * @param referenceDate referenceDate of plan year
     * @returns {Observable<PlanOffering[]>}
     */
    // eslint-disable-next-line complexity
    getPlanOfferings(
        productOfferingId?: string,
        enrollmentMethod?: string,
        state?: string,
        moreSetting?: MoreSettings,
        memberId?: number,
        mpGroup?: number,
        expand?: string,
        referenceDate?: string,
        // eslint-disable-next-line complexity
    ): Observable<PlanOffering[]> {
        let headers: HttpHeaders = new HttpHeaders();

        if (mpGroup) {
            headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        }

        const apiEndPoint = `${this.configuration.basePath}/enrollment/shopping/plans`;

        let params = new HttpParams();
        // Default to F2f when no benefit offering is setup and enrollment Method and enrollment state is null
        params = params.append("enrollmentMethod", enrollmentMethod ? enrollmentMethod.toString() : EnrollmentMethod.FACE_TO_FACE);
        if (referenceDate) {
            headers = headers.append("referenceDate", referenceDate);
        }
        if (productOfferingId) {
            params = params.append("productOfferingId", productOfferingId);
        }
        if (expand) {
            params = params.append("expand", expand);
        }
        if (state) {
            params = params.append("state", state);
        }
        if (!moreSetting?.payrollFrequencyId && !moreSetting?.age) {
            params = params.append("memberId", memberId ? memberId.toString() : "");
        } else {
            params = params.append("payrollFrequencyId", moreSetting?.payrollFrequencyId ? moreSetting?.payrollFrequencyId.toString() : "");
            params = params.append("age", moreSetting?.age ? moreSetting?.age.toString() : "");
            if (moreSetting.annualSalary) {
                params = params.append("annualSalary", moreSetting.annualSalary.toString());
            }
            if (moreSetting.gender) {
                params = params.append("gender", moreSetting.gender);
            }
            if (moreSetting.spouseGender) {
                params = params.append("spouseGender", moreSetting.spouseGender);
            }
            if (moreSetting.spouseAge) {
                params = params.append("spouseAge", moreSetting.spouseAge);
            }
            if (moreSetting.tobaccoUser) {
                params = params.append("tobaccoUser", moreSetting.tobaccoUser.toString());
            }
            if (moreSetting.spouseTobaccoUser) {
                params = params.append("spouseTobaccoUser", moreSetting.spouseTobaccoUser.toString());
            }
            if (moreSetting.state) {
                params = params.append("state", moreSetting.state);
            }
            if (moreSetting.numberDependentsExcludingSpouse) {
                params = params.append("numberDependentsExcludingSpouse", moreSetting.numberDependentsExcludingSpouse);
            }
            if (moreSetting.hoursPerYear && moreSetting.hourlyWage) {
                params = params.append("hoursPerYear", moreSetting.hoursPerYear);
                params = params.append("hourlyWage", moreSetting.hourlyWage);
            }
        }
        return this.httpClient.get<PlanOffering[]>(apiEndPoint, {
            headers: headers,
            params: params,
        });
    }

    getPlanOffering(planOfferingId: string, mpGroup?: number, expand?: string): Observable<PlanOffering> {
        if (!planOfferingId) {
            return throwError("planOfferingId does not exist");
        }
        const header = this.defaultHeaders.set("MP-Group", mpGroup != null ? mpGroup.toString() : "");
        let params = new HttpParams();
        if (expand) {
            params = params.append("expand", expand);
        }
        const apiEndPoint = this.configuration.basePath + "/enrollment/shopping/plans/" + planOfferingId;
        return this.httpClient.get<PlanOffering>(apiEndPoint, {
            headers: header,
            params: params,
        });
    }

    /**
     * Method to get plan offerings data
     * @param enrollmentMethod selected enrollment method
     * @param mpGroup mpGroup id
     * @param state selected enrollment state
     * @param memberId member id
     * @param moreSetting more settings
     * @param expand string flag for expand
     * @param referenceDate referenceDate of plan year
     * @returns observable with plan offering data
     */
    // eslint-disable-next-line complexity
    getAllPlanOfferings(
        enrollmentMethod: string,
        mpGroup: number,
        state?: string,
        memberId?: number,
        moreSetting?: MoreSettings,
        expand?: string,
        referenceDate?: string,
    ): Observable<PlanOffering[]> {
        // TODO: This code is hard to understand and should be refactored
        // Also I don't think `moreSetting === undefined || null` does what the developer thinks it does
        // The `|| null` doesn't do anything in this case since `moreSetting === undefined` is considered one thing on its own
        moreSetting = !(moreSetting === undefined || null)
            ? moreSetting
            : moreSetting
            ? (moreSetting.age = moreSetting.payrollFrequencyId = undefined)
            : undefined;

        let headers: HttpHeaders;
        headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/enrollment/shopping/plans";
        if (referenceDate) {
            headers = headers.append("referenceDate", referenceDate);
        }
        let params = new HttpParams().append("enrollmentMethod", enrollmentMethod).append("state", state ? state.toString() : "");
        if (expand) {
            params = params.append("expand", expand);
        }
        if (!moreSetting?.payrollFrequencyId && !moreSetting?.age) {
            params = params.append("memberId", memberId ? memberId.toString() : "");
        } else {
            params = params.append("payrollFrequencyId", moreSetting?.payrollFrequencyId ? moreSetting?.payrollFrequencyId : "");
            params = params.append("age", moreSetting?.age ? moreSetting?.age.toString() : "");
            if (moreSetting?.annualSalary) {
                params = params.append("annualSalary", moreSetting?.annualSalary.toString());
            }
            if (moreSetting?.gender) {
                params = params.append("gender", moreSetting?.gender);
            }
            if (moreSetting?.spouseGender) {
                params = params.append("spouseGender", moreSetting?.spouseGender);
            }
            if (moreSetting?.spouseAge) {
                params = params.append("spouseAge", moreSetting?.spouseAge);
            }
            if (moreSetting?.tobaccoUser) {
                params = params.append("tobaccoUser", moreSetting?.tobaccoUser.toString());
            }
            if (moreSetting?.spouseTobaccoUser) {
                params = params.append("spouseTobaccoUser", moreSetting?.spouseTobaccoUser.toString());
            }

            if (moreSetting?.numberDependentsExcludingSpouse) {
                params = params.append("numberDependentsExcludingSpouse", moreSetting?.numberDependentsExcludingSpouse);
            }
            if (moreSetting?.hoursPerYear && moreSetting?.hourlyWage) {
                params = params.append("hoursPerYear", moreSetting?.hoursPerYear);
                params = params.append("hourlyWage", moreSetting?.hourlyWage);
            }
        }
        return this.httpClient.get<PlanOffering[]>(apiEndPoint, {
            headers: headers,
            params: params,
        });
    }

    /**
     * Get riders offered by a plan.
     *
     * @param planOfferingId offerable plan's id
     * @param mpGroup (optional) group id
     * @param enrollmentMethod (optional) enrollment method (FACE_TO_FACE, CALL_CENTER, etc)
     * @param state (optional) enrollment or residence state
     * @param memberId (optional) member's Id
     * @param moreSetting (optional) more plan level settings
     * @param expand (optional) allowed values are 'productId', 'carrierId', 'dependentPlanIds'
     * @returns observable that is notified when the http request completes
     */
    getPlanOfferingRiders(
        planOfferingId: string,
        mpGroup?: number,
        enrollmentMethod?: string,
        state?: string,
        memberId?: number,
        coverageEffectiveDate?: string,
        moreSetting?: MoreSettings,
        expand?: string,
    ): Observable<PlanOffering[]> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let apiEndPoint = this.configuration.basePath + "/enrollment/shopping";
        apiEndPoint += "/plans/" + planOfferingId + "/riders";
        let params = new HttpParams()
            .append("enrollmentMethod", enrollmentMethod ? enrollmentMethod.toString() : "")
            .append("state", state ? state.toString() : "")
            .append("coverageEffectiveDate", coverageEffectiveDate ? coverageEffectiveDate?.toString() : "");

        if (!(moreSetting && moreSetting.payrollFrequencyId && moreSetting.age)) {
            params = params.append("memberId", memberId ? memberId.toString() : "");
        } else {
            params = params.append("payrollFrequencyId", moreSetting.payrollFrequencyId);
            params = params.append("age", moreSetting.age.toString());
            if (moreSetting.annualSalary) {
                params = params.append("annualSalary", moreSetting.annualSalary.toString());
            }
            if (moreSetting.gender) {
                params = params.append("gender", moreSetting.gender);
            }
            if (moreSetting.spouseGender) {
                params = params.append("spouseGender", moreSetting.spouseGender);
            }
            if (moreSetting.spouseAge) {
                params = params.append("spouseAge", moreSetting.spouseAge);
            }
            if (moreSetting.tobaccoUser) {
                params = params.append("tobaccoUser", moreSetting.tobaccoUser.toString());
            }
            if (moreSetting.spouseTobaccoUser) {
                params = params.append("spouseTobaccoUser", moreSetting.spouseTobaccoUser.toString());
            }

            if (moreSetting.numberDependentsExcludingSpouse) {
                params = params.append("numberDependentsExcludingSpouse", moreSetting.numberDependentsExcludingSpouse);
            }
            if (moreSetting.hoursPerYear && moreSetting.hourlyWage) {
                params = params.append("hoursPerYear", moreSetting.hoursPerYear);
                params = params.append("hourlyWage", moreSetting.hourlyWage);
            }
        }

        if (expand) {
            params.append("expand", expand);
        }
        return this.httpClient.get<PlanOffering[]>(apiEndPoint, {
            headers: headers,
            params: params,
        });
    }
    /**
     * Service method to call getPlanOfferingPricing
     * @param planOfferingId plan
     * @param state two letter state abbreviation
     * @param moreSetting collection of additional settings
     * @param memberId
     * @param mpGroup
     * @param parentPlanId
     * @param parentPlanCoverageLevelId
     * @param baseBenefitAmount
     * @param childAge
     * @param coverageEffectiveDate
     * @param riskClassId
     * @param fromApplicationFlow
     * @param shoppingCartItemId
     * @param includeFee
     * @param expand
     * @returns Observable of PlanOfferingPricing[]
     */
    // eslint-disable-next-line complexity
    getPlanOfferingPricing(
        planOfferingId: string,
        state?: string,
        moreSetting?: MoreSettings,
        memberId?: number,
        mpGroup?: number,
        parentPlanId?: number,
        parentPlanCoverageLevelId?: number,
        baseBenefitAmount?: number,
        childAge?: number,
        coverageEffectiveDate?: string,
        riskClassId?: number,
        fromApplicationFlow: boolean = false,
        shoppingCartItemId?: number,
        includeFee?: boolean,
    ): Observable<PlanOfferingPricing[]> {
        let headers;
        if (mpGroup) {
            headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        }
        let apiEndPoint = this.configuration.basePath + "/enrollment/shopping";

        apiEndPoint += "/plans/" + planOfferingId + "/pricing";

        let params = new HttpParams();
        params = params.append("state", state ? state.toString() : "");

        if (!(moreSetting && moreSetting.payrollFrequencyId && moreSetting.age)) {
            params = params.append("memberId", memberId ? memberId.toString() : "");
            if (moreSetting) {
                params = this.setTobaccoUserParams(moreSetting, params);
            }
        } else {
            if (fromApplicationFlow && memberId) {
                params = params.append("memberId", memberId ? memberId.toString() : "");
            }
            params = params.append("payrollFrequencyId", moreSetting.payrollFrequencyId);
            params = params.append("age", moreSetting.age.toString());
            params = this.setMoreSettingsParams(moreSetting, params);
        }
        if (parentPlanCoverageLevelId) {
            params = params.append("parentPlanCoverageLevelId", parentPlanCoverageLevelId.toString());
        }
        if (parentPlanId) {
            params = params.append("parentPlanId", parentPlanId.toString());
        }
        if (baseBenefitAmount) {
            params = params.append("baseBenefitAmount", baseBenefitAmount.toString());
        }
        if (childAge != null && childAge >= 0) {
            params = params.append("childAge", childAge.toString());
        }
        params = this.setParams(coverageEffectiveDate, params, riskClassId, shoppingCartItemId, includeFee);
        return this.httpClient.get<PlanOfferingPricing[]>(apiEndPoint, {
            headers: headers,
            params: params,
        });
    }

    /**
     * Function to set params
     * @param coverageEffectiveDate
     * @param params Query Params
     * @param riskClassId
     * @param shoppingCartItemId
     * @param includeFee
     * @param expand
     * @returns param of type HttpParams
     */
    setParams(
        coverageEffectiveDate?: string,
        params?: HttpParams,
        riskClassId?: number,
        shoppingCartItemId?: number,
        includeFee?: boolean,
    ): HttpParams {
        params = params ?? new HttpParams();

        if (coverageEffectiveDate) {
            params = params.append("coverageEffectiveDate", coverageEffectiveDate.toString());
        }
        if (riskClassId) {
            params = params.append("riskClassId", riskClassId.toString());
        }
        if (shoppingCartItemId) {
            params = params.append("shoppingCartItemId", shoppingCartItemId.toString());
        }
        if (includeFee) {
            params = params.append("includeFee", includeFee.toString());
        }
        return params;
    }

    /**
     * Function to set tobacco user status
     * @param moreSetting Collection of additional settings
     * @param params Query Params
     * @returns param of type HttpParams
     */
    setTobaccoUserParams(moreSetting: MoreSettings, params: HttpParams): HttpParams {
        if (moreSetting.tobaccoUser !== undefined) {
            params = params.append("tobaccoUser", moreSetting.tobaccoUser.toString());
        }
        if (moreSetting.spouseTobaccoUser !== undefined) {
            params = params.append("spouseTobaccoUser", moreSetting.spouseTobaccoUser.toString());
        }
        return params;
    }
    addCartItem(memberId: number, mpGroup: number, addCart: any): Observable<HttpResponse<unknown>> {
        const memberVal: any = memberId;
        const apiEndPoint = this.configuration.basePath + "/members/" + memberVal + "/shoppingCart/items";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup.toString()).set("mp-application", MP_APPLICATION_TYPE.MARKETPLACE_2);
        return this.httpClient.post<unknown>(apiEndPoint, addCart, { headers: headers, observe: "response" });
    }
    getKnockoutQuestions(planOfferingId: number, state: string, mpGroup: number, memberId?: number): Observable<KnockoutQuestion[]> {
        const apiEndPoint = `${this.configuration.basePath}/enrollment/shopping/plans/${planOfferingId}/knockoutQuestions`;
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        params = params.append("state", state);
        if (memberId) {
            params = params.append("memberId", memberId ? memberId.toString() : "");
        }
        return this.httpClient.get<KnockoutQuestion[]>(apiEndPoint, { headers: headers, params: params });
    }

    /**
     * Method to get cart items data.
     * @param memberId member id
     * @param mpGroup mpGroup id
     * @param expand  expand flag
     * @param planYearId plan year Plan year ids array to get PY based cart items
     * @returns Observable with cart item data
     */
    getCartItems(memberId: number, mpGroup: number, expand?: string, planYearId?: number[]): Observable<GetCartItems[]> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart/items";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        if (expand) {
            params = params.append("expand", expand);
        }
        if (planYearId && planYearId.length) {
            planYearId.forEach((pyId) => {
                params = params.append("planYearIds", pyId.toString());
            });
        }
        return this.httpClient.get<GetCartItems[]>(apiEndPoint, { headers: headers, params: params });
    }
    getCartItem(memberId: number, itemId: number, mpGroup: number): Observable<GetCartItems> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart/items/" + itemId;
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<GetCartItems>(apiEndPoint, { headers: headers });
    }
    removeCartItem(memberId: number, mpGroup: number, id: number): Observable<any> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart/items/" + id;
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete(apiEndPoint, { headers: headers });
    }

    /**
     *
     * @description HTTP observable to update plan in cart
     * @param memberId
     * @param mpGroup
     * @param id cart item id
     * @param cart object of required attributes
     * @returns {Observable<HttpResponse<unknown>>}
     * @memberof ShoppingService
     */
    updateCartItem(memberId: number, mpGroup: number, id: number, cart: AddCartItem): Observable<HttpResponse<unknown>> {
        if (!memberId) {
            return throwError("Member Id does not exist");
        }
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart/items/" + id;
        const headers = this.defaultHeaders.set("MP-Group", mpGroup.toString()).set("mp-application", MP_APPLICATION_TYPE.MARKETPLACE_2);
        return this.httpClient.put<HttpResponse<unknown>>(apiEndPoint, cart, { headers: headers });
    }
    deleteCartItem(memberId: number, itemId: number, mpGroup: number): Observable<any> {
        if (!memberId) {
            return throwError("Member Id does not exist");
        }
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart/items/" + itemId;
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete(apiEndPoint, { headers: headers });
    }

    getCoverageLevelRules(coverageLevelId: number, mpGroup: number): Observable<CoverageLevelRule[]> {
        const apiEndPoint = this.configuration.basePath + "/core/coverageLevels/" + coverageLevelId + "/rules";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<CoverageLevelRule[]>(apiEndPoint, { headers: headers });
    }
    convertPlanOfferingToPlanOfferingPanel(planOffering: PlanOffering[]): PlanOfferingPanel[] {
        const temp: PlanOfferingPanel[] = new Array<PlanOfferingPanel>();
        planOffering.forEach((planOff) => {
            temp.push({
                id: planOff.id,
                plan: planOff.plan,
                taxStatus: planOff.taxStatus,
                agentAssistanceRequired: planOff.agentAssistanceRequired,
                missingInformation: planOff.missingInformation,
            });
        });
        return temp;
    }

    acquireShoppingCartLock(memberId: number, mpGroup: number): Observable<any> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart/lock";
        return this.httpClient.post<any>(apiEndPoint, {}, { headers: headers });
    }

    releaseShoppingCartLock(memberId: number, mpGroup: number): Observable<any> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart/lock";
        return this.httpClient.delete<any>(apiEndPoint, { headers: headers });
    }

    /**
     * Method to delete cart data.
     * @param memberId member id
     * @param mpGroup mpGroup id
     * @param ignoreGroupPlans boolean flag to ignore Group plans
     * @returns Observable with cart item data
     */
    clearShoppingCart(memberId: number, mpGroup: number, ignoreGroupPlans: boolean = true): Observable<HttpResponse<void>> {
        if (!memberId) {
            return throwError("Member Id does not exist");
        }
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        params = params.append("ignoreGroupPlans", ignoreGroupPlans.toString());
        return this.httpClient.delete<HttpResponse<void>>(apiEndPoint, { headers: headers, params: params });
    }
    getPayrollDeductions(planOfferingId: number, mpGroup: number): Observable<PayrollDeductions[]> {
        const apiEndPoint = this.configuration.basePath + `/enrollment/shopping/plans/${planOfferingId}/payrollDeductions`;
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<PayrollDeductions[]>(apiEndPoint, { headers: headers });
    }

    setMoreSettingsParams(moreSetting: MoreSettings, params: HttpParams): HttpParams {
        if (moreSetting.annualSalary) {
            params = params.append("annualSalary", moreSetting.annualSalary.toString());
        }
        if (moreSetting.gender) {
            params = params.append("gender", moreSetting.gender);
        }
        if (moreSetting.spouseGender) {
            params = params.append("spouseGender", moreSetting.spouseGender);
        }
        if (moreSetting.spouseAge) {
            params = params.append("spouseAge", moreSetting.spouseAge);
        }
        if (moreSetting.tobaccoUser) {
            params = params.append("tobaccoUser", moreSetting.tobaccoUser.toString());
        } else {
            params = params.append("tobaccoUser", "false");
        }
        if (moreSetting.spouseTobaccoUser !== undefined) {
            params = params.append("spouseTobaccoUser", moreSetting.spouseTobaccoUser.toString());
        }

        if (moreSetting.numberDependentsExcludingSpouse) {
            params = params.append("numberDependentsExcludingSpouse", moreSetting.numberDependentsExcludingSpouse);
        }
        if (moreSetting.hoursPerYear && moreSetting.hourlyWage) {
            params = params.append("hoursPerYear", moreSetting.hoursPerYear);
            params = params.append("hourlyWage", moreSetting.hourlyWage);
        }

        return params;
    }
    /**
     *
     *@description service to download quote for member's cart
     * @param {number} memberId
     * @param {string} quoteTitle
     * @param {number} mpGroup
     * @returns {Observable<BlobPart>}
     * @memberof ShoppingService
     */
    downloadShoppingCartQuote(memberId: number, quoteTitle: string, mpGroup: number): Observable<BlobPart> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart/downloadQuote";
        const headers = new HttpHeaders({ "Content-Type": "arraybuffer" }).set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        params = params.append("quoteTitle", quoteTitle);
        return this.httpClient.get<BlobPart>(apiEndPoint, {
            headers: headers,
            responseType: "blob" as "json",
            params: params,
            observe: "body",
        });
    }
    /**
     *
     *@description service to send quote to member via email
     * @param {number} memberId
     * @param {number} mpGroup
     * @param {string} quoteTitle
     * @param {string} email
     * @param {string} [notes]
     * @returns {Observable<Object>}
     * @memberof ShoppingService
     */
    emailShoppingCartQuote(memberId: number, mpGroup: number, quoteTitle: string, email: string, notes?: string): Observable<unknown> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart/emailQuote";
        const emailObj = { quoteTitle: quoteTitle, email: email, notes: notes ? notes : null };

        return this.httpClient.post<unknown[]>(apiEndPoint, emailObj, {
            headers: headers,
        });
    }

    /**
     *
     *@description service to arrange the items in quote according to member preference
     * @param {number} memberId
     * @param {number} mpGroup
     * @param {CartDisplayOrder[]} itemOrder
     * @returns {Observable<Object>}
     * @memberof ShoppingService
     */
    assignDisplayOrderToCartItems(memberId: number, mpGroup: number, itemOrder: CartDisplayOrder[]): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart/items/displayOrder";
        return this.httpClient.put<HttpResponse<unknown>>(apiEndPoint, itemOrder, {
            headers: headers,
        });
    }
    /**
     *@description service to send plan details in email.
     * @param planOfferingId plan offering id
     * @param emailPlanResourceDetail email plan resource detail
     * @param mpGroup mp-group id
     * @returns {Observable<HttpResponse<unknown>>}
     * @memberof ShoppingService
     */
    emailPlanDocuments(
        planOfferingId: number,
        emailPlanResourceDetail: EmailPlanDocuments,
        mpGroup?: number,
    ): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<HttpResponse<unknown>>(
            `${this.configuration.basePath}/enrollment/shopping/plans/${planOfferingId}/emailPlanDocuments`,
            emailPlanResourceDetail,
            {
                headers: headers,
                observe: "response",
            },
        );
    }
    /**
     * @description service to trigger productId to shop-overview component to call getProductId()
     * and navigate to particular shop page from where the withdraw application is initiated
     * @param productId from which the withdraw application is initiated
     * @returns void
     */
    setProductId(productId: number): void {
        this.withdrawApplicationSubject$.next(productId);
    }
}
