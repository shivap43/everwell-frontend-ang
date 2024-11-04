import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { Configuration } from "../configuration";
import { BASE_PATH } from "../variables";
import {
    Incentive,
    AccountInvitation,
    AccountCallCenter,
    AccountContacts,
    FlexDollar,
    AudienceGrouping,
    AccountContactType,
    AbstractAudience,
    CallingSchedule,
    TerminationCode,
    AccountListItem,
} from "./models";
import { BrandingModel, BrandingColorFormat, LogoSize } from "./models/branding.model";
import { Resource } from "./models/resource.model";
import { ThirdPartyPlatforms, ThirdPartyPlatformPreview } from "./models/third-party-platforms.model";
import { SitCode } from "./models/sitcode.model";
import { WellthieDatas } from "./models/wellthie-data.model";
import { FrequentlyAskedQuestion } from "./models/frequently-asked-question.model";
import { AccountCarrierContact } from "../account-list";
import {
    PayFrequency,
    AccountProducer,
    Validity,
    GroupAttribute,
    PendingCategory,
    TpiUserDetail,
    Relations,
    MemberFlexDollar,
    Accounts,
    Admin,
    QualifyingEventType,
    CaseBuilder,
    CaseBuilderRequest,
    CaseBuilderAdmin,
} from "@empowered/constants";

@Injectable({ providedIn: "root" })
export class AccountService {
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
     * Get the account brandings for the group. Returns a max of two brandings, always display the latest VALID branding
     * @param mpGroup used to get branding of given group Id
     * @return an array of BrandingModel of given group Id
     */
    getAccountBrandings(mpGroup?: number): Observable<BrandingModel[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");

        return this.httpClient.get<BrandingModel[]>(`${this.configuration.basePath}/account/brandings`, {
            headers: headers,
        });
    }

    getAccount(mpGroup?: string): Observable<Accounts> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup != null ? (mpGroup ? mpGroup.toString() : "") : "");
        return this.httpClient.get<Accounts>(`${this.configuration.basePath}/account`, {
            headers: headers,
        });
    }
    updateAccount(mpGroup: string, accountDetails: any): Observable<Accounts> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", `${mpGroup}`);
        return this.httpClient.put<Accounts>(`${this.configuration.basePath}/account`, accountDetails, {
            headers: headers,
        });
    }

    /**
     * Adds the new branding to the group, Until this upload was successful, it will show as pending
     * @param brandingModel new branding to save
     */
    saveAccountBranding(brandingModel: BrandingModel): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.post(`${this.configuration.basePath}/account/brandings`, brandingModel, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Resets (RE: Delete) the account brandings for the group
     */
    resetAccountBranding(): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");
        return this.httpClient.delete(`${this.configuration.basePath}/account/brandings`, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Get a specific branding by its ID
     * @param brandingId
     */
    getAccountBranding(brandingId: number): Observable<BrandingModel> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");
        return this.httpClient.get<BrandingModel>(`${this.configuration.basePath}/account/brandings/${brandingId}`, {
            headers: headers,
        });
    }

    /** previewRequest: BrandingPreviewRequest
     * Generate a preview image based on the specifications
     * @param previewRequest specs to generate the image with
     */
    getAccountBrandingPreview(colorFormat: BrandingColorFormat, colorCode: string, logoSize: LogoSize): Observable<Blob> {
        return this.httpClient.get<Blob>(`${this.configuration.basePath}/account/brandings/preview`, {
            headers: new HttpHeaders().set("MP-Group", ""),
            params: new HttpParams().set("colorFormat", colorFormat).set("colorCode", colorCode).set("size", logoSize),
            responseType: "blob" as "json",
            observe: "body",
        });
    }

    /**
     * Get all of the admins associated with the account.
     *
     * @returns The list of account admins
     */
    getAccountAdmins(): Observable<Admin[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");
        return this.httpClient.get<Admin[]>(`${this.configuration.basePath}/account/admins`, { headers: headers });
    }

    getPayFrequencies(mpGroup?: string): Observable<PayFrequency[]> {
        return this.httpClient.get<PayFrequency[]>(`${this.configuration.basePath}/account/payFrequencies`);
    }

    getTerminationCodes(mpGroup: string): Observable<TerminationCode[]> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<TerminationCode[]>(`${this.configuration.basePath}/account/terminationCodes`, {
            headers: headers,
        });
    }

    getVocabularies(mpGroup?: string): Observable<string[]> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<string[]>(`${this.configuration.basePath}/account/vocabularies`, {
            headers: headers,
        });
    }

    getDependentRelations(mpGroup: number): Observable<Relations[]> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<Relations[]>(`${this.configuration.basePath}/account/dependentRelations`, {
            headers,
        });
    }

    createAccount(account: Accounts): Observable<any> {
        const params = new HttpParams();
        return this.httpClient.post<any>(`${this.configuration.basePath}/account`, account, {
            observe: "response",
        });
    }

    qualifyingEventTypes(mpGroup: number): Observable<QualifyingEventType[]> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<QualifyingEventType[]>(`${this.configuration.basePath}/account/qualifyingEventTypes`, {
            headers: this.defaultHeaders,
        });
    }

    getResources(requiresAcknowledgement: string = "false"): Observable<Resource[]> {
        const params = new HttpParams().set("requiresAcknowledgement", requiresAcknowledgement);

        let headers = this.defaultHeaders;

        headers = headers.set("MP-Group", "");

        return this.httpClient.get<Resource[]>(`${this.configuration.basePath}/account/resources`, {
            headers: headers,
            params: params,
        });
    }

    getResource(resourceId: number): Observable<Resource> {
        let headers = this.defaultHeaders;

        headers = headers.set("MP-Group", "");

        return this.httpClient.get<Resource>(`${this.configuration.basePath}/account/resources/${resourceId}`, {
            headers,
        });
    }

    createResource(resource: any): Observable<HttpResponse<unknown>> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");

        return this.httpClient.post(`${this.configuration.basePath}/account/resources`, resource, {
            headers,
            observe: "response",
        });
    }

    acknowledgeResources(resourceList: any): Observable<any> {
        let headers = this.defaultHeaders;

        headers = headers.set("MP-Group", "");

        return this.httpClient.put<any>(`${this.configuration.basePath}/account/resources/acknowledge`, resourceList, {
            headers,
        });
    }

    removeResource(resourceId: number): Observable<any> {
        let headers = this.defaultHeaders;

        headers = headers.set("MP-Group", "");

        return this.httpClient.delete(`${this.configuration.basePath}/account/resources/${resourceId}`, { headers });
    }

    updateResource(resourceId: number, resourceType: Resource): Observable<any> {
        let headers = this.defaultHeaders;

        headers = headers.set("MP-Group", "");

        return this.httpClient.put<any>(`${this.configuration.basePath}/account/resources/${resourceId}`, resourceType, { headers });
    }

    getResourceCategories(): Observable<string[]> {
        let headers = this.defaultHeaders;

        headers = headers.set("MP-Group", "");

        return this.httpClient.get<string[]>(`${this.configuration.basePath}/account/resourceCategories`, { headers });
    }

    getIncentives(mpGroup: number): Observable<Incentive[]> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<Incentive[]>(`${this.configuration.basePath}/account/incentives`, { headers });
    }
    /**
     * getFrequentlyAskedQuestions : get frequently asked questions data.
     * @returns FrequentlyAskedQuestion : frequently asked questions data.
     */
    getFrequentlyAskedQuestions(): Observable<FrequentlyAskedQuestion[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");
        return this.httpClient.get<FrequentlyAskedQuestion[]>(`${this.configuration.basePath}/account/frequentlyAskedQuestions`, {
            headers,
        });
    }
    getAccountProducers(mpGroup?: string): Observable<any[]> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<any[]>(`${this.configuration.basePath}/account/producers`, {
            headers: this.defaultHeaders,
        });
    }
    getAccountCarriers(mpGroup: string): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<any>(`${this.configuration.basePath}/account/carriers`, {
            headers: this.defaultHeaders,
        });
    }
    addCarrierContact(mpGroup: string, carrierId: string, carrierContact: AccountCarrierContact): Observable<AccountCarrierContact> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<any>(`${this.configuration.basePath}/account/carriers/${carrierId}/contacts`, carrierContact, {
            headers: this.defaultHeaders,
        });
    }
    getCarrierContacts(mpGroup: string, carrierId: string): Observable<AccountCarrierContact[]> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<AccountCarrierContact[]>(`${this.configuration.basePath}/account/carriers/${carrierId}/contacts`, {
            headers: this.defaultHeaders,
        });
    }
    getAccountCarrierContact(mpGroup: string, carrierId: string, contactId: string): Observable<AccountCarrierContact> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<AccountCarrierContact>(
            `${this.configuration.basePath}/account/carriers/${carrierId}/contacts/${contactId}`,
            {
                headers: this.defaultHeaders,
            },
        );
    }
    updateAccountCarrierContact(mpGroup: string, carrierId: string, contactId: string, contact: any): Observable<AccountCarrierContact> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<AccountCarrierContact>(
            `${this.configuration.basePath}/account/carriers/${carrierId}/contacts/${contactId}`,
            contact,
            {
                headers: this.defaultHeaders,
            },
        );
    }
    deleteAccountCarrierContact(mpGroup: string, carrierId: string, contactId: string): Observable<AccountCarrierContact> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete<AccountCarrierContact>(
            `${this.configuration.basePath}/account/carriers/${carrierId}/contacts/${contactId}`,
            {
                headers: this.defaultHeaders,
            },
        );
    }
    /**
     * @description Method to get account producer's details
     * @param producerId producer id
     * @param mpGroup mp group id
     * @return account producer's details
     */
    getAccountProducer(producerId: string, mpGroup?: number): Observable<AccountProducer> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<AccountProducer>(`${this.configuration.basePath}/account/producers/${producerId}`, {
            headers: headers,
        });
    }
    inviteProducer(producer: AccountInvitation, mpGroup: number): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<any>(`${this.configuration.basePath}/account/producers/invite`, producer, {
            headers: this.defaultHeaders,
        });
    }
    changeAccountProducerRole(producerId: string, mpGroup: number, role: string): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "").set("Content-Type", "application/json");
        return this.httpClient.post(`${this.configuration.basePath}/account/producers/${producerId}`, role, {
            headers: this.defaultHeaders,
        });
    }
    removeAccountProducer(producerId: string, mpGroup: number): Observable<any> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete(`${this.configuration.basePath}/account/producers/${producerId}`, {
            headers: headers,
            observe: "response",
        });
    }
    listAccounts(listAccounts: any): Observable<AccountListItem[]> {
        return this.httpClient.get<AccountListItem[]>(`${this.configuration.basePath}/accountList`);
    }

    /**
     * Service to fetch getAccountThirdPartyPlatforms from API
     * @param mpGroup group id
     * @returns third party account platforms Observable
     */
    getAccountThirdPartyPlatforms(mpGroup: string): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().set("expand", "thirdPartyPlatformId");
        return this.httpClient
            .get<ThirdPartyPlatforms[]>(`${this.configuration.basePath}/account/thirdPartyPlatforms`, {
                headers: this.defaultHeaders,
                params: params,
            })
            .pipe(map((element) => element.sort((el1, el2) => (el1.validity.effectiveStarting > el2.validity.effectiveStarting ? -1 : 1))));
    }
    /**
     * This method is used to create account third party platform
     * @param mpGroup is group number of account
     * @param accountThirdPartyPlatformRequest is payload request which has to be created
     * @returns an observable HttpResponse of void
     */
    createAccountThirdPartyPlatform(
        mpGroup: string,
        accountThirdPartyPlatformRequest: ThirdPartyPlatforms,
    ): Observable<HttpResponse<void>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<void>(`${this.configuration.basePath}/account/thirdPartyPlatforms`, accountThirdPartyPlatformRequest, {
            headers: headers,
            observe: "response",
        });
    }

    getThirdPartyPlatforms(): Observable<any> {
        return this.httpClient.get<ThirdPartyPlatforms[]>(`${this.configuration.basePath}/static/thirdPartyPlatforms`);
    }
    getPendingEnrollmentCategories(mpGroup: string): Observable<PendingCategory[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<PendingCategory[]>(`${this.configuration.basePath}/account/pendingEnrollmentCategories`, {
            headers: headers,
        });
    }

    createPendingEnrollmentCategories(mpGroup: string, payload: PendingCategory): Observable<any> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<any>(`${this.configuration.basePath}/account/pendingEnrollmentCategories`, payload, {
            headers: headers,
        });
    }

    deletePendingEnrollmentCategory(mpGroup: string, pendingEnrollmentCategoryId: number): Observable<any> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete(`${this.configuration.basePath}/account/pendingEnrollmentCategories/${pendingEnrollmentCategoryId}`, {
            headers: headers,
        });
    }
    /**
     * Method to retrieve call center based on mpGroup
     * @param mpGroup is mp group id
     * @param expand is expand param
     */
    getAccountCallCenters(mpGroup?: number, expand?: string): Observable<AccountCallCenter[]> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        if (expand) {
            params = params.append("expand", expand);
        }
        return this.httpClient.get<AccountCallCenter[]>(`${this.configuration.basePath}/account/callCenters`, {
            headers: headers,
            params: params,
        });
    }
    getAccountAdmin(adminId: number, mpGroup: string, expand: string): Observable<any> {
        const params = new HttpParams().set("expand", expand);
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<any>(`${this.configuration.basePath}/account/admins/${adminId}`, {
            headers: headers,
            params: params,
        });
    }

    getAccountCallCenter(callCenterId: number, mpGroup: string, expand?: string): Observable<AccountCallCenter> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        if (expand) {
            params = params.append("expand", expand);
        }
        return this.httpClient.get<AccountCallCenter>(`${this.configuration.basePath}/account/callCenters/${callCenterId}`, {
            headers: headers,
            params: params,
        });
    }

    /**
     * Get calling schedules required by inbound 8x8 virtual call centers.
     *
     * @param callCenterId account call center id
     * @param mpGroupId group id
     * @returns observable of the calling schedule if it exists
     */
    getAccountCallCenterSchedule(callCenterId: number, mpGroupId: string): Observable<CallingSchedule[]> {
        const headers = new HttpHeaders().set("MP-Group", mpGroupId);

        return this.httpClient.get<CallingSchedule[]>(`${this.configuration.basePath}/account/callCenters/schedule/${callCenterId}`, {
            headers,
        });
    }

    getAccountThirdPartyPlatformWorksheet(mpGroup: number, thirdPartyPlatformId: number, docType: string): Observable<any> {
        const headers = new HttpHeaders({ "Content-Type": `application/${docType}` })
            .set("MP-Group", mpGroup ? mpGroup.toString() : "")
            .set("Accept", `application/${docType}`);
        return this.httpClient.get<any>(`${this.configuration.basePath}/account/thirdPartyPlatforms/${thirdPartyPlatformId}/worksheet`, {
            headers: headers,
            responseType: "blob" as "json",
            observe: "body",
        });
    }

    deleteAccountThirdPartyPlatform(mpGroup: number, thirdPartyPlatformId: number): Observable<any> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete<string>(`${this.configuration.basePath}/account/thirdPartyPlatforms/${thirdPartyPlatformId}`, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * This method is used to update account third party platform
     * @param thirdPartyPlatformId is third party platform id to update
     * @param mpGroup is group number of account
     * @param updateTPPRequest is payload request which has to be created
     * @returns an observable HttpResponse of void
     */
    updateAccountThirdPartyPlatform(
        thirdPartyPlatformId: number,
        mpGroup: number,
        updateTPPRequest: Validity,
    ): Observable<HttpResponse<void>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");

        return this.httpClient.put<void>(
            `${this.configuration.basePath}/account/thirdPartyPlatforms/${thirdPartyPlatformId}`,
            updateTPPRequest,
            {
                headers: headers,
                observe: "response",
            },
        );
    }

    createAccountCallCenter(mpGroup: string, accountCallCenter: AccountCallCenter): Observable<HttpResponse<unknown>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<unknown>(`${this.configuration.basePath}/account/callCenters`, accountCallCenter, {
            headers: headers,
            observe: "response",
        });
    }

    updateAccountCallCenter(callCenterId: number, mpGroup: string, accountCallCenter: AccountCallCenter): Observable<unknown> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<unknown>(`${this.configuration.basePath}/account/callCenters/${callCenterId}`, accountCallCenter, {
            headers: headers,
        });
    }
    /**
     *  method to delete call center
     * @param callCenterId is the call center id
     * @param mpGroup mp group id
     * @returns Observable of HttpResponse of void
     */
    deleteAccountCallCenter(callCenterId: number, mpGroup?: number): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete<HttpResponse<void>>(`${this.configuration.basePath}/account/callCenters/${callCenterId}`, {
            headers: headers,
        });
    }
    getAccountContactTypes(): Observable<AccountContactType[]> {
        return this.httpClient.get<AccountContactType[]>(`${this.configuration.basePath}/account/contactTypes`);
    }

    getAccountContacts(expand?: string): Observable<AccountContacts[]> {
        const headers = new HttpHeaders().set("MP-Group", "");
        let params = new HttpParams();
        if (expand) {
            params = params.append("expand", expand);
        }
        return this.httpClient.get<AccountContacts[]>(`${this.configuration.basePath}/account/contacts`, {
            headers: headers,
            params: params,
        });
    }

    getAccountContact(mpGroup: string, contactId: string, expand?: string): Observable<AccountContacts> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        if (expand) {
            params = params.append("expand", expand);
        }
        return this.httpClient.get<AccountContacts>(`${this.configuration.basePath}/account/contacts/${contactId}`, {
            headers: headers,
            params: params,
        });
    }

    addAccountContact(mpGroup: string, contactInfo: any): Observable<AccountContacts> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<AccountContacts>(`${this.configuration.basePath}/account/contacts`, contactInfo, {
            headers: headers,
        });
    }

    updateAccountContact(mpGroup: string, contactId: string, contactInfo: any): Observable<AccountContacts> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<AccountContacts>(`${this.configuration.basePath}/account/contacts/${contactId}`, contactInfo, {
            headers: headers,
        });
    }

    /**
     * This method is used to delete account contact
     * @param mpGroup is group number of account
     * @param contactId for the contact which needs to be removed
     * @returns an observable HttpResponse of void
     */
    deleteAccountContact(mpGroup: string, contactId: string): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete<HttpResponse<void>>(`${this.configuration.basePath}/account/contacts/${contactId}`, {
            headers: headers,
        });
    }

    getAudienceGroupings(): Observable<AbstractAudience[]> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");
        return this.httpClient.get<any[]>(`${this.configuration.basePath}/account/audienceGroupings`, {
            headers,
        });
    }

    getAudienceGrouping(audienceGroupingId: number): Observable<any[]> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");
        return this.httpClient.get<any[]>(`${this.configuration.basePath}/account/audienceGroupings/${audienceGroupingId}`, {
            headers,
        });
    }

    createAudienceGrouping(audienceObject: AudienceGrouping, mpGroup?: number): Observable<HttpResponse<unknown>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup != null ? mpGroup.toString() : "");

        return this.httpClient.post<any>(`${this.configuration.basePath}/account/audienceGroupings`, audienceObject, {
            headers: headers,
            observe: "response",
        });
    }

    addAudienceToAudienceGrouping(audienceGroupingId: number, audienceObject: AudienceGrouping, mpGroup?: number): Observable<any> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup != null ? mpGroup.toString() : "",
            },
        };
        return this.httpClient.post<any>(
            `${this.configuration.basePath}/account/audienceGroupings/${audienceGroupingId}`,
            audienceObject,
            httpOptions,
        );
    }

    removeAudienceFromAudienceGrouping(audienceGroupingId: number, audienceId: number, mpGroup?: number): Observable<any> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup != null ? mpGroup.toString() : "");
        return this.httpClient.delete(`${this.configuration.basePath}/account/audienceGroupings/${audienceGroupingId}/${audienceId}`, {
            headers: headers,
        });
    }
    getAudience(audienceGroupingId: number, audienceId: number): Observable<any> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");

        return this.httpClient.get<any>(`${this.configuration.basePath}/account/audienceGroupings/${audienceGroupingId}/${audienceId}`, {
            headers,
        });
    }

    createFlexDollar(flexDollarObject: FlexDollar, mpGroup: number): Observable<any> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.post<any>(`${this.configuration.basePath}/account/flexDollars`, flexDollarObject, httpOptions);
    }

    getFlexDollars(mpGroup: string, expand: string, useUnapproved: boolean = false): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");

        const params = new HttpParams().set("useUnapproved", useUnapproved.toString()).set("expand", expand);
        return this.httpClient.get<any>(`${this.configuration.basePath}/account/flexDollars`, {
            headers: this.defaultHeaders,
            params: params,
        });
    }
    /**
     * @description to return list of flexdollars of specific member
     * @param memberId  id of current member
     * @param mpGroup  id of current account
     * @return list of flexdollars
     */
    getFlexDollarsOfMember(memberID: number, mpGroup?: string): Observable<MemberFlexDollar[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        if (memberID) {
            return this.httpClient.get<MemberFlexDollar[]>(`${this.configuration.basePath}/members/${memberID}/flexDollars`, {
                headers: headers,
            });
        }
        return of([]);
    }
    getFlexDollar(flexDollarId: number, mpGroup: string, useUnapproved: boolean = false): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().set("useUnapproved", useUnapproved.toString());
        return this.httpClient.get<any>(`${this.configuration.basePath}/account/flexDollars/${flexDollarId}`, {
            headers: this.defaultHeaders,
            params: params,
        });
    }

    updateFlexDollar(flexDollarId: number, flexDollarObject: FlexDollar, mpGroup: number): Observable<any> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.put<any>(
            `${this.configuration.basePath}/account/flexDollars/${flexDollarId}`,
            flexDollarObject,
            httpOptions,
        );
    }

    deleteFlexDollar(flexDollarId: number, mpGroup: number): Observable<HttpResponse<any>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");

        return this.httpClient.delete(`${this.configuration.basePath}/account/flexDollars/${flexDollarId}`, {
            headers: headers,
            observe: "response",
        });
    }
    getDirectAccount(producerId?: number): Observable<Accounts> {
        const getDirectUrl = `${this.configuration.basePath}/account/direct`;
        if (producerId) {
            const params = new HttpParams().set("optionalProducerId", producerId.toString());
            return this.httpClient.get<Accounts>(getDirectUrl, {
                params: params,
            });
        }
        return this.httpClient.get<Accounts>(getDirectUrl);
    }
    createDirectAccount(requestBody: SitCode, producerId?: number): Observable<unknown> {
        const createDirectUrl = `${this.configuration.basePath}/account/direct`;
        if (producerId) {
            const params = new HttpParams().set("optionalProducerId", producerId.toString());
            return this.httpClient.post(createDirectUrl, requestBody, {
                params: params,
            });
        }
        return this.httpClient.post(createDirectUrl, requestBody);
    }
    addCallCenterAgentToCallCenterAccount(callCenterId: number, producerId: number, mpGroup: number): Observable<any> {
        const httpOptions = {
            params: {},
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.post<any>(
            `${this.configuration.basePath}/account/callCenters/${callCenterId}/producers/${producerId}`,
            {},
            httpOptions,
        );
    }
    getGroupAttributesByName(groupAttributeNames: string[], mpGroup?: number): Observable<GroupAttribute[]> {
        const httpOptions = {
            params: {
                groupAttributeNames,
            },
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<GroupAttribute[]>(`${this.configuration.basePath}/account/groupAttributes`, httpOptions);
    }
    createGroupAttribute(groupAttribute: GroupAttribute): Observable<HttpResponse<unknown>> {
        const headers = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.post<HttpResponse<unknown>>(`${this.configuration.basePath}/account/groupAttributes`, groupAttribute, {
            headers,
            observe: "response",
        });
    }
    getGroupAttribute(groupAttributeId: number): Observable<GroupAttribute> {
        const headers = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.get<GroupAttribute>(`${this.configuration.basePath}/account/groupAttributes/${groupAttributeId}`, {
            headers,
        });
    }

    updateGroupAttribute(groupAttributeId: number, groupAttribute: GroupAttribute): Observable<HttpResponse<unknown>> {
        const headers = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.put<HttpResponse<unknown>>(
            `${this.configuration.basePath}/account/groupAttributes/${groupAttributeId}`,
            groupAttribute,
            { headers, observe: "response" },
        );
    }
    /**
     * This function gets the wellthie credential
     * @param accessedFrom is string indicating where is it accessed from.
     * @param productId is the product id.
     * @return Observable<WellthieDatas> consisting data to access wellthie portal
     */
    getWellthieCredentials(accessedFrom?: string, productId?: number): Observable<WellthieDatas> {
        let params = new HttpParams();
        if (accessedFrom) {
            params = params.append("accessedFrom", accessedFrom);
        }
        if (productId) {
            params = params.append("productId", productId.toString());
        }
        return this.httpClient.get<WellthieDatas>(`${this.configuration.basePath}/account/wellthie/credentials`, {
            params: params,
        });
    }
    /**
     * This function deactivates an admin for a particular account
     * @param adminId is the id of the admin who needs to get deactivated
     * @returns Observable<HttpResponse<unknown>>
     */
    deactivateAdmin(adminId: number): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");
        return this.httpClient.post<HttpResponse<unknown>>(`${this.configuration.basePath}/account/admins/${adminId}/deactivate`, "", {
            headers: headers,
            observe: "response",
        });
    }
    /**
     * This function reactivates an admin for a particular account
     * @param adminId is the id of the admin who needs to get reactivated
     * @returns Observable<HttpResponse<unknown>>
     */
    reactivateAdmin(adminId: number): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");
        return this.httpClient.post<HttpResponse<unknown>>(`${this.configuration.basePath}/account/admins/${adminId}/reactivate`, "", {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Function to call importProducerViaTPI API. Either npn or email is required.
     * @param {string} npn Agent's NPN
     * @param {string} email Agent's email
     * @param {number} [mpGroup] Group ID
     * @returns {Observable<HttpResponse<void>>} Post API call.
     */
    importProducerViaTPI(npn: string, email: string, mpGroup?: number): Observable<HttpResponse<void>> {
        const header: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let param = new HttpParams();
        if (npn) {
            param = param.append("npn", npn);
        } else {
            param = param.append("email", email);
        }
        const apiEndPoint = `${this.configuration.basePath}/account/producers/tpiImport`;
        return this.httpClient.post<void>(
            apiEndPoint,
            {},
            {
                headers: header,
                params: param,
                observe: "response",
            },
        );
    }

    /**
     * Function to call enableProducerAssistedTpiSSO API with producerId is required.
     * @param producerId Agent's producerId
     * @returns {Observable<TpiUserDetail>} Put API call.
     */
    enableProducerAssistedTpiSSO(producerId: number): Observable<TpiUserDetail> {
        const apiEndPoint = `${this.configuration.basePath}/auth/sso/tpi/producer/${producerId}`;
        return this.httpClient.put<TpiUserDetail>(apiEndPoint, {});
    }
    /**
     * This method is used to get third party platform preview items
     * @param thirdPartyPlatformId is third party platform id for which we have get preview
     * @param mpGroup is group number of the account
     * @returns an observable which contains inEligiblePlans, affectsBenefitOffering and earliestEnrollmentStartDate
     */
    getThirdPartyPlatformPreview(thirdPartyPlatformId: number, mpGroup?: string): Observable<ThirdPartyPlatformPreview> {
        const header: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params: HttpParams = new HttpParams().set("thirdPartyPlatformId", thirdPartyPlatformId.toString());
        return this.httpClient.get<ThirdPartyPlatformPreview>(`${this.configuration.basePath}/account/thirdPartyPlatforms/preview`, {
            headers: header,
            params: params,
        });
    }
    /**
     * This method clears any pending plan offerings while we close the modal.
     * @param mpGroup sets the mpGroup
     * @returns Observable of void
     */
    clearPendingElements(mpGroup?: number): Observable<void> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<void>(`${this.configuration.basePath}/account/clearPendingElements`, "", {
            headers,
        });
    }

    /**
     * This method is used to get list of case builders for a group
     * @param mpGroup is group number of the account
     * @returns an observable of array of case builders
     */
    getAccountCaseBuilders(mpGroup?: string): Observable<CaseBuilder[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().set("expand", "caseBuilderId");
        return this.httpClient.get<CaseBuilder[]>(`${this.configuration.basePath}/account/caseBuilders`, { headers, params });
    }

    /**
     * This method is used to create case builder account
     * @param mpGroup is group number of account
     * @param caseBuilderRequest is payload request which has to be created
     * @returns an observable HttpResponse of void
     */
    createCaseBuilder(mpGroup: string, caseBuilderRequest: CaseBuilderRequest): Observable<HttpResponse<void>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<void>(`${this.configuration.basePath}/account/caseBuilders`, caseBuilderRequest, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * This method is used to delete case builder account
     * @param mpGroup is group number of account
     * @param accountCaseBuilderId is the accountCaseBuilder id
     * @returns an observable HttpResponse of void
     */
    deleteAccountCaseBuilder(mpGroup: string, accountCaseBuilderId: number): Observable<void> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete<void>(`${this.configuration.basePath}/account/caseBuilders/${accountCaseBuilderId}`, {
            headers: headers,
        });
    }

    /**
     * This method is used to update case builder
     * @param mpGroup is group number of account
     * @param accountCaseBuilderId is the accountCaseBuilder id
     * @param caseBuilderRequest is payload request which has to be created
     * @returns an observable HttpResponse of void
     */
    updateAccountCaseBuilder(mpGroup: string, accountCaseBuilderId: number, caseBuilderRequest: CaseBuilderRequest): Observable<void> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<void>(
            `${this.configuration.basePath}/account/caseBuilders/${accountCaseBuilderId}`,
            caseBuilderRequest,
            {
                headers: headers,
            },
        );
    }

    /**
     * Service to fetch getCaseBuilderAdmins from API
     * @param mpGroup group id
     * @returns CaseBuilderAdmin Observable
     */
    getCaseBuilders(): Observable<CaseBuilderAdmin[]> {
        return this.httpClient.get<CaseBuilderAdmin[]>(`${this.configuration.basePath}/static/caseBuilders`);
    }
}
