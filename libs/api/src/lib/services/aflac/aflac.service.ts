import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from "@angular/common/http";
import { Injectable, Optional, Inject } from "@angular/core";
import { Observable } from "rxjs";
import { Configuration } from "../configuration";
import { BASE_PATH } from "../variables";
import { BUSINESS_ENROLLMENT_TYPE } from "./enums";
import { NewHiredetails } from "../account/models/new-hire-rule.model";
import { NewHireRule } from "./models/new-hire-rule.model";
import { QuoteForm } from "./models/quote-form.model";
import { EmailForm } from "./models/email-form.model";
import { AflacGroupInfo } from "./models/aflac-group-info.model";
import { AflacGroupLocationInformation } from "./models/aflac-group-location-information.model";
import { WebexConnectInfo } from "../benefit-offering/models/webex-license-validation.model";
import {
    QuickQuotePlanDetails,
    CompanyCode,
    WritingNumber,
    Plan,
    Accounts,
    RefreshEligibleInfo,
    AgentInfo,
    PlanSeriesChoice,
    RateSheetPlanSeriesOption,
    RateSheetPlanSeriesOptionBenefitAmounts,
    RiderSelection,
} from "@empowered/constants";
import {
    AflacAccountImport,
    BusinessEnrollments,
    CommissionSplit,
    CrossBorderRule,
    DualPeoRiskClassIds,
    DualPeoRiskSaveRequest,
    EnrollmentModel,
    ImportPeo,
    PeoClass,
    PeoData,
    QuoteSettingsSchema,
    SITCodeHierarchy,
} from "./models";
import { PartyType, Pricing } from "../benefit-offering";
import { AflacAlwaysResource } from "./models/aflac-always-resource";

@Injectable({ providedIn: "root" })
export class AflacService {
    defaultHeaders = new HttpHeaders();
    configuration = new Configuration();
    protected basePath = "/api";

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
     * fetch aflac account
     * @param groupNumber group number as string
     * @param sicIrNumber SIC IR number as string
     * @param adminSitCodeId admin SIT code number
     * @returns {Observable<HttpResponse<Accounts>>} response of Accounts model
     * @memberof AflacService
     */
    getAflacAccount(groupNumber?: string, sicIrNumber?: string, adminSitCodeId?: number): Observable<HttpResponse<Accounts>> {
        let params = new HttpParams();
        if (groupNumber || sicIrNumber) {
            params = groupNumber
                ? params.append("accountNumber", groupNumber)
                : params.append("sicIrNumber", sicIrNumber ? sicIrNumber.toString() : "");
        }
        if (adminSitCodeId) {
            const strAdminSitCodeId = adminSitCodeId.toString();
            params = params.append("adminSitCodeId", strAdminSitCodeId);
        }
        return this.httpClient.get<Accounts>(`${this.configuration.basePath}/aflac/account`, {
            params,
            observe: "response",
        });
    }
    /**
     * This method helps to get Ag group account.
     * For more details refer api contracts.
     * [api]{@link https://api-contracts-nonprod.empoweredbenefits.com/redoc.html?api=aflac#operation/getAflacAccount}
     * @param groupNumber : Ag group number
     */
    getAflacGroup(groupNumber: string): Observable<HttpResponse<Accounts>> {
        let params;
        if (groupNumber) {
            params = new HttpParams().set("aflacGroupNumber", groupNumber);
        }
        return this.httpClient.get<Accounts>(`${this.configuration.basePath}/aflac/account`, {
            params,
            observe: "response",
        });
    }

    importAccount(aflacAccountImport: AflacAccountImport): Observable<HttpResponse<void>> {
        return this.httpClient.post<void>(`${this.configuration.basePath}/aflac/account/import`, aflacAccountImport, {
            observe: "response",
        });
    }

    /**
     * service call to getSitCodes API
     * @param companyCode: CompanyCode, company code, i.e., US or NY
     * @param includeExpired?: boolean, optional, if true, then expiration date will be added in the response or else not.
     * @param allAccountProducers? : boolean(optional), if true then SIT codes of all account producers will be added
     * in response or else not.
     * @param mpGroup?: string, MP Group of account.
     * @returns Observable<WritingNumber[]>, an array of writing numbers
     */
    getSitCodes(
        companyCode: CompanyCode,
        includeExpired: boolean = false,
        allAccountProducers: boolean = false,
        mpGroup?: string,
    ): Observable<WritingNumber[]> {
        const header: HttpHeaders = allAccountProducers
            ? new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "")
            : new HttpHeaders();
        const params = new HttpParams()
            .set("companyCode", companyCode)
            .append("includeExpired", includeExpired.toString())
            .append("allAccountProducers", allAccountProducers.toString());
        return this.httpClient.get<WritingNumber[]>(`${this.configuration.basePath}/aflac/sitCodes`, {
            params: params,
            headers: header,
        });
    }

    /** Method to link Aflac group account
     * @param {boolean} isIndividual variable decide between individual and group
     * @param {string} groupNumber groupNumber to link the Account
     * @param {string} [mpGroup] mpGroup of the logged in user
     * @param {number} [adminSitCode] adminSitCode selected by the user
     * @returns {Observable<HttpResponse<void>>} Returning HttpResponse<void> since it is PUT request
     */
    linkAccount(isIndividual: boolean, groupNumber: string, adminSitCode: number, mpGroup?: string): Observable<HttpResponse<void>> {
        const header: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        if (isIndividual) {
            params = params.append("accountNumber", groupNumber);
            params = params.append("adminSitCodeId", adminSitCode.toString());
        } else {
            params = params.append("aflacGroupNumber", groupNumber);
        }
        const apiEndPoint = `${this.configuration.basePath}/aflac/account/group/link`;
        return this.httpClient.put<void>(
            apiEndPoint,
            {},
            {
                params: params,
                headers: header,
                observe: "response",
            },
        );
    }

    /**
     * Function to Refresh Agent
     * @param mpGroup group number as string
     * @param overrideRefreshAllowedTime boolean value used to updated the account refresh time
     * @returns {Observable<any>}
     */

    refreshAccount(mpGroup: string, overrideRefreshAllowedTime?: boolean): Observable<any> {
        const apiEndPoint = this.configuration.basePath + "/aflac/account/refresh";
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        if (overrideRefreshAllowedTime) {
            params = params.append("overrideRefreshAllowedTime", overrideRefreshAllowedTime);
        }
        return this.httpClient.put<any>(apiEndPoint, "", { params: params, headers: this.defaultHeaders, observe: "response" });
    }
    /**
     * @description Function to Refresh Agent
     * @param overrideRefreshAllowedTime boolean value used to do a hard agent refresh
     * @returns {Observable<void>}
     */
    refreshAgent(overrideRefreshAllowedTime?: boolean): Observable<void> {
        const apiEndPoint = this.configuration.basePath + "/aflac/agent/refresh";
        let params = new HttpParams();
        if (overrideRefreshAllowedTime !== undefined) {
            params = params.append("overrideRefreshAllowedTime", overrideRefreshAllowedTime);
        }
        return this.httpClient.put<void>(apiEndPoint, {}, { params });
    }

    getCommissionSplits(mpGroup: string): Observable<CommissionSplit[]> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<CommissionSplit[]>(`${this.configuration.basePath}/aflac/account/commissions`, {
            headers: this.defaultHeaders,
        });
    }
    getSitCodeHierarchy(sitCodeId: number): Observable<SITCodeHierarchy[]> {
        const params = new HttpParams().set("sitCodeId", sitCodeId.toString());
        return this.httpClient.get<SITCodeHierarchy[]>(`${this.configuration.basePath}/aflac/sitCodeHierarchy`, {
            params,
        });
    }

    getBusinessEnrollment(enrollmentId: number, mpGroup: string): Observable<BusinessEnrollments[]> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint =
            this.configuration.basePath + "/aflac/account/business/{enrollmentId}".replace("{enrollmentId}", enrollmentId.toString());
        return this.httpClient.get<BusinessEnrollments[]>(apiEndPoint, {
            headers: this.defaultHeaders,
        });
    }

    /**
     * Method used to get the business Enrollments list
     * @param businessStatus - SENT or UNSENT
     * @param mpGroup - Group if
     * @param filterString - filters to be applied while fetching the enrollments list
     * @returns list of business enrollments
     */
    getBusinessEnrollments(
        businessStatus: BUSINESS_ENROLLMENT_TYPE,
        mpGroup: string,
        filterString?: string,
    ): Observable<BusinessEnrollments[]> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams().set("businessStatus", businessStatus);
        if (filterString) {
            params = params.append("filter", filterString);
        }
        return this.httpClient.get<BusinessEnrollments[]>(`${this.configuration.basePath}/aflac/account/business`, {
            headers: this.defaultHeaders,
            params,
        });
    }

    updateBusinessEnrollment(enrollmentId: number, enrollmentBody: EnrollmentModel, mpGroup: string): Observable<BusinessEnrollments[]> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint =
            this.configuration.basePath + "/aflac/account/business/{enrollmentId}".replace("{enrollmentId}", enrollmentId.toString());
        return this.httpClient.put<BusinessEnrollments[]>(apiEndPoint, enrollmentBody, {
            headers: this.defaultHeaders,
        });
    }

    downloadCommissionReport(mpGroup: string): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<any>(`${this.configuration.basePath}/aflac/account/business/report`, {
            headers: this.defaultHeaders,
        });
    }
    createCommissionSplit(mpGroup: number, commissionSplit: CommissionSplit): Observable<any> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post(`${this.configuration.basePath}/aflac/account/commissions`, commissionSplit, {
            headers,
        });
    }
    getCommissionSplit(mpGroup: number, commissionId: number): Observable<CommissionSplit> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<CommissionSplit>(`${this.configuration.basePath}/aflac/account/commissions/${commissionId}`, {
            headers,
        });
    }
    updateCommissionSplit(mpGroup: number, commissionId: number, commissionSplit: CommissionSplit): Observable<any> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put(`${this.configuration.basePath}/aflac/account/commissions/${commissionId}`, commissionSplit, {
            headers,
        });
    }
    deleteCommissionSplit(mpGroup: number, commissionId: number): Observable<any> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete(`${this.configuration.basePath}/aflac/account/commissions/${commissionId}`, {
            headers,
        });
    }
    getProducerByWritingNumber(writingNumber: string, expand: string = "reportsToId"): Observable<any> {
        const params = new HttpParams().set("writingNumber", writingNumber.toString()).append("expand", expand);
        return this.httpClient.get<any>(`${this.configuration.basePath}/aflac/producer`, { params: params });
    }
    policyLookup(memberId: number, policyNumber: string, mpGroup: number, productId?: number, isConversionFlow?: boolean): Observable<any> {
        let params = new HttpParams();
        if (isConversionFlow) {
            params = params.append("isConversionFlow", isConversionFlow);
        }
        if (productId) {
            params = params.append("productId", productId);
        }

        const httpOptions = {
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
            params,
        };

        return this.httpClient.post(
            // eslint-disable-next-line max-len
            `${this.configuration.basePath}/aflac/enrollments/policyLookup?memberId=${memberId}&policyNumber=${policyNumber}`,
            {},
            httpOptions,
        );
    }

    createAflacAlways(mpGroup: number, memberId: number, aflacAlwaysResource: AflacAlwaysResource): Observable<any> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post(
            `${this.configuration.basePath}/aflac/members/${memberId}/enrollments/aflacAlways`,
            aflacAlwaysResource,
            {
                headers: headers,
                observe: "response",
            },
        );
    }

    createPeoClass(mpGroup: number, createPeoData: PeoClass): Observable<any> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post(`${this.configuration.basePath}/aflac/benefitOffering/peoClasses`, createPeoData, {
            headers: headers,
            observe: "response",
        });
    }
    getPeoClasses(mpGroup: number): Observable<PeoClass> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<PeoClass>(`${this.configuration.basePath}/aflac/benefitOffering/peoClasses`, {
            headers,
        });
    }
    saveDualPeoSelection(mpGroup: number, saveDualData: DualPeoRiskSaveRequest): Observable<unknown> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put(`${this.configuration.basePath}/aflac/benefitOffering/peoClasses/dual`, saveDualData, {
            headers: headers,
            observe: "response",
        });
    }
    /**
     *
     *@description HTTP service function for Dual or PEO occupation class selection
     * @param {string} [mpGroup]
     * @param {number} [carrierId]
     * @returns {Observable<DualPeoRiskClassIds>}
     * @memberof AflacService
     */
    getDualPeoSelection(mpGroup?: string, carrierId?: number): Observable<DualPeoRiskClassIds> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        if (carrierId) {
            params = params.append("carrierId", carrierId.toString());
        }
        return this.httpClient.get<DualPeoRiskClassIds>(`${this.configuration.basePath}/aflac/benefitOffering/peoClasses/dual`, {
            headers: headers,
            params: params,
        });
    }

    /**
     * Send request to backend to update Aflac policies. Requests are cached for 24 hours. Use `overrideImportAllowedTime` to override cache
     * @param {number} [memberId]
     * @param {number} [mpGroup]
     * @param {boolean} [overrideImportAllowedTime] truthiness denotes an action is flagging that a time stamp should be updated
     * @returns {Observable<void>}
     */
    importAflacPolicies(memberId: number, mpGroup: number, overrideImportAllowedTime = false): Observable<void> {
        const headers: HttpHeaders = this.defaultHeaders
            ? new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "")
            : new HttpHeaders();
        const params = new HttpParams()
            .set("memberId", memberId ? memberId.toString() : "")
            .append("overrideImportAllowedTime", overrideImportAllowedTime.toString());
        return this.httpClient.post<void>(`${this.configuration.basePath}/aflac/enrollments/import`, {}, { headers, params });
    }
    /**
     * Call aflac service to refresh account SIC code
     * @param mpGroup {number}
     * @returns {Observable<HttpResponse<unknown>}
     * @memberof AflacService
     */
    refreshAccountSICCode(mpGroup: number): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<void>(
            `${this.configuration.basePath}/aflac/account/refresh/sicCode`,
            {},
            {
                headers: headers,
                observe: "response",
            },
        );
    }

    getAllowedPdaPolicyNames(): Observable<any> {
        return this.httpClient.get<any>(`${this.configuration.basePath}/aflac/pdaPolicyNames`);
    }

    /**
     * Get applicable plans for given parameters for quick quotes.
     * @param state US state
     * @param partnerAccountType type of partnership for account
     * @param append option to append certain properties to applicable plans in response
     * @returns quick quote plans
     */
    getQuickQuotePlans(
        state: string,
        partnerAccountType: string,
        payrollFrequencyId: number,
        riskClassId: number,
        append?: QuickQuotePlanDetails[],
    ): Observable<Plan[]> {
        let params = new HttpParams({
            fromObject: {
                state: state,
                partnerAccountType: partnerAccountType,
                payrollFrequencyId: payrollFrequencyId,
                riskClassId: riskClassId,
                expand: "productId",
            },
        });
        if (append) {
            params = params.append("append", append.join(","));
        }
        return this.httpClient.get<Plan[]>(`${this.configuration.basePath}/aflac/quote/plans`, {
            params: params,
        });
    }

    /**
     * Get quick quote pricing for a specified plan through Aflac's service endpoint.
     * @param planId id to specify plan
     * @param genericSetting parameters specified by user that may affect pricing
     * @param benefitAmount applicable for certain plans that offer a variable benefit amount
     * @returns an observable containing the API response
     */
    getQuickQuotePlanPricingDetails(
        planId: number,
        genericSetting: QuoteSettingsSchema,
        benefitAmount?: RiderSelection[],
    ): Observable<Pricing> {
        let params = new HttpParams();
        Object.entries(genericSetting).forEach((setting) => {
            params = params.append(setting[0], setting[1]);
        });
        if (benefitAmount && benefitAmount.length) {
            params = params.append("benefitCoverageSelection", JSON.stringify(benefitAmount));
        }
        return this.httpClient.get<Pricing>(`${this.configuration.basePath}/aflac/quote/plans/${planId}/pricing`, {
            params: params,
        });
    }
    convertAflacProspectToAccount(mpGroup: number, requestBody?: any): Observable<any> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put(`${this.configuration.basePath}/aflac/account/convertFromProspect`, requestBody, {
            headers: headers,
        });
    }
    downloadQuoteRateSheet(quoteForm: any): Observable<any> {
        const headers = new HttpHeaders({ "Content-Type": "application/json" }).set("Accept", "application/pdf,*/*");
        const apiEndPoint = `${this.configuration.basePath}/aflac/quote/rateSheet?quoteForm`;
        return this.httpClient.post(apiEndPoint, quoteForm, {
            headers: headers,
            responseType: "blob" as "json",
            observe: "body",
        });
    }
    /**
     * This method is used to add new hire rule
     * @param newHireDetails contains the payload to add new hire rule
     * @param mpGroup is the group number of account
     * @returns observable of httpResponse of type void
     */
    addNewHireRule(newHireDetails: NewHiredetails, mpGroup: number): Observable<HttpResponse<void>> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<HttpResponse<void>>(`${this.configuration.basePath}/businessEvents/newHire`, newHireDetails, {
            headers: headers,
        });
    }

    getNewHireRule(ruleId: number): Observable<NewHireRule> {
        let header = new HttpHeaders();
        header = header.set("MP-Group", "");
        return this.httpClient.get<NewHireRule>(`${this.configuration.basePath}/businessEvents/newHire/${ruleId}`, {
            headers: header,
        });
    }

    getNewHireRules(): Observable<NewHireRule[]> {
        let header = new HttpHeaders();
        header = header.set("MP-Group", "");
        return this.httpClient.get<NewHireRule[]>(`${this.configuration.basePath}/businessEvents/newHire`, {
            headers: header,
        });
    }

    updateNewHireRule(ruleId: number, newHireDetails: NewHiredetails, mpGroup?: number): Observable<NewHireRule> {
        const header: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<NewHireRule>(`${this.configuration.basePath}/businessEvents/newHire/${ruleId}`, newHireDetails, {
            headers: header,
        });
    }

    /**
     * service to download quote for universal quote
     * @param quoteForm model
     * @returns returns an observable of BlobPart type
     * @memberof AflacService
     */
    downloadQuickQuote(quoteForm: QuoteForm): Observable<BlobPart> {
        const headers = new HttpHeaders({ "Content-Type": "application/json" }).set("Accept", "application/pdf,*/*");
        const apiEndPoint = `${this.configuration.basePath}/aflac/quote/download`;
        return this.httpClient.post<BlobPart>(apiEndPoint, quoteForm, {
            headers: headers,
            responseType: "blob" as "json",
            observe: "body",
        });
    }
    /**
     * service to send quote to member via email
     * @param emailForm model
     * @returns {Observable<void>}
     * @memberof AflacService
     */
    emailQuickQuote(emailForm: EmailForm): Observable<void> {
        const headers = new HttpHeaders({ "Content-Type": "application/json" });
        const apiEndPoint = this.configuration.basePath + "/aflac/quote/email";
        return this.httpClient.post<void>(apiEndPoint, emailForm, {
            headers: headers,
        });
    }

    /**
     *@description service to get cross border rules
     * @param {number} mpGroup is mandatory
     * @param {number} memberId is optional
     * @returns {Observable<CrossBorderRule[]>} It will contain array of cross border rules
     * @memberof ShoppingService
     */
    getCrossBorderRules(mpGroup: number, memberId?: number): Observable<CrossBorderRule[]> {
        const apiEndPoint = this.configuration.basePath + "/aflac/crossBorder";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        if (memberId) {
            const params = new HttpParams().set("optionalMemberId", memberId ? memberId.toString() : "");
            return this.httpClient.get<CrossBorderRule[]>(apiEndPoint, { headers: headers, params });
        }
        return this.httpClient.get<CrossBorderRule[]>(apiEndPoint, { headers: headers });
    }

    /**
     * API to call processMasterApp
     * @param mpGroup
     * @returns Observable<string>
     */
    processMasterAppApprovals(mpGroup: string): Observable<string> {
        const header: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<string>(
            `${this.configuration.basePath}/aflac/processMasterAppApprovals`,
            {},
            {
                headers: header,
            },
        );
    }

    /**
     *API to get member consent for TPI
     * @param memberId
     * @param mpGroup
     * @returns Observable<boolean>
     */
    getMemberConsent(memberId: number, mpGroup: string): Observable<boolean> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<boolean>(`${this.configuration.basePath}/aflac/members/${memberId}/consent`, {
            headers,
        });
    }

    /**
     *API to store member consent for TPI
     * @param memberId
     * @param mpGroup
     * @returns Observable<void>
     */
    acceptMemberConsent(memberId: number, mpGroup: string): Observable<void> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<void>(
            `${this.configuration.basePath}/aflac/members/${memberId}/consent`,
            {},
            {
                headers,
            },
        );
    }

    /**
     * API to update the is active flag in database after doing commission split
     * @param accountId the groupid for the respective account
     * @param producerId producerid for which commission split needs to be created
     * @param requestPayload string as ACCEPT once he selects continue to make default split
     * @returns Observable<void> return observable of void
     */
    respondToInvitation(accountId: number, producerId: number, requestPayload: string): Observable<void> {
        return this.httpClient.post<void>(
            `${this.configuration.basePath}/producers/${producerId}/accountInvitations/${accountId}`,
            requestPayload,
            {
                headers: this.defaultHeaders.set("Content-Type", "application/json"),
            },
        );
    }

    /**
     *
     * @param mpGroup
     * @returns Observable<AflacGroupInfo> returns observable of aflac group info
     */
    getAflacGroupInformation(mpGroup?: number): Observable<AflacGroupInfo> {
        const header: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<AflacGroupInfo>(`${this.configuration.basePath}/aflac/account/group/info`, {
            headers: header,
        });
    }

    /**
     * This method is used to get Aflac group party information
     * @param requiredPartyType is an array containing party type enum
     * @param mpGroup is the account number
     * @returns observable of AgentInfo array
     */
    getAflacGroupPartyInformation(requiredPartyType: PartyType[], mpGroup?: number): Observable<AgentInfo[]> {
        const httpOptions = {
            params: {
                partyKey: requiredPartyType,
            },
            headers: {
                "MP-Group": mpGroup != null ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<AgentInfo[]>(`${this.configuration.basePath}/aflac/account/group/info/party`, httpOptions);
    }

    /**
     * This method is used to refresh aflac group account
     * @param mpGroup is the account number
     * @returns Observable of boolean
     */
    refreshAflacGroupAccount(mpGroup?: number): Observable<boolean> {
        const header: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<boolean>(
            `${this.configuration.basePath}/aflac/account/group/refresh`,
            {},
            {
                headers: header,
            },
        );
    }

    /**
     * This function is to get location information for an account
     * @param mpGroup id of the account
     * @returns Observable<AflacGroupLocationInformation[]>
     */
    getAflacGroupLocationInformation(mpGroup: string): Observable<AflacGroupLocationInformation[]> {
        const httpOptions = {
            headers: {
                "MP-Group": mpGroup != null ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<AflacGroupLocationInformation[]>(
            `${this.configuration.basePath}/aflac/account/group/info/locations`,
            httpOptions,
        );
    }
    /**
     * This function is to get deduction frequencies for a account
     * @param mpGroup id of the account
     * @returns Observable<string[]>
     */
    getAflacGroupDeductionFrequencies(mpGroup: string): Observable<string[]> {
        const httpOptions = {
            headers: {
                "MP-Group": mpGroup != null ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<string[]>(`${this.configuration.basePath}/aflac/account/group/info/deductionFrequencies`, httpOptions);
    }
    /**
     * This function will return an observable which validates the writing number by calling aflac service from back end
     * @param mpGroup id of the account
     * @param memberId id for which we are validating
     * @param itemId  enrollment cart item id
     * @param writingNumber to be validated
     * @returns Observable<string> with validated data
     */
    validateWritingNumberForAflacCartItem(mpGroup: string, memberId: number, itemId: number, writingNumber: string): Observable<string> {
        const httpOptions = {
            params: {
                writingNumber,
            },
            headers: {
                "MP-Group": mpGroup != null ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<string>(
            `${this.configuration.basePath}/members/${memberId}/shoppingCart/items/${itemId}/validateAflacWritingNumber`,
            httpOptions,
        );
    }

    /**
     * Method to check if ag account can be deactivated or not
     * @param mpGroup is the account number
     * @returns Observable of boolean
     */
    getAflacGroupUnlinkPermit(mpGroup: string): Observable<boolean> {
        const header: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<boolean>(`${this.configuration.basePath}/aflac/account/group/unlink/permit`, {
            headers: header,
        });
    }

    /**
     *This method is used to unlink Aflac Group Account
     * @param mpGroup Method to unlink ag account
     * @returns Observable<void>
     */
    unlinkAflacGroupAccount(mpGroup: string): Observable<void> {
        const header: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<void>(
            `${this.configuration.basePath}/aflac/account/group/unlink`,
            {},
            {
                headers: header,
            },
        );
    }
    /**
     * This method is used to get Aflac group refresh eligible information
     * @param mgGroup is the account number
     * @returns observable of RefreshEligibleInfo
     */
    getAflacGroupRefreshStatus(mpGroup: number): Observable<RefreshEligibleInfo> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<RefreshEligibleInfo>(`${this.configuration.basePath}/aflac/account/group/refresh/status`, httpOptions);
    }
    /**
     * This function will return an observable which validates producer's license and
     * the webex meeting id for Virtual Face to Face enrollment method
     * @param mpGroup id of the account
     * @param memberId id for which we are validating
     * @returns Observable<WebexConnectInfo> with license and meeting info
     */
    getWebexConnectionAndLicenseStatus(mpGroup: number, memberId: number): Observable<WebexConnectInfo> {
        const params = new HttpParams().set("memberId", memberId ? memberId.toString() : "");
        const header: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");

        return this.httpClient.post<WebexConnectInfo>(`${this.configuration.basePath}/aflac/connectToWebEx`, null, {
            headers: header,
            params,
        });
    }
    /**
     * This method is used to import Peo data and return a count of the number of records imported
     * @param mgGroup is the account number
     * @param peoClass is the peo type
     * @param importPeoData is boolean of if the data should be imported or not
     * @returns observable of PeoData
     */
    importPeoData(mpGroup: number, importPeo: ImportPeo): Observable<PeoData> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<PeoData>(`${this.configuration.basePath}/aflac/account/peoData/import`, importPeo, {
            headers: headers,
        });
    }

    /**
     * Gets rate sheet plan series options
     * @param planSeriesId id of the plan
     * @param state where plan is offered
     * @param partnerAccountType type of partner account
     * @param payrollFrequencyId id of the payrollFrequency for rate sheet creation
     * @param riskClassId id of risk class for rate sheet creation
     * @param [zipCode] of the selected state
     * @param [sicCode]
     * @param [eligibleSubscribers] number of subscribers eligible for a particular selected plan
     * @returns rate sheet plan series options object containing plans
     */
    getRateSheetPlanSeriesOptions(
        planSeriesId: number,
        state: string,
        partnerAccountType: string,
        payrollFrequencyId: number,
        riskClassId: number,
        zipCode?: string,
        sicCode?: number,
        eligibleSubscribers?: number,
    ): Observable<RateSheetPlanSeriesOption[]> {
        let params = new HttpParams()
            .set("planSeriesId", planSeriesId)
            .append("state", state)
            .append("partnerAccountType", partnerAccountType)
            .append("payrollFrequencyId", payrollFrequencyId)
            .append("riskClassId", riskClassId);
        if (zipCode) {
            params = params.append("zipCode", zipCode);
        }
        if (sicCode) {
            params = params.append("sicCode", sicCode);
        }
        if (eligibleSubscribers) {
            params = params.append("eligibleSubscribers", eligibleSubscribers);
        }
        return this.httpClient.get<RateSheetPlanSeriesOption[]>(`${this.configuration.basePath}/aflac/rateSheet/planSeries/options`, {
            params: params,
        });
    }

    /**
     * Downloads rate sheet
     * @param state selected for customized rate sheet
     * @param partnerAccountType type of partner account
     * @param payrollFrequencyId id of the payrollFrequency selected before rate sheet download
     * @param riskClassId id of risk class selected before rate sheet download
     * @param rateSheetTitle title of the rate sheet to be displayed on pdf
     * @param planSeriesChoices plans selected before rate sheet download
     * @param [zipCode] of the state selected
     * @param [sicCode]
     * @param [eligibleSubscribers] number of subscribers eligible for particular selected plan
     */
    downloadRateSheet(
        state: string,
        partnerAccountType: string,
        payrollFrequencyId: number,
        riskClassId: number,
        rateSheetTitle: string,
        planSeriesChoices: PlanSeriesChoice[],
        zipCode?: string,
        sicCode?: number,
        eligibleSubscribers?: number,
    ): Observable<BlobPart> {
        const headers = new HttpHeaders({ "Content-Type": "application/json" }).set("Accept", "application/pdf,*/*");
        const apiEndPoint = `${this.configuration.basePath}/aflac/rateSheet/download`;
        let params = new HttpParams()
            .set("state", state)
            .set("partnerAccountType", partnerAccountType)
            .set("payrollFrequencyId", payrollFrequencyId)
            .set("riskClassId", riskClassId);
        if (zipCode) {
            params = params.set("zipCode", zipCode);
        }
        if (sicCode) {
            params = params.set("sicCode", sicCode);
        }
        if (eligibleSubscribers) {
            params = params.set("eligibleSubscribers", eligibleSubscribers);
        }
        return this.httpClient.post<BlobPart>(
            apiEndPoint,
            { rateSheetTitle: rateSheetTitle, planSeriesChoices: planSeriesChoices },
            {
                headers: headers,
                params: params,
                responseType: "blob" as "json",
                observe: "body",
            },
        );
    }

    /**
     * Gets rate sheet plan series option benefit amounts based on selected plan series settings
     * @param planSeriesId id of the planSeries selected
     * @param state selected for customized rate sheet
     * @param partnerAccountType type of partner account
     * @param payrollFrequencyId id of the payrollFrequency for rate sheet creation
     * @param riskClassId id of risk class for rate sheet creation
     * @param minAge minimum age selected from plan series settings
     * @param maxAge maximum age selected from plan series settings
     * @param [zipCode] of the state selected
     * @param [sicCode]
     * @param [eligibleSubscribers] number of subscribers eligible for a particular selected plan
     * @param [baseBenefitAmount] base benefit amount selected by the user
     * @returns rate sheet plan series option benefit amounts
     */
    getRateSheetPlanSeriesOptionBenefitAmounts(
        planSeriesId: number,
        state: string,
        partnerAccountType: string,
        payrollFrequencyId: number,
        riskClassId: number,
        minAge: number,
        maxAge: number,
        zipCode?: string,
        sicCode?: number,
        eligibleSubscribers?: number,
        baseBenefitAmount?: number,
    ): Observable<RateSheetPlanSeriesOptionBenefitAmounts[]> {
        let params = new HttpParams()
            .set("planSeriesId", planSeriesId)
            .append("state", state)
            .append("partnerAccountType", partnerAccountType)
            .append("payrollFrequencyId", payrollFrequencyId)
            .append("riskClassId", riskClassId)
            .append("minAge", minAge)
            .append("maxAge", maxAge);
        if (zipCode) {
            params = params.append("zipCode", zipCode);
        }
        if (sicCode) {
            params = params.append("sicCode", sicCode);
        }
        if (eligibleSubscribers) {
            params = params.append("eligibleSubscribers", eligibleSubscribers);
        }
        if (baseBenefitAmount) {
            params = params.append("baseBenefitAmount", baseBenefitAmount);
        }
        return this.httpClient.get<any[]>(`${this.configuration.basePath}/aflac/rateSheet/planSeries/options/benefitAmounts`, {
            params: params,
        });
    }
}
