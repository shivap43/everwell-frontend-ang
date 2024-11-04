import { BenefitAmountForCarrier } from "./models/benefit-amount-for-carrier.model";
import { DeletePlanChoice } from "./models/delete-plan-choice.model";
import { HttpClient, HttpHeaders, HttpResponse, HttpParams, HttpEvent } from "@angular/common/http";
import { Injectable, Optional, Inject } from "@angular/core";
import { Observable, Subject, of, BehaviorSubject } from "rxjs";
import { PlanChoice, CountryState, PlanYear, ContiguousDates, AgentInfo } from "@empowered/constants";
import { ProductSelection } from "./models/product-selection.model";
import { BASE_PATH } from "../variables";
import { Configuration } from "../configuration";
import {
    RecentCensusConflict,
    CarrierForm,
    CarrierFormStatus,
    ProductContributionLimit,
    CarrierFormResponse,
    ApprovalRequest,
    MigratePricing,
    AccountCarrier,
    SaveCarrierSetupStatus,
    CarrierSetupStatus,
    CoverageDetails,
    PartyType,
    EligiblePlans,
    RefreshAflacGroupInfo,
    AflacGroupPlanChoiceDetail,
    AflacGroupPlanPriceDetail,
    AflacGroupPlanPriceDetailFilter,
    AgProductPriceFilter,
    BenefitOfferingSettingsInfo,
} from "./models";
import { catchError } from "rxjs/operators";

const ALL_PRODUCTS = "ALL";
@Injectable({ providedIn: "root" })
export class BenefitsOfferingService {
    defaultHeaders = new HttpHeaders();
    configuration = new Configuration();
    approvalToast = true;
    benefitOfferingSitusState?: CountryState[] = undefined;
    protected basePath = "/api";
    private readonly showRules$ = new Subject<boolean>();
    showsRules$ = this.showRules$.asObservable();
    private readonly isLoading$ = new Subject<boolean>();
    showSpinner$ = this.isLoading$.asObservable();
    private readonly reviewBenefitsOffering$ = new Subject<boolean>();
    reviewBenefitsOfferingFlag$ = this.reviewBenefitsOffering$.asObservable();
    private readonly benefitOfferingSettings$ = new BehaviorSubject<BenefitOfferingSettingsInfo | null>(null);
    benefitOfferingSettingsData = this.benefitOfferingSettings$.asObservable();
    private coverageContiguousDates?: ContiguousDates;
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
    changeShowRulesValue(showRulesValue: boolean): void {
        this.showRules$.next(showRulesValue);
    }
    /**
     * This method is used to start or stop spinner in AG mbo
     */
    changeShowSpinner(isSpinner: boolean): void {
        this.isLoading$.next(isSpinner);
    }
    /**
     * fetch spinner status
     * @returns observable of spinner status
     */
    getSpinnerStatus(): Observable<boolean> {
        return this.showSpinner$;
    }
    /**
     * Function to set the BO settings data
     * @benefitOfferingSettingsInfo setting data info
     */
    setBenefitOfferingSettingsData(benefitOfferingSettingsInfo: BenefitOfferingSettingsInfo): void {
        this.benefitOfferingSettings$.next(benefitOfferingSettingsInfo);
    }
    /**
     * This method is used to set review benefits offering flag
     * @param reviewBenefitsOffering represents whether user clicked on review in account list or not
     */
    setReviewBenefitsOfferingFlag(reviewBenefitsOffering: boolean): void {
        this.reviewBenefitsOffering$.next(reviewBenefitsOffering);
    }
    getBenefitOfferingDefaultStates(mpGroup?: number): Observable<CountryState[]> {
        const httpOptions = {
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<CountryState[]>(`${this.configuration.basePath}/benefitOffering/defaultStates`, httpOptions);
    }

    setBenefitOfferingSitusState(state: CountryState[]): void {
        this.benefitOfferingSitusState = state;
    }

    getBenefitOfferingSitusState(): CountryState[] | undefined {
        return this.benefitOfferingSitusState;
    }
    /**
     * This method is used to get all offerable plans
     * @param states contains list of benefits-offering states
     * @param mpGroup is the group number of account
     * @param type Products type, default value ALL
     * @returns observable of type EligiblePlans
     */
    getOfferablePlans(states: string[], mpGroup: number, type: string = ALL_PRODUCTS): Observable<EligiblePlans> {
        const httpOptions = {
            params: {
                states,
                type,
            },
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<EligiblePlans>(`${this.configuration.basePath}/benefitOffering/plans`, httpOptions);
    }

    saveProductSelection(productSelections: ProductSelection[], mpGroup: number): Observable<any> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.post<any>(
            `${this.configuration.basePath}/benefitOffering/products/saveSelection`,
            productSelections,
            httpOptions,
        );
    }

    /**
     * Service call to get Aflac Party Information
     * @param {number} mpGroup mpGroup of the logged in user
     * @returns {AgentInfo[]} observable of AgentInfo
     */
    getAflacGroupPartyInformation(mpGroup?: number): Observable<AgentInfo[]> {
        const httpOptions = {
            params: {
                partyKey: [PartyType.CLIENT_SPECIALIST, PartyType.BROKER_SALES],
            },
            headers: {
                "MP-Group": mpGroup != null ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<AgentInfo[]>(`${this.configuration.basePath}/aflac/account/group/info/party`, httpOptions);
    }
    /**
     *
     *@description service to get plan choices for maintenance of Benefit offering
     * @param {boolean} useUnapproved
     * @param {boolean} includeRemovedPlans
     * @param {number} mpGroup
     * @param {string} expand
     * @returns {Observable<any>}
     * @memberof BenefitsOfferingService
     */
    getPlanChoices(useUnapproved: boolean, includeRemovedPlans: boolean, mpGroup?: number, expand?: string): Observable<any> {
        const httpOptions = {
            params: {
                useUnapproved: useUnapproved.toString(),
                includeRemovedPlans: includeRemovedPlans.toString(),
            },
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        const expandValue = expand ? expand : "planId";

        return this.httpClient.get<PlanChoice[]>(
            `${this.configuration.basePath}/benefitOffering/plans/choices?expand=` + expandValue,
            httpOptions,
        );
    }

    getPlanChoiceDetail(useUnapproved: boolean, choiceId: number, mpGroup?: number): Observable<any> {
        const httpOptions = {
            params: {
                useUnapproved: useUnapproved.toString(),
            },
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<PlanChoice[]>(
            `${this.configuration.basePath}/benefitOffering/plans/choices/${choiceId}/detail`,
            httpOptions,
        );
    }
    getPlanChoiceDetails(useUnapproved: boolean, mpGroup?: number): Observable<any> {
        const httpOptions = {
            params: {
                useUnapproved: useUnapproved.toString(),
            },
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<PlanChoice[]>(`${this.configuration.basePath}/benefitOffering/plans/choices/details`, httpOptions);
    }

    createPlanChoice(planchoice: PlanChoice, mpGroup: number): Observable<void> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.post<void>(`${this.configuration.basePath}/benefitOffering/plans/choices`, planchoice, httpOptions);
    }
    savePlanYear(planYear: PlanYear, mpGroup: number): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post(`${this.configuration.basePath}/benefitOffering/planYears`, planYear, {
            headers: this.defaultHeaders,
            observe: "response",
        });
    }
    updatePlanYear(planYear: PlanYear, mpGroup: number, planYearId: number): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put(`${this.configuration.basePath}/benefitOffering/planYears/${planYearId}`, planYear, {
            headers: this.defaultHeaders,
            observe: "response",
        });
    }
    deletePlanYear(mpGroup: number, planYearId: number): Observable<void> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.delete<void>(`${this.configuration.basePath}/benefitOffering/planYears/${planYearId}`, httpOptions);
    }

    /**
     *
     * @param mpGroup {number} : the identifier of the group in which the operation should be performed
     * @param useUnapproved {boolean} : unApproved flag
     * @param inOpenEnrollment {boolean} (optional) : Check if plan year in open enrollment
     * @param checkActiveEnrollments {boolean} (optional) : if true, flags any current or future plan years with active enrollments
     * @returns Observable<PlanYear[]> : returns array of Observable of Plan Year details for a group
     */
    getPlanYears(
        mpGroup: number,
        useUnapproved: boolean,
        inOpenEnrollment?: boolean,
        checkActiveEnrollments?: boolean,
    ): Observable<PlanYear[]> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        if (inOpenEnrollment) {
            params = params.append("inOpenEnrollment", inOpenEnrollment.toString());
        }
        if (checkActiveEnrollments) {
            params = params.append("checkActiveEnrollments", checkActiveEnrollments.toString());
        }
        params = params.append("useUnapproved", useUnapproved.toString());
        return this.httpClient.get<PlanYear[]>(`${this.configuration.basePath}/benefitOffering/planYears`, {
            headers: this.defaultHeaders,
            params: params,
        });
    }

    updatePlanChoice(planchoice: PlanChoice, mpGroup: number): Observable<void> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.put<void>(
            `${this.configuration.basePath}/benefitOffering/plans/choices/${planchoice.id}`,
            planchoice,
            httpOptions,
        );
    }

    getPlanEligibility(planIds: string[], mpGroup: number): Observable<any> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<any>(`${this.configuration.basePath}/benefitOffering/plans/eligibility?planIds=${planIds}`, httpOptions);
    }

    getProductChoices(mpGroup: number, useUnapproved: boolean): Observable<ProductSelection[]> {
        const httpOptions = {
            params: {
                useUnapproved: useUnapproved.toString(),
            },
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<ProductSelection[]>(`${this.configuration.basePath}/benefitOffering/products`, httpOptions);
    }

    deletePlanChoice(deletePlanChoice: DeletePlanChoice, choiceId: number, mpGroup: number, enrollmentEndDate?: string): Observable<void> {
        const httpOptions: {
            params: {
                [param: string]: string | string[];
            };
            headers: {
                [header: string]: string | string[];
            };
            body: {
                deletePlanChoice: DeletePlanChoice;
                enrollmentEndDate?: string;
            };
        } = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
            body: {
                deletePlanChoice,
            },
        };

        const apiEndPoint = this.configuration.basePath + "/benefitOffering/plans/choices/" + choiceId;
        httpOptions.headers["MP-Group"] = mpGroup ? mpGroup.toString() : "";
        httpOptions.body["deletePlanChoice"] = deletePlanChoice;

        if (enrollmentEndDate !== undefined) {
            httpOptions.body.enrollmentEndDate = enrollmentEndDate;
        }
        return this.httpClient.delete<void>(apiEndPoint, httpOptions);
    }
    /**
     * Method to get BO carriers
     * @param useUnapproved: to get approved/unapproved carriers
     * @param mpGroup: mpGroup of the group
     * @param includeExpiredPlanYears: to get expired PY carriers
     * @returns {Observable<AccountCarrier[]>} - Observable of Account carriers
     */
    getBenefitOfferingCarriers(
        useUnapproved: boolean,
        mpGroup?: string,
        includeExpiredPlanYears: boolean = false,
    ): Observable<AccountCarrier[]> {
        const httpOptions = {
            params: {
                useUnapproved: useUnapproved.toString(),
                includeExpiredPlanYears: includeExpiredPlanYears.toString(),
            },
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<AccountCarrier[]>(`${this.configuration.basePath}/benefitOffering/carriers`, httpOptions);
    }
    /**
     * function to reference/upload the in-force report
     * @param planYearId - the current plan year id
     * @param file - file to be uploaded
     * @param mpGroup - the current mp-group
     * @param allowMultipartFileUpload - whether to upload multipart file
     * @returns Observable<HttpEvent<string>> - Observable of http events
     */
    uploadInForceReport(
        planYearId: number,
        file: File,
        mpGroup: string,
        allowMultipartFileUpload?: boolean,
    ): Observable<HttpEvent<string>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        const formData: FormData = new FormData();
        if (allowMultipartFileUpload) {
            formData.append("multipartFile", file, file.name);
        } else {
            params = new HttpParams().set("objectKey", file.name);
        }
        return this.httpClient.post<string>(
            `${this.configuration.basePath}/benefitOffering/planYears/${planYearId}/inForce/upload`,
            allowMultipartFileUpload ? formData : null,
            {
                headers,
                params,
                reportProgress: true,
                observe: "events",
            },
        );
    }

    getBenefitOfferingCarrier(carrierId: number, useUnapproved: boolean, mpGroup?: string): Observable<AccountCarrier> {
        const httpOptions = {
            params: {
                useUnapproved: useUnapproved.toString(),
            },
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<AccountCarrier>(`${this.configuration.basePath}/benefitOffering/carriers/${carrierId}`, httpOptions);
    }
    getRecentCensusConflict(mpGroup: number): Observable<RecentCensusConflict> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<RecentCensusConflict>(
            `${this.configuration.basePath}/benefitOffering/settings/recentCensusConflict`,
            httpOptions,
        );
    }

    getCarrierForms(mpGroup: number, carrierId: number, useUnapproved: boolean): Observable<HttpResponse<CarrierForm[]>> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        const params = new HttpParams().set("expand", "statusId").append("useUnapproved", useUnapproved.toString());
        return this.httpClient.get<CarrierForm[]>(`${this.configuration.basePath}/benefitOffering/carriers/${carrierId}/forms`, {
            headers: httpOptions.headers,
            observe: "response",
            params: params,
        });
    }

    getCarrierForm(
        mpGroup: number,
        carrierId: number,
        carrierFormId: number,
        useUnapproved: boolean,
        expand?: string,
    ): Observable<CarrierForm> {
        const httpOptions: {
            params: {
                [param: string]: string | string[];
            };
            headers: {
                [header: string]: string | string[];
            };
        } = {
            params: {
                useUnapproved: useUnapproved.toString(),
            },
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        if (expand) {
            httpOptions.params.expand = expand;
        }
        return this.httpClient.get<CarrierForm>(
            `${this.configuration.basePath}/benefitOffering/carriers/${carrierId}/forms/${carrierFormId}`,
            httpOptions,
        );
    }

    getCarrierSetupStatuses(mpGroup: number, carrierId: number, useUnapproved: boolean): Observable<CarrierFormStatus[]> {
        const httpOptions = {
            params: {
                useUnapproved: useUnapproved.toString(),
            },
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<CarrierFormStatus[]>(
            `${this.configuration.basePath}/benefitOffering/carriers/${carrierId}/statuses`,
            httpOptions,
        );
    }

    saveCarrierSetupStatuses(mpGroup: number, carrierId: number, carrierSetupStatus: SaveCarrierSetupStatus): Observable<void> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<void>(
            `${this.configuration.basePath}/benefitOffering/carriers/${carrierId}/statuses`,
            carrierSetupStatus,
            {
                headers: headers,
            },
        );
    }

    getProductContributionLimits(productId: number, mpGroup: number): Observable<ProductContributionLimit> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<ProductContributionLimit>(
            `${this.configuration.basePath}/benefitOffering/products/${productId}/contributionLimits`,
            {
                headers: headers,
            },
        );
    }

    /**
     *
     * Returns the carrier form responses for a given mpGroup and carrierId
     *
     * @param mpGroup
     * @param carrierId
     * @returns {Observable<CarrierFormResponse>}
     */
    getCarrierFormResponses(mpGroup: number, carrierId: number): Observable<CarrierFormResponse> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<CarrierFormResponse>(
            `${this.configuration.basePath}/benefitOffering/carriers/${carrierId}/forms/responses`,
            { headers },
        );
    }

    saveCarrierFormResponses(
        mpGroup: number,
        carrierId: number,
        carrierFormId: number,
        payload: CarrierFormResponse[],
    ): Observable<HttpResponse<void>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<void>(
            `${this.configuration.basePath}/benefitOffering/carriers/${carrierId}/forms/${carrierFormId}/responses`,
            payload,
            {
                headers: headers,
                observe: "response",
            },
        );
    }
    saveEligibleRegionAndClass(planchoice: any, planChoiceId: number, mpGroup: number): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<any>(
            `${this.configuration.basePath}/benefitOffering/plans/choices/${planChoiceId}/pricingEligibility`,
            planchoice,
            {
                headers: this.defaultHeaders,
                observe: "response",
            },
        );
    }
    getEligibleRegionsAndClasses(planChoiceId: number, mpGroup: number, useUnapproved: boolean): Observable<any> {
        const params = new HttpParams().set("useUnapproved", useUnapproved.toString());
        return this.httpClient.get<any>(`${this.configuration.basePath}/benefitOffering/plans/choices/${planChoiceId}/pricingEligibility`, {
            headers: this.defaultHeaders,
            params,
        });
    }

    getPlanPricingEligibilityCombinations(planChoiceId: number, mpGroup: number, useUnapproved: boolean): Observable<any> {
        const params = new HttpParams().set("useUnapproved", useUnapproved.toString());
        return this.httpClient.get<any>(
            `${this.configuration.basePath}/benefitOffering/plans/choices/${planChoiceId}/pricingEligibilityCombinations`,
            {
                headers: this.defaultHeaders,
                params,
            },
        );
    }

    setEligibilityForPlanPricingEligibilityCombination(
        planChoiceId: number,
        combinationId: number,
        eligible: boolean,
        mpGroup: number,
    ): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().set("eligible", eligible.toString());
        return this.httpClient.put<any>(
            `${this.configuration.basePath}/benefitOffering/plans/choices/${planChoiceId}/pricingEligibilityCombinations/${combinationId}`,
            {},
            {
                headers: this.defaultHeaders,
                params: params,
            },
        );
    }

    savePricesToPlanPricingEligibilityCombination(
        planChoiceId: number,
        combinationId: number,
        saveCombinationObject: any,
        mpGroup: number,
    ): Observable<any> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.put<any>(
            // eslint-disable-next-line max-len
            `${this.configuration.basePath}/benefitOffering/plans/choices/${planChoiceId}/pricingEligibilityCombinations/${combinationId}/prices`,
            saveCombinationObject,
            httpOptions,
        );
    }

    getChoicePricingTemplate(planChoiceId: string, mpGroup: string, useUnapproved: boolean = false): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().set("useUnapproved", useUnapproved.toString());
        return this.httpClient.get<any>(`${this.configuration.basePath}/benefitOffering/plans/choices/${planChoiceId}/pricingTemplate`, {
            headers: this.defaultHeaders,
            params: params,
        });
    }

    /**
     * get approval request list
     * @param mpGroup
     * @param includeNotSubmitted
     * @return observable of approval requests
     */
    getApprovalRequests(mpGroup: number, includeNotSubmitted: boolean = false): Observable<ApprovalRequest[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().set("includeNotSubmitted", includeNotSubmitted.toString());
        return this.httpClient.get<ApprovalRequest[]>(`${this.configuration.basePath}/benefitOffering/approvalRequests`, {
            headers: headers,
            params: params,
        });
    }

    /**
     * creates data entry for the approval request
     * @param mpGroup
     * @return observable of type void
     */
    createApprovalRequest(mpGroup: number): Observable<void> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient
            .post<void>(`${this.configuration.basePath}/benefitOffering/approvalRequests`, "", {
            headers: headers,
        })
            .pipe(catchError((error) => of(error)));
    }

    submitApprovalRequest(mpGroup: number, adminApprovalRequired?: boolean): Observable<any> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().set("adminApprovalRequired", adminApprovalRequired ? adminApprovalRequired.toString() : "");

        return this.httpClient.post<any>(`${this.configuration.basePath}/benefitOffering/approvalRequests/submit`, "", {
            headers: headers,
            params: params,
        });
    }

    respondToApprovalRequest(mpGroup: number, payload: any): Observable<any> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<any>(`${this.configuration.basePath}/benefitOffering/approvalRequests/respond`, payload, {
            headers: headers,
        });
    }

    /**
     * Function to call getPlanYear API
     * @param planYearId {number} : Identifier of the plan year
     * @param mpGroup {number} : the identifier of the group in which the operation should be performed
     * @param useUnapproved {boolean} optional : unApproved flag
     * @param checkActiveEnrollments {boolean} optional : if true, flags any current or future plan years with active enrollments
     * @returns Observable<PlanYear> : returns Observable of Plan Year details
     */
    getPlanYear(planYearId: number, mpGroup: number, useUnapproved?: boolean, checkActiveEnrollments?: boolean): Observable<PlanYear> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        params = params.append("useUnapproved", !!useUnapproved).append("checkActiveEnrollments", !!checkActiveEnrollments);
        return this.httpClient.get<PlanYear>(`${this.configuration.basePath}/benefitOffering/planYears/${planYearId}`, {
            headers: this.defaultHeaders,
            params,
        });
    }

    getPlanPricingEligibilityCombination(
        choiceId: number,
        combinationId: number,
        mpGroup: number,
        useUnapproved: boolean,
    ): Observable<any> {
        const params = new HttpParams().set("useUnapproved", useUnapproved.toString());

        return this.httpClient.get<any>(
            `${this.configuration.basePath}/benefitOffering/plans/choices/${choiceId}/pricingEligibilityCombinations/${combinationId}`,
            {
                headers: this.defaultHeaders,
                params,
            },
        );
    }

    revertToPreviousPlanPricingEligibilityCombinations(choiceId: number, mpGroup: number): Observable<any> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.post<any>(
            `${this.configuration.basePath}/benefitOffering/plans/choices/${choiceId}/pricingEligibilityCombinations/revert`,
            {},
            httpOptions,
        );
    }

    migratePreviousToNewPlanPricingEligibilityCombinations(
        choiceId: number,
        migrationArray: MigratePricing[],
        mpGroup: number,
    ): Observable<any> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.post<any>(
            `${this.configuration.basePath}/benefitOffering/plans/choices/${choiceId}/pricingEligibilityCombinations/migratePricing`,
            migrationArray,
            httpOptions,
        );
    }

    saveCarrierSetupStatus(mpGroup: number, carrierId: number, statusPayload: CarrierSetupStatus): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<void>(`${this.configuration.basePath}/benefitOffering/carriers/${carrierId}/status`, statusPayload, {
            headers: headers,
            observe: "response",
        });
    }
    /**
     * Method to display the Carrier form
     * @param mpGroup group number
     * @param carrierId carrier Id
     * @return return type is "text/HTML" format
     */
    downloadCarrierForms(mpGroup: number, carrierId: number): Observable<any> {
        const headers = new HttpHeaders({ "Content-Type": "image/png" }).set("MP-Group", mpGroup ? mpGroup.toString() : "");

        return this.httpClient.get<any>(`${this.configuration.basePath}/benefitOffering/carriers/${carrierId}/forms/download`, {
            headers: headers,
            responseType: "text/html" as "json",
            observe: "body",
        });
    }
    getExceptionPlansByExceptionType(mpGroup: number, exceptionType: string): Observable<any> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");

        return this.httpClient.get<any>(`${this.configuration.basePath}/benefitOffering/exceptions/${exceptionType}`, {
            headers: headers,
            observe: "body",
        });
    }
    createProductChoice(productSelections: ProductSelection, mpGroup: number): Observable<void> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.post<void>(`${this.configuration.basePath}/benefitOffering/products`, productSelections, httpOptions);
    }
    updateProductChoice(productSelections: ProductSelection, mpGroup: number): Observable<void> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.put<void>(
            `${this.configuration.basePath}/benefitOffering/products/${productSelections.id}`,
            productSelections,
            httpOptions,
        );
    }
    deleteProductChoice(id: number, mpGroup: number): Observable<void> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.delete<void>(`${this.configuration.basePath}/benefitOffering/products/${id}`, httpOptions);
    }

    cancelApprovalRequest(mpGroup: number): Observable<any> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");

        return this.httpClient.post<any>(`${this.configuration.basePath}/benefitOffering/approvalRequests/cancel`, "", {
            headers: headers,
        });
    }
    getBenefitOfferingCarrierProducts(useUnapproved: boolean = false): Observable<any> {
        const params = new HttpParams().set("useUnapproved", useUnapproved.toString());
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");
        return this.httpClient.get<any>(`${this.configuration.basePath}/benefitOffering/carriers/products`, {
            headers: headers,
            params: params,
        });
    }
    getBenefitAmountsForCarrier(carrierId: number, sicCode: string, yearsOfBusiness: number): Observable<BenefitAmountForCarrier[]> {
        const params = new HttpParams()
            .set("sicCode", sicCode)
            .append("yearsOfBusiness", yearsOfBusiness ? yearsOfBusiness.toString() : "");

        return this.httpClient.get<BenefitAmountForCarrier[]>(
            `${this.configuration.basePath}/benefitOffering/carriers/${carrierId}/forms/benefitAmount`,
            {
                headers: this.defaultHeaders.set("MP-Group", ""),
                params,
            },
        );
    }
    /**
     * This methid is used to get Coverage details of perticular Carrier
     * @param carrierId its manadory parameter for API request
     * @param useUnapproved its optional parameter and having default value as "false"
     * @param mpGroup its optional parameter
     * @returns Observable of CoverageDetails[]
     */
    getCarrierCoverageDetails(carrierId: number, useUnapproved: boolean = false, mpGroup?: string): Observable<CoverageDetails[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup != null ? (mpGroup ? mpGroup.toString() : "") : "");
        const params = new HttpParams().set("useUnapproved", useUnapproved.toString());
        return this.httpClient.get<CoverageDetails[]>(
            `${this.configuration.basePath}/benefitOffering/carriers/${carrierId}/coverageDetails`,
            {
                headers: headers,
                params: params,
            },
        );
    }

    /**
     * This method is used to set the value of coverageContiguousDates
     * This method is called from coverage-dates step in maintenance of benefits offering
     * if dates are overlapping with previous plan year
     *
     * @param status is used to set status of coverageContiguousDates value
     */
    setCoverageContiguousDates(status: ContiguousDates): void {
        this.coverageContiguousDates = status;
    }

    /**
     * This method is used to get the value of coverageContiguousDates
     * This method is used for show / hide of info of overlapping dates in maintenance-of-benefits offering
     * @returns coverageContiguousDates value
     */
    getCoverageContiguousDates(): ContiguousDates | undefined {
        return this.coverageContiguousDates;
    }
    /**
     *
     *@description service to remove plan for maintenance of Benefit offering
     * @param planId {number} selected planId
     * @param mpGroup {number} selected Mp group
     * @param deactivationDate {string} deactivation date
     * @param planYearId {number} selected plan year id
     * @returns {Observable<HttpResponse<void>>}
     * @memberof BenefitsOfferingService
     */
    deactivatePlanOffering(
        planId: number,
        mpGroup: number,
        deactivationDate?: string,
        planYearId?: number,
    ): Observable<HttpResponse<void>> {
        const httpOptions: {
            params: {
                [param: string]: string | string[];
            };
            headers: {
                [header: string]: string | string[];
            };
        } = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        if (deactivationDate) {
            httpOptions.params.deactivationDate = deactivationDate;
        }

        if (planYearId) {
            httpOptions.params.planYearId = planYearId ? planYearId.toString() : "";
        }

        return this.httpClient.post<HttpResponse<void>>(
            `${this.configuration.basePath}/benefitOffering/plans/${planId}/deactivate`,
            "",
            httpOptions,
        );
    }
    /**
     *
     *@description service to remove product for maintenance of Benefit offering
     * @param planYearIds represents array of plan year ids
     * @param productId represents product id
     * @param carrierId represents carrier Id
     * @param mpGroup represents MP group id
     * @param deactivationDate represents deactivation date
     * @returns observable of http response
     * @memberof BenefitsOfferingService
     */
    deactivatePlansByProductCarrier(
        planYearIds: number[],
        productId: number,
        carrierId: number,
        mpGroup: number,
        deactivationDate?: string,
    ): Observable<HttpResponse<void>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams()
            .set("deactivationDate", deactivationDate ? deactivationDate.toString() : "")
            .set("planYearIds", planYearIds.toString());

        return this.httpClient.post<HttpResponse<void>>(
            `${this.configuration.basePath}/benefitOffering/products/${productId}/carriers/${carrierId}/deactivate`,
            "",
            {
                headers,
                params,
            },
        );
    }

    /**
     * Function to update VAS Exceptions plan year dates
     * @param planYearId {number}
     * @param mpGroup {number}
     * @returns {Observable<HttpResponse<void>>}
     * @memberof BenefitsOfferingService
     */
    updatePlanYearVasExceptions(planYearId: number, mpGroup: number): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<HttpResponse<void>>(
            `${this.configuration.basePath}/benefitOffering/planYears/${planYearId}/exceptions/vas`,
            {},
            {
                headers: headers,
            },
        );
    }
    /**
     * This method is used to save aflac group benefits offering
     * @param individualOfferingEndDate is individual offering end date of aflac group
     * @param mpGroup is group number of the account
     * @returns an observable of void
     */
    saveAflacGroupBenefitOffering(individualOfferingEndDate: string, mpGroup?: number): Observable<void> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params: HttpParams = new HttpParams();

        if (individualOfferingEndDate) {
            params = new HttpParams().set("individualOfferingEndDate", individualOfferingEndDate);
        }
        return this.httpClient.put<void>(`${this.configuration.basePath}/benefitOffering/aflacGroup`, "", {
            headers: headers,
            params,
        });
    }
    /**
     * This method is used to refresh aflac group offering
     * @param mpGroup is group number of the account
     * @returns an observable of RefreshAflacGroupInfo
     */
    refreshAflacGroupOfferablePlans(mpGroup: number): Observable<RefreshAflacGroupInfo> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.put<RefreshAflacGroupInfo>(
            `${this.configuration.basePath}/benefitOffering/aflacGroup/plans/refresh`,
            "",
            httpOptions,
        );
    }
    /**
     * This method is used to get aflac group plan choices which has to be reviewed
     * @param expandRequired to check expand param is required or not
     * @param mpGroup is group number of the account
     * @returns an observable of AflacGroupPlanChoiceDetail array
     */
    getAflacGroupPlanChoicesForReview(expandRequired: boolean, mpGroup?: number): Observable<AflacGroupPlanChoiceDetail[]> {
        const httpOptions: {
            params: {
                [param: string]: string | string[];
            };
            headers: {
                [header: string]: string | string[];
            };
        } = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        if (expandRequired) {
            httpOptions.params.expand = "planChoice.planId";
        }
        return this.httpClient.get<AflacGroupPlanChoiceDetail[]>(
            `${this.configuration.basePath}/benefitOffering/aflacGroup/plans/choices/review`,
            httpOptions,
        );
    }
    /**
     * This method is used to get aflac group plan pricing detail
     * @param planId is the planId of the aflac group plan
     * @param queryParameters contains the queryParams which has to be passed
     * @param mpGroup is group number of the account
     * @returns an observable of AflacGroupPlanPriceDetail array
     */
    getAflacGroupPlanDetail(
        planId: number,
        queryParameters: { memberType: string; tobaccoStatus: string; age: number } | null = null,
        mpGroup?: number,
    ): Observable<AflacGroupPlanPriceDetail> {
        const httpOptions: {
            params: {
                [param: string]: string | string[];
            };
            headers: {
                [header: string]: string | string[];
            };
        } = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        if (queryParameters) {
            const tobaccoStatusQueryParam = queryParameters.tobaccoStatus;
            if (httpOptions.params.memberType) {
                httpOptions.params.memberType = queryParameters.memberType;
            }

            if (tobaccoStatusQueryParam) {
                httpOptions.params.tobaccoStatus = tobaccoStatusQueryParam;
            }

            if (queryParameters.age !== null) {
                httpOptions.params.age = queryParameters.age ? queryParameters.age.toString() : "";
            }
        }

        return this.httpClient.get<AflacGroupPlanPriceDetail>(
            `${this.configuration.basePath}/benefitOffering/aflacGroup/plans/${planId}/detail`,
            httpOptions,
        );
    }
    /**
     * This function to fetch filter options to be displayed for product pricing filters
     * @param mpGroup id of the account
     * @returns Observable of AgProductPriceFilter array
     */
    getAflacGroupPlanDetailFilters(mpGroup?: number): Observable<AgProductPriceFilter[]> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<AgProductPriceFilter[]>(
            `${this.configuration.basePath}/benefitOffering/aflacGroup/plans/detail/filters`,
            httpOptions,
        );
    }
    /**
     * This function to fetch filter options to be displayed for product pricing filters
     * @param mpGroup id of the account
     * @returns Observable of AgProductPriceFilter array
     */
    getRequiredAflacGroupPlanDetailFilters(mpGroup?: number): Observable<AflacGroupPlanPriceDetailFilter[]> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<AflacGroupPlanPriceDetailFilter[]>(
            `${this.configuration.basePath}/benefitOffering/aflacGroup/plans/detail/filters`,
            httpOptions,
        );
    }
    /**
     * This function fetches the details of eligible BO states, census number and TPI details
     * This is a replacement for getThirdPartyPlatformRequirement(),getCensusEstimate(),getBenefitOfferingStates()
     * @param mpGroup id of the account
     * @returns Observable of BenefitOfferingSettingsInfo
     */
    getBenefitOfferingSettings(mpGroup?: number): Observable<BenefitOfferingSettingsInfo> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<BenefitOfferingSettingsInfo>(`${this.configuration.basePath}/benefitOffering/settings`, httpOptions);
    }
    /**
     * This method saves details of census, benefit offering states and TPP details
     * This is a replacement for changeCensusEstimate(),saveBenefitOfferingStates(),saveThirdPartyPlatformRequirement()
     * @param settingsInfo benefit offering settings info
     * @returns Observable of void
     */
    saveBenefitOfferingSettings(settingsInfo: BenefitOfferingSettingsInfo, mpGroup?: number): Observable<void> {
        const httpOptions = {
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.put<void>(`${this.configuration.basePath}/benefitOffering/settings`, settingsInfo, httpOptions);
    }

    /**
     * This method updates the ADV employee count
     * @param argusTotalEligibleEmployees total eligible employee count
     * @param mpGroup
     * @returns Observable of void
     */
    updateArgusTotalEligibleEmployees(argusTotalEligibleEmployees: string, mpGroup?: number): Observable<void> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params: HttpParams = new HttpParams().set("argusTotalEligibleEmployees", argusTotalEligibleEmployees);
        return this.httpClient.put<void>(
            `${this.configuration.basePath}/benefitOffering/settings/carrier/argus/argusTotalEligibleEmployees`,
            "",
            {
                headers: headers,
                params: params,
            },
        );
    }
}
