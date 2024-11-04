import { MemberFullProfile } from "./models/member-full-profile.model";
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Observable, BehaviorSubject, Subject, of, throwError } from "rxjs";
import { Configuration } from "../configuration";
import { BASE_PATH } from "../variables";
import {
    DependentContact,
    MemberClassType,
    MemberClassTypesResponse,
    MemberIdentifier,
    MemberIdentifierType,
    MemberRegionTypesResponse,
    SearchMembers,
    MemberDependentContact,
    Enrollment,
    DependentVerification,
    ValidateMemberProfile,
    PdaForm,
    AuditEnrollment,
    AllCompletedPDAForm,
    MemberIdentifierTypeIDs,
    MemberQualifierType,
    MemberQualifier,
} from "./models";
import { CustomHttpUrlEncodingCodec } from "../encoder";
import { PageableResponse } from "../shared";
import {
    RiskClass,
    Salary,
    EnrollmentMethod,
    MemberListItem,
    VerifiedAddress,
    PersonalAddress,
    MemberBeneficiary,
    Gender,
    MemberProfile,
    MemberDependent,
    MemberContact,
    AddPayment,
    UpdatePcrPayment,
    MemberQualifyingEvent,
    EbsPaymentRecord,
} from "@empowered/constants";
import { EnrollmentMethodType } from "../enrollments";
import { FormType } from "./enums";
import { ReviewAflacAlwaysModalData } from "./models/review-aflac-always-modal.data";

/**
 * value - should be 'true' or 'false' string
 */
export interface GenderDetails {
    for: string;
    value: string;
}

@Injectable({
    providedIn: "root",
})
export class MemberService {
    defaultHeaders = new HttpHeaders();
    configuration = new Configuration();
    headers = new HttpHeaders();
    params = new HttpParams();
    protected basePath = "/api";
    isUpdated = new BehaviorSubject<any>({ isUpdated: false });
    isUpdateMemberList = new BehaviorSubject<any>({ isUpdateMemberList: true });
    wizardCurrentTab$ = new BehaviorSubject<number>(0);
    wizardTabMenu?: any[];
    private readonly firstName$ = new BehaviorSubject<string>("");
    currentFirstName = this.firstName$.asObservable();
    private readonly lastName$ = new BehaviorSubject<string>("");
    currentLastName = this.lastName$.asObservable();
    private readonly hireDate$ = new BehaviorSubject<string>("");
    private readonly submitDependentQuasi$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    isSaveDependentClicked: Observable<boolean> = this.submitDependentQuasi$.asObservable();
    private readonly openTpiReinstatement$: Subject<boolean> = new Subject<boolean>();
    isDependentAdded: Observable<boolean> = this.openTpiReinstatement$.asObservable();
    private readonly completedCartData$ = new BehaviorSubject<number[]>([]);

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

    updateQLEList(value: boolean): void {
        this.isUpdated.next(value);
    }

    updateMemberList(value: boolean): void {
        this.isUpdateMemberList.next(value);
    }

    /**
     * This is similar to searchMember() method. API will send count of active members of the group in the header.
     * This method will observe the response to capture active-count from the response header.
     * @param any the optional property to set mpGroup and other required params
     */
    searchMembersWithActiveCount(mpGroup?: any): Observable<HttpResponse<SearchMembers>> {
        const param = this.setSearchMemberParams(mpGroup || null);
        return this.httpClient.get<any>(`${this.configuration.basePath}/members/search`, {
            headers: this.headers,
            params: param,
            observe: "response",
        });
    }

    /**
     * set params required for search member call
     * @param any the optional property to set mpGroup and other required params
     * @returns param of type HttpParams
     */
    setSearchMemberParams(mappedGroupId?: { payload: { mpGroup: string }; searchHeaderObj: any }): HttpParams {
        let params = new HttpParams({ encoder: new CustomHttpUrlEncodingCodec() });

        const mpGroup = mappedGroupId?.payload?.toString();

        const searchHeaderParamObj = mappedGroupId?.searchHeaderObj;

        this.headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");

        if (searchHeaderParamObj) {
            for (const key in searchHeaderParamObj) {
                if (searchHeaderParamObj[key]) {
                    const value = searchHeaderParamObj[key];
                    params = params.set(key, value ? value.toString() : "");
                }
            }
        }

        return params;
    }

    /**
     * Search for the members on the accounts
     * @param any the optional property to set mpGroup and other required params
     */
    searchMembers(mpGroup?: any): Observable<SearchMembers> {
        const param = this.setSearchMemberParams(mpGroup || null);
        return this.httpClient.get<any>(`${this.configuration.basePath}/members/search`, {
            headers: this.headers,
            params: param,
        });
    }

    /**
     * set the reinstatement pop up based on dependents added for TPI
     * @param status reinstatement pop up status
     */
    setReinstatementPopupStatus(status: boolean): void {
        this.openTpiReinstatement$.next(status);
    }

    /**
     * get reinstatement pop up status
     * @return observable of pop up status
     */
    getReinstatementPopupStatus(): Observable<boolean> {
        return this.isDependentAdded;
    }

    /**
     * Search for the members on the accounts (this is the correctly implemented api service function, however the old function
     * will require quite a lot of refactoring to replace)
     *
     * @param property the optional property on which to perform a search
     * @param value the value of the optional property on which to perform a search. note: this should be able to include a
     * comma-separated list of values
     * @param filter filter to apply to the results
     * @param page the page of results to receive
     * @param size the size of the result set
     * @param search filter the results on a full name (first name + " " + last name) or employeeId match
     */
    _searchMembers(
        property?: string,
        value?: string,
        filter?: string,
        page?: string,
        size?: string,
        search?: string,
    ): Observable<PageableResponse<MemberListItem>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        let params: HttpParams = new HttpParams();
        if (property) {
            params = params.set("property", property);
        }
        if (value) {
            params = params.set("value", value);
        }
        if (filter) {
            params = params.set("filter", filter);
        }
        if (page) {
            params = params.set("page", page);
        }
        if (size) {
            params = params.set("size", size);
        }
        if (search) {
            params = params.set("search", search);
        }
        return this.httpClient.get<PageableResponse<MemberListItem>>(`${this.configuration.basePath}/members/search`, {
            headers: headers,
            params: params,
        });
    }

    createMember(createMember: MemberProfile, mpGroup: number): Observable<HttpResponse<unknown>> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<MemberProfile>(this.configuration.basePath + "/members", createMember, {
            headers: this.defaultHeaders,
            observe: "response",
        });
    }

    getMember(memberId: MemberProfile["id"], fullProfile: boolean = false, mpGroup?: string): Observable<HttpResponse<MemberProfile>> {
        if (!memberId) {
            return throwError("Member Id does not exist");
        }
        const memberVal: any = memberId;
        const apiEndPoint = this.configuration.basePath + "/members/" + memberVal;
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().set("fullProfile", fullProfile.toString());
        return this.httpClient.get<MemberProfile>(apiEndPoint, {
            headers: headers,
            params: params,
            observe: "response",
        });
    }

    /**
     * function to update member data
     * @param addMemberModel: MemberProfile - the member data to be updated
     * @param MpGroup?: string - mp group value
     * @param stateMemberId?: string - member id
     * @param crosscheckHoursPerWeek?: boolean - flag to check if hours per week needs to be compared
     * @returns Observable<any> - returns observable from response
     */
    updateMember(
        addMemberModel: MemberProfile,
        MpGroup?: string,
        stateMemberId?: string,
        crosscheckHoursPerWeek?: boolean,
    ): Observable<any> {
        let params: HttpParams = new HttpParams();
        const { id: memberId } = addMemberModel;
        const memberVal = memberId ? memberId : stateMemberId;
        // ToDo: MP-Group will be changed to single entry point
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", MpGroup ? MpGroup.toString() : "");
        if (crosscheckHoursPerWeek) {
            params = params.append("crosscheckHoursPerWeek", crosscheckHoursPerWeek.toString());
        }
        const apiEndPoint = this.configuration.basePath + "/members/" + memberVal;
        return this.httpClient.put<any>(apiEndPoint, { ...addMemberModel }, { headers: headers, params: params });
    }

    getMemberContacts(memberId: MemberProfile["id"], mpGroup?: string): Observable<MemberContact[]> {
        const memberVal: any = memberId;
        const apiEndPoint = this.configuration.basePath + "/members/" + memberVal + "/contacts";
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<MemberContact[]>(apiEndPoint, {
            headers: headers,
        });
    }

    getMemberContact(memberId: MemberProfile["id"], contactType: string, mpGroup: string): Observable<any> {
        if (!memberId) {
            return throwError("Member Id does not exist");
        }
        const memberVal: any = memberId;
        const apiEndPoint = this.configuration.basePath + "/members/" + memberVal + "/contacts/" + contactType;
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<MemberContact>(apiEndPoint, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * This function is used to create and update member contact
     * @param memberId member id
     * @param contactType type of contact
     * @param saveMemberContact member contact details
     * @param mpGroup mpGroup
     * @param contactId contact id  required only if we are updating contact.
     * @returns {Observable<void>}
     */
    saveMemberContact(
        memberId: MemberProfile["id"],
        contactType: string,
        saveMemberContact: MemberContact,
        mpGroup: string,
        contactId?: number,
    ): Observable<void> {
        let params = new HttpParams();
        if (contactId) {
            params = params.append("contactId", contactId.toString());
        }
        const memberVal: any = memberId;
        const apiEndPoint = this.configuration.basePath + "/members/" + memberVal + "/contacts/" + contactType;
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<void>(apiEndPoint, saveMemberContact, { headers: headers, params: params });
    }

    // TODO: Clean up application to support a return type of Observable<Salary[]>
    getSalaries(memberId: MemberProfile["id"], masked: boolean, mpGroup: string): Observable<any> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const memberVal: any = memberId;
        const apiEndPoint = this.configuration.basePath + "/members/" + memberVal + "/salaries";
        const params = new HttpParams().set("masked", masked.toString());
        return this.httpClient.get<Salary[]>(apiEndPoint, {
            headers: headers,
            params: params,
        });
    }

    getSalary(memberId: MemberProfile["id"], masked: boolean, salaryId: Salary["id"], mpGroup: string): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const memberVal: any = memberId;
        const salaryVal: any = salaryId;
        const params = new HttpParams().set("masked", masked.toString());
        const apiEndPoint = this.configuration.basePath + "/members/" + memberVal + "/salaries/" + salaryVal;
        return this.httpClient.get<Salary>(apiEndPoint, {
            headers: this.defaultHeaders,
            params: params,
        });
    }

    createSalary(memberId: MemberProfile["id"], createSalary: Salary, mpGroup: string): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const memberVal: any = memberId;
        const apiEndPoint = this.configuration.basePath + "/members/" + memberVal + "/salaries";
        return this.httpClient.post<string>(apiEndPoint, createSalary, {
            headers: this.defaultHeaders,
            observe: "response",
        });
    }

    updateSalary(memberId: MemberProfile["id"], updateContact: Salary, mpGroup: string): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const { id: salaryId } = updateContact;
        const memberVal: any = memberId;
        const salaryVal: any = salaryId;
        const apiEndPoint = this.configuration.basePath + "/members/" + memberVal + "/salaries/" + salaryVal;
        return this.httpClient.put(
            apiEndPoint,
            { ...updateContact },
            {
                headers: this.defaultHeaders,
                observe: "response",
            },
        );
    }

    getMemberClassTypes(memberId: MemberProfile["id"]): Observable<unknown> {
        const memberVal: any = memberId;
        const apiEndPoint = this.configuration.basePath + "/members/" + memberVal + "/classTypes";
        return this.httpClient.get<MemberClassTypesResponse>(apiEndPoint, {
            headers: this.defaultHeaders,
        });
    }

    getMemberClassType(memberId: MemberProfile["id"], classTypeId: MemberClassType["id"], mpGroup: string): Observable<unknown> {
        const memberVal: any = memberId;
        const classTypeVal: any = classTypeId;
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/members/" + memberVal + "/classTypes/" + classTypeVal;
        return this.httpClient.get<MemberClassType[]>(apiEndPoint, {
            headers: this.defaultHeaders,
        });
    }

    /**
     * This function is used to update member class type
     * @param memberId member id
     * @param classTypeId class type id
     * @param updateMemberClass member class body
     * @param MpGroup mp group
     * @returns Observable<HttpResponse<void>>
     */
    updateMemberClass(
        memberId: MemberProfile["id"],
        classTypeId: MemberClassType["id"],
        updateMemberClass: MemberClassType,
        mpGroup: string,
    ): Observable<HttpResponse<void>> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/classTypes/" + classTypeId;
        return this.httpClient.post<void>(
            apiEndPoint,
            { ...updateMemberClass },
            {
                headers: this.defaultHeaders,
                observe: "response",
            },
        );
    }

    /**
     * Function to call getMemberCarrierRiskClasses API
     * @param memberId {number}
     * @param carrierId {number}
     * @param mpGroup {string}
     * @returns {Observable<RiskClass[]>}
     */
    getMemberCarrierRiskClasses(memberId: number, carrierId?: number, mpGroup?: string): Observable<RiskClass[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        if (carrierId) {
            params = params.set("carrierId", carrierId.toString());
        }
        return this.httpClient.get<RiskClass[]>(`${this.configuration.basePath}/members/${memberId}/carrierRiskClasses`, {
            headers,
            params,
        });
    }

    getMemberRegionTypes(memberId: MemberProfile["id"], mpGroup: string): Observable<MemberRegionTypesResponse> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const memberVal: any = memberId;
        const apiEndPoint = this.configuration.basePath + "/members/" + memberVal + "/regionTypes";
        return this.httpClient.get<MemberRegionTypesResponse>(apiEndPoint, {
            headers: headers,
        });
    }

    createMemberDependent(dependent: MemberDependent, memberId: MemberProfile["id"], mpGroup: number): Observable<HttpResponse<Response>> {
        const apiEndPoint = (this.configuration.basePath + "/members/{memberId}/dependents").replace(
            "{memberId}",
            memberId ? memberId.toString() : "",
        );

        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");

        return this.httpClient.post<Response>(apiEndPoint, dependent, {
            headers: this.defaultHeaders,
            observe: "response",
        });
    }

    /**
     * Function to call saveDependentContact API
     * @param contact contact details
     * @param memberId member id
     * @param dependentId dependent id
     * @param mpGroup mp group
     * @returns Observable of type HttpResponse
     */
    saveDependentContact(
        contact: DependentContact,
        memberId: MemberProfile["id"],
        dependentId: string,
        mpGroup: number,
    ): Observable<HttpResponse<Response>> {
        const apiEndPoint =
            this.configuration.basePath +
            "/members/{memberId}/dependents/{dependentId}/contact"
                .replace("{memberId}", memberId ? memberId.toString() : "")
                .replace("{dependentId}", dependentId);
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<HttpResponse<Response>>(apiEndPoint, contact, {
            headers: this.defaultHeaders,
        });
    }

    getDependentContact(memberId: number, dependentId: string, mpGroup: number): Observable<DependentContact> {
        const apiEndPoint =
            this.configuration.basePath +
            "/members/{memberId}/dependents/{dependentId}/contact"
                .replace("{memberId}", memberId ? memberId.toString() : "")
                .replace("{dependentId}", dependentId);
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<DependentContact>(apiEndPoint, { headers: this.defaultHeaders });
    }

    updateMemberDependent(
        dependentDetails: MemberDependent,
        memberId: MemberProfile["id"],
        dependentId: string,
        mpGroup?: number,
    ): Observable<unknown> {
        const apiEndPoint =
            this.configuration.basePath +
            "/members/{memberId}/dependents/{dependentId}"
                .replace("{memberId}", memberId ? memberId.toString() : "")
                .replace("{dependentId}", dependentId.toString());
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put(apiEndPoint, dependentDetails, { headers: this.defaultHeaders });
    }

    getMemberDependents(memberId: MemberDependent["id"], fullProfile: boolean = true, mpGroup?: number): Observable<MemberDependent[]> {
        const apiEndPoint =
            this.configuration.basePath +
            "/members/{memberId}/dependents?fullProfile={fullProfile}"
                .replace("{memberId}", memberId ? memberId.toString() : "")
                .replace("{fullProfile}", fullProfile ? "true" : "false");
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<MemberDependent[]>(apiEndPoint, {
            headers: headers,
        });
    }

    getMemberDependent(memberId: number, dependentId: number, fullProfile: boolean, mpGroup?: number): Observable<MemberDependent> {
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/dependents/${dependentId}`;
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().set("fullProfile", fullProfile.toString());
        return this.httpClient.get<MemberDependent>(apiEndPoint, {
            headers: headers,
            params: params,
        });
    }

    /**
     * Function to call getMemberIdentifierTypes API
     * @returns Observable<MemberIdentifierType[]>
     */
    getMemberIdentifierTypes(): Observable<MemberIdentifierType[]> {
        return this.httpClient.get<MemberIdentifierType[]>(`${this.configuration.basePath}/members/identifierTypes`);
    }

    /**
     * Function to call getMemberIdentifierType API
     * @param identifierTypeId identifier type id {string}
     * @returns Observable<MemberIdentifierType>
     */
    getMemberIdentifierType(identifierTypeId: string): Observable<MemberIdentifierType> {
        return this.httpClient.get<MemberIdentifierType>(`${this.configuration.basePath}/members/identifierTypes/${identifierTypeId}`);
    }

    /**
     * Function to call getMemberIdentifier API
     * @param memberId member id {number}
     * @param memberIdentifierId member identifier id {number}
     * @param masked whether to apply mask to API call {boolean}
     * @param mpGroup mp group {number}
     * @returns Observable
     */
    getMemberIdentifier(
        memberId: MemberDependent["id"],
        memberIdentifierId: number,
        masked: boolean = false,
        mpGroup: number,
    ): Observable<MemberIdentifier[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().set("masked", masked.toString());
        return this.httpClient.get<MemberIdentifier[]>(
            `${this.configuration.basePath}/members/${memberId}/identifiers/${memberIdentifierId}`,
            {
                headers: headers,
                params: params,
            },
        );
    }

    /**
     * This function is used to save member identifier
     * @param memberIdentifier object containing id, memberIdentifierTypeId, value, version {MemberIdentifier}
     * @param mpGroup Mpgroup {number}
     * @returns Observable<MemberIdentifier>
     */
    saveMemberIdentifier(memberIdentifier: MemberIdentifier, mpGroup: number): Observable<MemberIdentifier> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberIdentifier.id}/identifiers`;
        return this.httpClient.post<MemberIdentifier>(apiEndPoint, memberIdentifier, {
            headers: this.defaultHeaders,
        });
    }

    /**
     * This function is used to update member identifier
     * @param memberIdentifier object containing id, memberIdentifierTypeId, value, version {MemberIdentifier}
     * @param mpGroup Mpgroup {number}
     * @returns Observable<MemberIdentifier>
     */
    updateMemberIdentifier(memberIdentifier: MemberIdentifier, mpGroup: number): Observable<MemberIdentifier> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        // eslint-disable-next-line max-len
        const apiEndPoint = `${this.configuration.basePath}/members/${memberIdentifier.id}/identifiers/${memberIdentifier.memberIdentifierTypeId}`;
        return this.httpClient.put<MemberIdentifier>(apiEndPoint, memberIdentifier, {
            headers: this.defaultHeaders,
        });
    }

    /**
     * This method saves the dependent identifier
     * @param memberId member id
     * @param dependentId dependent id
     * @param identifierTypeId identifier type id
     * @param mpGroup group id
     * @param ssn ssn number
     * @param masked if masked or not
     * @returns Observable of http response object
     */
    saveDependentIdentifier(
        memberId: MemberDependent["id"],
        dependentId: string,
        identifierTypeId: number,
        mpGroup: number,
        ssn: string,
        masked: boolean = false,
    ): Observable<unknown> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let apiEndPoint = `${this.configuration.basePath}/members/${memberId}/dependents/${dependentId}/identifiers/${identifierTypeId}`;
        if (!masked) {
            apiEndPoint = `${apiEndPoint}?masked=false`;
        }
        return this.httpClient.put<unknown>(apiEndPoint, ssn.toString(), {
            headers: this.defaultHeaders,
        });
    }

    /**
     * This method fetches dependent identifier
     * @param memberId member id
     * @param dependentId dependent id
     * @param identifierTypeId identifier type id
     * @param mpGroup group id
     * @param masked if masked or not
     * @returns Observable of string
     */
    getDependentIdentifier(
        memberId: MemberDependent["id"],
        dependentId: string,
        identifierTypeId: number,
        mpGroup: number,
        masked: boolean = true,
    ): Observable<string> {
        if (!dependentId) {
            return throwError("dependentId does not exist");
        }
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().set("masked", masked.toString());
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/dependents/${dependentId}/identifiers/${identifierTypeId}`;
        return this.httpClient.get(apiEndPoint, {
            headers: this.defaultHeaders,
            params: params,
            responseType: "text",
        });
    }

    deleteMemberDependent(memberId: MemberDependent["id"], dependentId: string, mpGroup: number): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint =
            this.configuration.basePath +
            "/members/{memberId}/dependents/{dependentId}"
                .replace("{memberId}", memberId ? memberId.toString() : "")
                .replace("{dependentId}", dependentId.toString());
        return this.httpClient.delete<any>(apiEndPoint, {
            headers: this.defaultHeaders,
        });
    }

    saveMemberDependentContact = (
        dependentContact: MemberDependentContact,
        memberId: MemberProfile["id"],
        dependentId: string,
        mpGroup: number,
    ): Observable<any> => {
        const memberVal: any = memberId;
        const apiEndPoint =
            this.configuration.basePath +
            "/members/{memberId}/dependents/{dependentId}/contact"
                .replace("{memberId}", memberVal.toString())
                .replace("{dependentId}", dependentId);
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put(apiEndPoint, dependentContact, { headers: this.defaultHeaders });
    };

    getMemberBeneficiaries(memberId: number, mpGroup: number, maskSsn: boolean): Observable<MemberBeneficiary[]> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/beneficiaries?maskSsn=${maskSsn}`;
        return this.httpClient.get<MemberBeneficiary[]>(apiEndPoint, {
            headers: this.defaultHeaders,
        });
    }

    createMemberBeneficiary(memberId: number, mpGroup: number, beneficiary: any): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/beneficiaries`;
        return this.httpClient.post<any>(apiEndPoint, beneficiary, {
            headers: this.defaultHeaders,
            observe: "response",
        });
    }

    /**
     * This method fetches member beneficiary info
     * @param memberId id of member
     * @param mpGroup group id
     * @param beneficiaryId beneficiary id
     * @param maskSsn boolean value if ssn has to be masked or not
     * @returns observable of member beneficiary info
     */
    getMemberBeneficiary(memberId: number, mpGroup: number, beneficiaryId: number, maskSsn: boolean): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/beneficiaries/${beneficiaryId}?maskSsn=${maskSsn}`;
        return this.httpClient.get<any>(apiEndPoint, {
            headers: this.defaultHeaders,
        });
    }

    updateMemberBeneficiary(memberId: number, mpGroup: number, beneficiaryId: number, beneficiary: any): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/beneficiaries/${beneficiaryId}`;
        return this.httpClient.put<any>(apiEndPoint, beneficiary, {
            headers: this.defaultHeaders,
        });
    }

    deleteMemberBeneficiary(memberId: number, mpGroup: number, beneficiaryId: number): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/beneficiaries/${beneficiaryId}`;
        return this.httpClient.delete<any>(apiEndPoint, {
            headers: this.defaultHeaders,
        });
    }

    deleteDependentIdentifier(
        memberId: MemberDependent["id"],
        dependentId: string,
        identifierTypeId: number,
        mpGroup: number,
    ): Observable<unknown> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint =
            this.configuration.basePath +
            "/members/{memberId}/dependents/{dependentId}/identifiers/{identifierTypeId}"
                .replace("{memberId}", memberId ? memberId.toString() : "")
                .replace("{dependentId}", dependentId.toString())
                .replace("{identifierTypeId}", identifierTypeId.toString());
        return this.httpClient.delete<unknown>(apiEndPoint, {
            headers: this.defaultHeaders,
        });
    }

    getMemberDependentContact(memberId: number, dependentId: string, mpGroup: number): Observable<any> {
        const apiEndPoint =
            this.configuration.basePath +
            "/members/{memberId}/dependents/{dependentId}/contact"
                .replace("{memberId}", memberId ? memberId.toString() : "")
                .replace("{dependentId}", dependentId);
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<any>(apiEndPoint, { headers: this.defaultHeaders });
    }

    getMemberQualifyingEvent(
        memberId: number,
        mpGroup: number,
        qualifyingEventId: MemberQualifyingEvent["id"],
    ): Observable<MemberQualifyingEvent> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().append("expand", "typeId,documentIds");
        return this.httpClient.get<MemberQualifyingEvent>(
            `${this.configuration.basePath}/members/${memberId}/qualifyingEvents/${qualifyingEventId}`,
            {
                headers: this.defaultHeaders,
                params: params,
            },
        );
    }

    /**
     * This function is used to get QLE details for selected member
     * @param memberId member id
     * @param mpGroup mpGroup Id
     * @returns Observable array of MemberQualifyingEvent interface
     */
    getMemberQualifyingEvents(memberId: number, mpGroup: number): Observable<MemberQualifyingEvent[]> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().append("expand", "typeId,documentIds");
        if (memberId) {
            return this.httpClient.get<MemberQualifyingEvent[]>(`${this.configuration.basePath}/members/${memberId}/qualifyingEvents`, {
                headers: this.defaultHeaders,
                params: params,
            });
        }
        return of([]);
    }

    createMemberQualifyingEvent(memberId: number, mpGroup: number, qleData: unknown): Observable<HttpResponse<void>> {
        this.defaultHeaders = new HttpHeaders({ "Content-Type": "application/json" }).set("MP-Group", mpGroup ? mpGroup.toString() : "");

        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/qualifyingEvents`;
        return this.httpClient.post<any>(apiEndPoint, qleData, {
            headers: this.defaultHeaders,
            observe: "response",
            responseType: "text" as "json",
        });
    }

    getQLEEnrollments(memberId: number, mpGroup: number, qualifyingEventId: number): Observable<Enrollment[]> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().append("expand", "planId,productId,currentEnrollmentId,coverageLevelId");
        return this.httpClient.get<Enrollment[]>(
            `${this.configuration.basePath}/members/${memberId}/qualifyingEvents/${qualifyingEventId}/enrollments`,
            {
                headers: this.defaultHeaders,
                params: params,
            },
        );
    }

    updateMemberQualifyingEvent(
        memberId: number,
        eventId: number,
        qleEventType: MemberQualifyingEvent,
        mpGroup: number,
    ): Observable<string> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        this.defaultHeaders.set("Content-Type", "application/json");
        return this.httpClient.put<string>(`${this.configuration.basePath}/members/${memberId}/qualifyingEvents/${eventId}`, qleEventType, {
            headers: this.defaultHeaders,
        });
    }

    deleteMemberIdentifier(memberId: MemberProfile["id"], identifierTypeId: number, mpGroup: number): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/identifiers/${identifierTypeId}`;
        return this.httpClient.delete<any>(apiEndPoint, {
            headers: this.defaultHeaders,
        });
    }

    // Used for replacing a placeholder in validation message
    getUpdatedLanguageValue(messageString: string, editMessageObject: Record<string, string>): string {
        let messageForValdiation = messageString;
        Object.entries(editMessageObject).forEach(([key, value]) => {
            messageForValdiation = messageForValdiation.replace(key, value);
        });
        return messageForValdiation;
    }

    getDependentVerificationStatus(memberId: MemberDependent["id"], dependentId: number, mpGroup: number): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get(`${this.configuration.basePath}/members/${memberId}/dependents/${dependentId}/verificationStatus`, {
            headers: this.defaultHeaders,
        });
    }

    getPaymentMethods(memberId: number, mpGroup: number): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<any>(`${this.configuration.basePath}/members/${memberId}/paymentMethods`, {
            headers: this.defaultHeaders,
        });
    }

    addPaymentMethod(memberId: number, mpGroup: number, paymentBody: any, overrideDuplicate?: boolean): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<any>(
            `${this.configuration.basePath}/members/${memberId}/paymentMethods?overrideDuplicate=${overrideDuplicate}`,
            paymentBody,
            {
                headers: this.defaultHeaders,
                observe: "response",
            },
        );
    }

    /**
     * This function is used to update the payment method
     * @param memberId member id
     * @param mpGroup mpGroup Id
     * @param paymentBody Request body for API call
     * @param paymentMethodId Id for payment method
     * @returns Observable of type HttpResponse
     */
    updatePaymentMethod(
        memberId: number,
        mpGroup: number,
        paymentBody: AddPayment,
        paymentMethodId: number,
    ): Observable<HttpResponse<void>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<void>(
            `${this.configuration.basePath}/members/${memberId}/paymentMethods/${paymentMethodId}`,
            paymentBody,
            {
                headers: headers,
                observe: "response",
            },
        );
    }

    /**
     * This function is used to update the global PCR payment method
     * @param paymentBody Request body for API call
     * @returns Observable of type HttpResponse
     */
    updatePcrPaymentMethod(paymentBody: UpdatePcrPayment): Observable<HttpResponse<void>> {
        return this.httpClient.put<void>(`${this.configuration.basePath}/tempus/updatePayment`, paymentBody, {
            observe: "response",
        });
    }

    /**
     * This function is used to delete the payment method
     * @param memberId member id
     * @param paymentMethodId Id for payment method
     * @param mpGroup mpGroup Id
     * @returns Observable of type HttpResponse
     */
    deletePaymentMethod(memberId: number, paymentMethodId: number, mpGroup: number): Observable<HttpResponse<void>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete<HttpResponse<void>>(
            `${this.configuration.basePath}/members/${memberId}/paymentMethods/${paymentMethodId}`,
            { headers: headers },
        );
    }

    /**
     * This method updates the dependent verification status
     * @param memberId member id
     * @param dependentId dependent id
     * @param verificationValue value of verification
     * @param mpGroup mpGroup Id
     * @returns Observable of http response
     */
    updateDependentVerificationStatus(
        memberId: MemberDependent["id"],
        dependentId: number,
        verificationValue: DependentVerification,
        mpGroup: number,
    ): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/dependents/${dependentId}/approveOrRejectVerification`;
        return this.httpClient.put<any>(apiEndPoint, verificationValue, {
            headers: this.defaultHeaders,
        });
    }

    getMemberNotes(memberId: number, mpGroup: number, expand?: string): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams({ encoder: new CustomHttpUrlEncodingCodec() });
        if (expand) {
            params = params.set("expand", expand);
        }
        return this.httpClient.get<any>(`${this.configuration.basePath}/members/${memberId}/notes`, {
            headers: this.defaultHeaders,
            params: params,
        });
    }

    createMemberNote(memberId: string, mpGroup: string, documentNote: any): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/notes`;
        return this.httpClient.post<any>(apiEndPoint, documentNote, {
            headers: this.defaultHeaders,
        });
    }

    updateMemberNote(memberId: string, mpGroup: string, noteId: string, documentNote: any): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/notes/${noteId}`;
        return this.httpClient.put<any>(apiEndPoint, documentNote, {
            headers: this.defaultHeaders,
        });
    }

    getMemberNote(memberId: string, mpGroup: string, noteId: string, expand?: string): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams({ encoder: new CustomHttpUrlEncodingCodec() });
        if (expand) {
            params = params.set("expand", expand);
        }
        return this.httpClient.get<any>(`${this.configuration.basePath}/members/${memberId}/notes/${noteId}`, {
            headers: this.defaultHeaders,
            params: params,
        });
    }

    deleteMemberNote(memberId: string, mpGroup: string, noteId: string): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/notes/${noteId}`;
        return this.httpClient.delete<any>(apiEndPoint, {
            headers: this.defaultHeaders,
        });
    }

    saveMemberTermination(memberId: string, mpGroup: string, termination: any): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/termination`;
        return this.httpClient.put<any>(apiEndPoint, termination, {
            headers: this.defaultHeaders,
        });
    }

    getMemberTermination(memberId: string, mpGroup: string): Observable<any> {
        this.defaultHeaders = new HttpHeaders({ "Content-Type": "application/json" }).set("MP-Group", mpGroup.toString());
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/termination`;
        return this.httpClient.get(apiEndPoint, {
            headers: this.defaultHeaders,
        });
    }

    rehireMember(memberId: string, mpGroup: string, date: string): Observable<any> {
        this.defaultHeaders = new HttpHeaders({ "Content-Type": "application/json" }).set("MP-Group", mpGroup.toString());
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/rehire`;
        return this.httpClient.post<any>(apiEndPoint, date, {
            headers: this.defaultHeaders,
        });
    }

    setMemberWizardTabMenu(tabMenu: any[]): void {
        this.wizardTabMenu = tabMenu;
    }

    getMemberWizardTabMenu(): any[] | undefined {
        return this.wizardTabMenu;
    }

    getMemberIncentives(memberId: number, mpGroup: number): Observable<any> {
        const memberVal: any = memberId;
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/members/" + memberVal + "/incentives";
        return this.httpClient.get<any>(apiEndPoint, { headers: this.defaultHeaders, observe: "response" });
    }

    getFlexDollarExceptions(memberId: number, flexDollarId: number, mpGroup: number): Observable<any> {
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/flexDollars/${flexDollarId}/exceptions`;
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<MemberDependent>(apiEndPoint, {
            headers: this.defaultHeaders,
        });
    }

    createFlexDollarException(
        memberId: number,
        flexDollarId: number,
        exceptionObject: any,
        mpGroup: number,
    ): Observable<HttpResponse<Response>> {
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/flexDollars/${flexDollarId}/exceptions`;
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<Response>(apiEndPoint, exceptionObject, {
            headers: this.defaultHeaders,
            observe: "response",
        });
    }

    getMemberFormsByType(memberId: number, formType: string, mpGroup: string, formStatus: string): Observable<any> {
        const params = new HttpParams().set("formStatus", formStatus);
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/forms/${formType}`;
        return this.httpClient.get<any>(apiEndPoint, {
            headers: this.defaultHeaders,
            params: params,
        });
    }

    downloadMemberForm(memberId: number, formType: string, formId: number, mpGroup: string): Observable<any> {
        const headers = new HttpHeaders({ "Content-Type": "application/json" })
            .set("MP-Group", mpGroup ? mpGroup.toString() : "")
            .set("Accept", "application/pdf");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/forms/${formType}/${formId}/download`;
        return this.httpClient.get(apiEndPoint, {
            headers: headers,
            responseType: "text",
            observe: "body",
        });
    }

    /**
     * Function to get all the completed PDA forms
     * @param memberId id of the employee
     * @param mpGroup group id
     * @param unsignedOnly boolean param for unsigned forms
     * @returns AllCompletedPDAForm interface
     */
    getAllCompletedForms(memberId: number, mpGroup: string, unsignedOnly: boolean = false): Observable<AllCompletedPDAForm> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        if (unsignedOnly) {
            params = params.set("unsignedOnly", "true");
        }
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/forms`;
        return this.httpClient.get<any>(apiEndPoint, {
            headers: this.defaultHeaders,
            params: params,
        });
    }

    /**
     * updates flex dollar exceptions
     * @param memberId id of the member
     * @param flexDollarId id of flex dollar
     * @param flexDollarExceptionId exception id to be updated
     * @param exceptionObject data to update exception
     * @param mpGroup mpGroup Id.
     * @returns Observable of http response
     */
    updateFlexDollarException(
        memberId: number,
        flexDollarId: number,
        flexDollarExceptionId: number,
        exceptionObject: any,
        mpGroup: number,
    ): Observable<unknown> {
        // eslint-disable-next-line max-len
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/flexDollars/${flexDollarId}/exceptions/${flexDollarExceptionId}`;
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put(apiEndPoint, exceptionObject, { headers: this.defaultHeaders });
    }

    /**
     * This method returns a verified member address
     * @params addressDetails contains the address details of the member
     * @returns VerifiedAddress
     */
    verifyMemberAddress(addressDetails: PersonalAddress): Observable<VerifiedAddress> {
        const apiEndPoint = `${this.configuration.basePath}/core/verifyAddress`;
        return this.httpClient.post<VerifiedAddress>(apiEndPoint, addressDetails);
    }

    deleteMember(mpGroup: number, memberId: number): Observable<any> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete<any>(this.configuration.basePath + `/members/${memberId}`, {
            headers: this.defaultHeaders,
        });
    }

    /**
     * Create member form by type
     * @param memberId
     * @param memberForm
     * @param formType
     * @param mpGroup
     * @returns Observable<HttpResponse<void>>
     */
    createMemberFormByType(memberId: number, memberForm: any, formType: string, mpGroup: string): Observable<HttpResponse<void>> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        memberForm.submissionMethod = this.getSubmissionMethod(memberForm.submissionMethod);
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/forms/${formType}`;
        return this.httpClient.post<void>(apiEndPoint, memberForm, {
            headers: this.defaultHeaders,
            observe: "response",
        });
    }

    /**
     * Convert enrollment method to the correct enum before sending it as a param
     * @param method Convert submission method to match the param enum
     * @returns EnrollmentMethod enum
     */
    getSubmissionMethod(method: string): EnrollmentMethod | string {
        switch (method) {
            case EnrollmentMethodType.AGENT_ASSISTED_F2F:
                return EnrollmentMethod.FACE_TO_FACE;
            case EnrollmentMethodType.VIRTUAL_F2F:
                return EnrollmentMethod.VIRTUAL_FACE_TO_FACE;
            case EnrollmentMethodType.TELEPHONE_ENROLLMENT:
                return EnrollmentMethod.HEADSET;
            default:
                return method || EnrollmentMethod.FACE_TO_FACE;
        }
    }

    signMemberForm(memberId: number, formType: string, formId: number, signature: any, mpGroup: string): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/forms/${formType}/${formId}/sign`;
        return this.httpClient.post<any>(apiEndPoint, signature, {
            headers: this.defaultHeaders,
            observe: "response",
        });
    }

    getAllCompletedMemberForms(memberId: number, mpGroup: number): Observable<any> {
        const headers = new HttpHeaders({ "Content-Type": "application/json" }).set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/forms`;
        return this.httpClient.get(apiEndPoint, { headers: headers });
    }

    changePassword(changePassword: any): Observable<any> {
        const apiEndPoint = `${this.configuration.basePath}/auth/changePassword`;
        return this.httpClient.post<Response>(apiEndPoint, changePassword);
    }

    getActivityAudits(auditStartDate: string, auditEndDate: string, memberId: number, mpGroup: number): Observable<any> {
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/audit/sessionActivities`;
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams().set("auditEndDate", auditEndDate);
        if (auditStartDate) {
            params = params.append("auditStartDate", auditStartDate);
        }
        return this.httpClient.get<any>(apiEndPoint, {
            headers: this.defaultHeaders,
            params: params,
        });
    }

    getDemographicsAudits(
        auditStartDate: string,
        auditEndDate: string,
        memberId: number,
        mpGroup: number,
        selectedDependentId: number,
        selectedChangetype: string,
    ): Observable<any> {
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/audit/demographics`;

        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams().set("auditEndDate", auditEndDate);
        if (auditStartDate) {
            params = params.append("auditStartDate", auditStartDate);
        }
        if (selectedDependentId !== 0) {
            params = params.append("dependentId", selectedDependentId.toString());
        }
        if (selectedChangetype !== "") {
            params = params.append("changeType", selectedChangetype);
        }
        return this.httpClient.get<any>(apiEndPoint, {
            headers: this.defaultHeaders,
            params: params,
        });
    }

    /**
     * gets audit enrollments observable
     * @param auditStartDate audit start date
     * @param auditEndDate  audit end date
     * @param memberId member id
     * @param mpGroup mp group
     * @param selectedProductId selected product id
     * @param selectedRecordType selected record type
     * @param includePerPayPeriodCosts include per pay period costs
     * @returns observable of audit enrollments
     */
    getEnrollmentAudits(
        auditStartDate: string,
        auditEndDate: string,
        memberId: number,
        mpGroup: number,
        selectedProductId: number,
        selectedRecordType: string,
        includePerPayPeriodCosts: boolean = false,
    ): Observable<AuditEnrollment[]> {
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/audit/enrollments`;

        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams().set("auditEndDate", auditEndDate);
        if (auditStartDate) {
            params = params.append("auditStartDate", auditStartDate);
        }
        if (selectedProductId !== 0) {
            params = params.append("productId", selectedProductId.toString());
        }
        if (selectedRecordType !== "") {
            params = params.append("recordType", selectedRecordType);
        }
        params = params.append(
            "expand",
            "auditedEnrollment.planId,auditedEnrollment.coverageLevelId,auditedEnrollment.currentEnrollmentId",
        );
        params = params.append("includePerPayPeriodCosts", includePerPayPeriodCosts.toString());
        return this.httpClient.get<any>(apiEndPoint, {
            headers: this.defaultHeaders,
            params: params,
        });
    }

    /**
     * Function to call getMemberIdentifiers API
     * @param memberId member id {number}
     * @param memberIdentifierId member identifier id {MemberIdentifierTypeIDs}
     * @param masked whether to apply mask to API call {boolean}
     * @returns Observable<MemberIdentifier[]>
     */
    getMemberIdentifiers(
        memberId: number,
        memberIdentifierTypeId: MemberIdentifierTypeIDs,
        masked: boolean = true,
    ): Observable<MemberIdentifier[]> {
        const params = new HttpParams().set("masked", masked.toString()).set("memberIdentifierTypeId", memberIdentifierTypeId.toString());
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");
        return this.httpClient.get<any>(`${this.configuration.basePath}/members/${memberId}/identifiers`, {
            headers: headers,
            params: params,
        });
    }

    registerAccountMembers(accountNumber: string): Observable<HttpResponse<unknown>> {
        const apiEndPoint = this.configuration.basePath + "/members/register?accountNumber=" + accountNumber;
        const headers: HttpHeaders = new HttpHeaders();
        return this.httpClient.post<HttpResponse<unknown>>(apiEndPoint, { headers: headers });
    }

    refactorGenders(gender: string[]): GenderDetails[] {
        const refactoredGender: GenderDetails[] = [];

        gender.forEach((type) => {
            if (type !== Gender.UNKNOWN) {
                const genderObj: GenderDetails = {
                    for: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
                    value: type,
                };
                refactoredGender.push(genderObj);
            }
        });

        return refactoredGender;
    }

    /**
     * API call to get the status of Consent
     * @memberId
     * @mpGroup
     * */
    getMemberConsent(memberId: number, mpGroup?: number): Observable<boolean> {
        const header: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/aflac/members/${memberId}/consent`;
        return this.httpClient.get<boolean>(apiEndPoint, {
            headers: header,
        });
    }

    /**
     * API call to update the status of Consent
     * @memberId
     * @mpGroup
     * */
    acceptMemberConsent(memberId: number, mpGroup?: number): Observable<HttpResponse<unknown>> {
        const header: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/aflac/members/${memberId}/consent`;
        return this.httpClient.request<HttpResponse<unknown>>("PUT", apiEndPoint, {
            headers: header,
        });
    }

    /**
     *
     * @description HTTP observable to send consent to member via email
     * @param memberId memberId of the employee
     * @param mpGroup mpGroup to which the employee belongs
     * @param email email of the employee
     * @returns {Observable<HttpResponse<unknown>>}
     * @memberof MemberService
     */
    emailMemberConsent(memberId: number, mpGroup?: number, email?: string): Observable<HttpResponse<unknown>> {
        const header: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/aflac/members/${memberId}/consent/email`;
        let params = new HttpParams({ encoder: new CustomHttpUrlEncodingCodec() });
        if (email) {
            params = params.append("email", email);
        }
        return this.httpClient.request<HttpResponse<unknown>>("POST", apiEndPoint, {
            headers: header,
            params: params,
        });
    }

    downloadActiveMemberCensus(): Observable<BlobPart> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "").set("Accept", "application/octet-stream,application/vnd.ms-excel,  application/pdf,*/*");
        return this.httpClient.get<BlobPart>(`${this.configuration.basePath}/members/download`, {
            headers: headers,
            responseType: "blob" as "json",
            observe: "body",
        });
    }

    changeFirstName(newFirstName: string): void {
        this.firstName$.next(newFirstName);
    }

    changeLastName(newLastName: string): void {
        this.lastName$.next(newLastName);
    }

    /**
     * This method will execute on click of save in dependent pop-up
     * @param isSubmitClicked will represents whether user clicked submit or not
     */
    onSubmitDependent(isSubmitClicked: boolean): void {
        this.submitDependentQuasi$.next(isSubmitClicked);
    }

    /**
     *
     * This function is called in dependent-add-edit component to update the member details.
     * @param addMemberModel contains member's full profile details
     * @param MpGroup contain mp group number
     * @param stateMemberId member id
     * @returns Observable<void>
     */
    updateFullMemberProfile(addMemberModel: MemberFullProfile, MpGroup?: string, stateMemberId?: string): Observable<void> {
        const { id: memberId } = addMemberModel;
        const memberVal = memberId ? memberId : stateMemberId;
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", MpGroup ? MpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/members/" + memberVal;
        return this.httpClient.put<void>(apiEndPoint, { ...addMemberModel }, { headers: headers });
    }

    /**
     * This method will verify member Identity before enrollment.
     * @param memberId  memberId of an employee.
     * @param aflacEicPrefs  Aflac EIC preference.
     * @param userPrefs  user preference.
     * @param systemFlowCode  enrollment method.
     * @param mpGroup  mpGroup Id.
     * @returns Observable<boolean>
     */
    verifyMemberIdentity(
        memberId: number,
        aflacEicPrefs: string,
        userPrefs: string,
        systemFlowCode: string,
        mpGroup?: string,
    ): Observable<boolean> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<boolean>(
            `${this.configuration.basePath}/members/${memberId}/identityVerification`,
            {
                aflacEicPrefs,
                userPrefs,
                systemFlowCode,
            },
            { headers: headers },
        );
    }

    /**
     * This method will validate member info
     * @param memberInfo  memberInfo to be validated
     * @param mpGroup  mpGroup Id.
     * @param tpiFlow boolean value
     * @returns { Observable<HttpResponse<void>> }
     */
    validateMember(memberInfo: ValidateMemberProfile, mpGroup?: string, tpiFlow?: boolean): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params: HttpParams = new HttpParams();
        if (tpiFlow) {
            params = params.append("tpiSsoFlow", tpiFlow.toString());
        }
        return this.httpClient.post<void>(`${this.configuration.basePath}/members/validateMember`, memberInfo, {
            headers: headers,
            observe: "response",
            params: params,
        });
    }

    /**
     * This method will validate dependent info of an employee
     * @param dependentInfo  dependent info of an employee to be validated
     * @param mpGroup  mpGroup Id.
     * @returns Observable<void>
     */
    validateDependent(dependentInfo: MemberDependent, mpGroup?: string): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<void>(`${this.configuration.basePath}/members/validateDependent`, dependentInfo, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * This method will update the member form
     * @param mpGroup  mpGroup Id.
     * @param memberId  memberId of an employee.
     * @param formType type of the form.
     * @param formId ID of the form.
     * @param form updated form data.
     * @returns Observable<HttpResponse<Response>>
     */
    updateMemberForm(
        mpGroup: string,
        memberId: number,
        formType: FormType,
        formId: number,
        form: PdaForm,
    ): Observable<HttpResponse<Response>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/forms/${formType}/${formId}`;
        return this.httpClient.put<HttpResponse<Response>>(apiEndPoint, form, {
            headers: headers,
        });
    }

    /**
     * This method will fetch the member form details
     * @param mpGroup  mpGroup Id.
     * @param memberId  memberId of an employee.
     * @param formType type of the form.
     * @param formId ID of the form.
     * @returns member form details
     */
    getMemberForm(mpGroup: string, memberId: number, formType: FormType, formId: number): Observable<PdaForm> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/forms/${formType}/${formId}`;
        return this.httpClient.get<PdaForm>(apiEndPoint, {
            headers: headers,
        });
    }

    /**
     * Setter method to set hire date.
     * @param hireDate emplotyee's hire date
     */
    set setMemberHireDate(hireDate: string) {
        this.hireDate$.next(hireDate);
    }

    /**
     * Getter method for hire date.
     * @return hire date observable of type string.
     */
    get getMemberHireDate(): Observable<string> {
        return this.hireDate$;
    }

    /**
     * sending completedCart Data
     * @param completedCartData of type number Array which holds completed cart Ids
     */
    sendApplicationCartData(completedCartData: number[]): void {
        this.completedCartData$.next(completedCartData);
    }

    receiveApplicationCartData(): Observable<number[]> {
        return this.completedCartData$.asObservable();
    }

    /**
     * Method to call ebsPaymentOnFile for a particular member
     * @param memberId Member id
     * @param mpGroup group id
     * @returns Boolean - if EBS payment is present
     */
    getEbsPaymentOnFile(memberId: number, mpGroup: number): Observable<EbsPaymentRecord> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/ebsPaymentOnFile`;
        return this.httpClient.get<EbsPaymentRecord>(apiEndPoint, {
            headers: headers,
        });
    }

    /**
     * Method to get EbsPaymentCallbackStatus for a particular member
     * @param memberId Member id
     * @param mpGroup group id
     * @returns string - callback status
     */
    getEbsPaymentCallbackStatus(memberId: number, mpGroup: string): Observable<string> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/ebsPaymentCallbackStatus`;
        return this.httpClient.get<string>(apiEndPoint, {
            headers: headers,
        });
    }

    /**
     * Method to update EbsPaymentCallbackStatus for a particular member
     * @param memberId Member id
     * @param mpGroup group id
     */
    updateEbsPaymentCallbackStatus(
        memberId: number,
        mpGroup: string,
        ebsPaymentCallbackStatus: string,
    ): Observable<HttpResponse<Response>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup : "");
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/ebsPaymentCallbackStatus`;
        const params = new HttpParams().set("ebsPaymentCallbackStatus", ebsPaymentCallbackStatus.toString());
        return this.httpClient.put<HttpResponse<Response>>(
            apiEndPoint,
            {},
            {
                headers: headers,
                params: params,
            },
        );
    }

    /**
     * Get list of all applicable MemberQualifierTypes
     * @returns Observable<MemberQualifierType[]>
     */
    getMemberQualifierTypes(): Observable<MemberQualifierType[]> {
        const apiEndPoint = `${this.configuration.basePath}/members/qualifierTypes`;
        return this.httpClient.get<MemberQualifierType[]>(apiEndPoint);
    }

    /**
     * Get MemberQualifiers for a specific member
     * @param memberId member ID
     * @param mpGroup group ID
     * @returns TODO
     */
    getMemberQualifiers(memberId: number, mpGroup: string): Observable<Record<string, MemberQualifier[]>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup);
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/qualifiers`;
        const params = new HttpParams().set("memberId", memberId);
        return this.httpClient.get<Record<string, MemberQualifier[]>>(apiEndPoint, { headers: headers, params: params });
    }

    /**
     * Get a specific MemberQualifier for a specific member
     * @param memberId member ID
     * @param mpGroup group ID
     * @param qualifierTypeId qualifier ID
     * @returns Observable<MemberQualifier[]>
     */
    getMemberQualifier(memberId: number, mpGroup: string, qualifierTypeId: number): Observable<MemberQualifier[]> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup);
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/qualifiers/${qualifierTypeId}`;
        const params = new HttpParams().set("memberId", memberId).set("qualifierTypeId", qualifierTypeId);
        return this.httpClient.get<MemberQualifier[]>(apiEndPoint, { headers: headers, params: params });
    }

    /**
     * Save MemberQualifier for specific member
     * @param memberId member ID
     * @param mpGroup group ID
     * @param qualifierTypeId qualifier ID
     * @param req MemberQualifier to be saved
     * @returns Observable<HttpResponse<Response>>
     */
    saveMemberQualifier(
        memberId: number,
        mpGroup: string,
        qualifierTypeId: number,
        req: MemberQualifier,
    ): Observable<HttpResponse<Response>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup);
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/qualifiers/${qualifierTypeId}`;
        const params = new HttpParams().set("memberId", memberId).set("qualifierTypeId", qualifierTypeId);
        return this.httpClient.post<HttpResponse<Response>>(apiEndPoint, req, { headers: headers, params: params });
    }

    /**
     * Get Payment Data For Pending Aflac Always plans
     * @param memberId member ID
     * @param mpGroup group ID
     * @returns Observable<HttpResponse<ReviewAflacAlwaysModalData[]>>
     */
    getPaymentMethodsForAflacAlways(memberId: number, mpGroup: number): Observable<ReviewAflacAlwaysModalData[]> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<any>(`${this.configuration.basePath}/aflac/members/${memberId}/enrollments/aflacAlways/pending`, {
            headers: this.defaultHeaders,
        });
    }
}
