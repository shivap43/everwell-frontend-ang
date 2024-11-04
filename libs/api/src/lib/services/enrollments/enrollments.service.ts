import { Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Configuration } from "../configuration";
import { BASE_PATH } from "../variables";
import { UnderwritingQuestions, Signature, AdminContact, UnsignedApplicationForms, EndCoverageSummary } from "./models";

import {
    EnrollmentRider,
    EnrollmentDependent,
    DeclineEnrollmentMethod,
    EnrollmentBeneficiary,
    Enrollments,
    EnrollmentInformation,
    MemberCoverageDetails,
    EbsPaymentFileEnrollment,
    PreliminaryForm,
} from "@empowered/constants";
import { Enrollment, MemberEnrollmentSummary } from "../member";
import { ThirdPartyBeneficiaryType } from "../third-party-integration";

@Injectable({
    providedIn: "root",
})
export class EnrollmentService {
    // TO-DO: MP-Froup is hard coded for testing purpose, will be changes to dynamic value
    header = new HttpHeaders();
    defaultHeaders = new HttpHeaders().set("MP-Group", "16898");
    configuration = new Configuration();
    protected basePath = "/api";

    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public pendingEnrollments$ = new Subject<boolean>();

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

    getEnrollments(memberId: number, mpGroup: number, expand?: string): Observable<Enrollments[]> {
        let params = new HttpParams();
        params = params.append("expand", expand ? expand : "planId,coverageLevelId");
        params = params.append("includePerPayPeriodCosts", "true");
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/enrollments";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<Enrollments[]>(apiEndPoint, { headers: headers, params: params });
    }

    getEnrollment(memberId: number, mpGroup: number, enrollmentId: number, expand?: string): Observable<Enrollment> {
        let params = new HttpParams();
        params = params.append("expand", expand ? expand : "planId");
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/enrollments/" + enrollmentId;
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<Enrollment>(apiEndPoint, { headers: headers, params: params });
    }
    updateEnrollmentStatus(memberId: number, enrollmentId: number, enrollmentStatus: any, mpGroup: number): Observable<any> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/enrollments/" + enrollmentId + "/updateStatus";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put(apiEndPoint, enrollmentStatus, {
            headers: headers,
        });
    }
    /**
     * @description This function is to get pending Aflac business enrollments
     * @param mpGroup {number} the mpGroup ID
     * @param memberId {number} member ID
     * @returns {Observable<Enrollments>}
     */
    getBusinessEnrollmentsWithStatusPending(mpGroup: number, memberId?: number): Observable<Enrollments[]> {
        const apiEndPoint = this.configuration.basePath + "/aflac/account/business/status/pending";
        let params = new HttpParams().append("expand", "planId,productId");
        if (memberId) {
            params = params.append("memberId", memberId ? memberId.toString() : "");
        }
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<Enrollments[]>(apiEndPoint, { headers: headers, params: params });
    }

    /**
     * @description Searches for enrollment based on given filter
     * @param mpGroup {number} the mpGroup ID
     * @returns {Observable<Enrollments>}
     */
    searchEnrollments(mpGroup: number): Observable<Enrollments> {
        const apiEndPoint = this.configuration.basePath + "/enrollments/search";
        const params = new HttpParams().append("expand", "planId,productId").append("filter", "status:PENDING|status:APPROVED");
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<Enrollments>(apiEndPoint, { headers: headers, params: params });
    }

    searchMemberEnrollments(memberId: number, mpGroup: number): Observable<Enrollments[]> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/enrollments/search";
        const params = new HttpParams().append(
            "expand",
            "planId,productId,currentEnrollmentId,coverageLevelId,carrierId,beneficiaries.beneficiaryId",
        );
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<Enrollments[]>(apiEndPoint, { headers: headers, params: params });
    }

    /**
     * @description get the enrollment summary for a given member
     * @param memberId {number} the mpGroup ID
     * @param mpGroup {number} the mpGroup ID
     * @returns {Observable<MemberEnrollmentSummary>}
     */
    getMemberEnrollmentSummary(memberId: number, mpGroup: number): Observable<MemberEnrollmentSummary> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/enrollments/summary";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<MemberEnrollmentSummary>(apiEndPoint, { headers: headers });
    }

    // Service to view the unsigned application in Signature app page
    downloadUnsignedApplication(memberId: number, mpGroup: number, itemId: number): Observable<any> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart/items/" + itemId + "/downloadApplication";
        const headers = new HttpHeaders({ "Content-Type": "image/png" }).set("MP-Group", mpGroup ? mpGroup.toString() : "");
        headers.append("Accept", "image/png");
        return this.httpClient.get(apiEndPoint, { headers: headers, responseType: "text", observe: "body" });
    }
    // Service to view the signed application in Confirmation page
    downloadSignedApplication(memberId: number, enrollmentId: number, mpGroup: number): Observable<any> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/enrollments/" + enrollmentId + "/downloadApplication";
        const headers = new HttpHeaders({ "Content-Type": "image/png" }).set("MP-Group", mpGroup ? mpGroup.toString() : "");
        headers.append("Accept", "image/png");
        return this.httpClient.get(apiEndPoint, { headers: headers, responseType: "text", observe: "body" });
    }

    signShoppingCart(memberId: number, mpGroup: number, sign: Signature): Observable<any> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup.toString()).append("MP-Application", "MARKETPLACE_2");
        return this.httpClient.post(apiEndPoint, sign, {
            headers: headers,
        });
    }

    signShoppingCartItem(memberId: number, mpGroup: number, sign: Signature, itemId: number): Observable<any> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart/items/" + itemId;
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post(apiEndPoint, sign, {
            headers: headers,
        });
    }

    sendSignedShoppingCartMessage(memberId: number, mpGroup?: number): Observable<any> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart/sendSignedShoppingCartMessages";
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post(apiEndPoint, undefined, { headers: headers });
    }

    getEnrollmentDependents(memberId: number, enrollmentId: number, mpGroup: number): Observable<EnrollmentDependent[]> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/enrollments/" + enrollmentId + "/dependents";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<EnrollmentDependent[]>(apiEndPoint, { headers: headers });
    }

    getEnrollmentRiders(memberId: number, enrollmentId: number, mpGroup: number, expand?: string): Observable<EnrollmentRider[]> {
        let params = new HttpParams();
        params = params.append("expand", expand ? expand : "planId,coverageLevelId");
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/enrollments/" + enrollmentId + "/riders";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<EnrollmentRider[]>(apiEndPoint, { headers: headers, params: params });
    }
    /**
     * This method is used to get enrollment beneficiaries
     * @param memberId is the id of member
     * @param enrollmentId is the id of enrollment
     * @param mpGroup is the id of group
     * @returns an sorted array of EnrollmentBeneficiary
     */
    getEnrollmentBeneficiaries(memberId: number, enrollmentId: number, mpGroup: number): Observable<EnrollmentBeneficiary[]> {
        let params = new HttpParams();
        params = params.append("expand", "beneficiaryId");
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/enrollments/" + enrollmentId + "/beneficiaries";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient
            .get<EnrollmentBeneficiary[]>(apiEndPoint, { headers: headers, params: params })
            .pipe(
                map((response) =>
                    response.sort((beneficiary1, beneficiary2) => this.customSortBeneficiaryOrder(beneficiary1, beneficiary2)),
                ),
            );
    }
    getEnrollmentInformation(memberId: number, mpGroup: number): Observable<EnrollmentInformation> {
        const apiEndPoint = this.configuration.basePath + `/members/${memberId}/enrollmentInformation`;
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<EnrollmentInformation>(apiEndPoint, { headers: headers });
    }
    updateCoverage(mpGroup: number, memberId: number, enrollmentsId: number, coverageDetails: any): Observable<any> {
        const apiEndPoint = this.configuration.basePath + `/members/${memberId}/enrollments/${enrollmentsId}/update`;
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post(apiEndPoint, coverageDetails, { headers: headers });
    }

    getCoverageVoidReasons(mpGroup: number): Observable<any[]> {
        const apiEndPoint = this.configuration.basePath + "/enrollments/coverageVoidReasons";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<any>(apiEndPoint, { headers: headers, observe: "body" });
    }

    getCoverageChangeReasons(mpGroup: number): Observable<any[]> {
        const apiEndPoint = this.configuration.basePath + "/enrollments/coverageChangeReasons";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<any>(apiEndPoint, { headers: headers, observe: "body" });
    }

    getDeclineProductPreview(memberId: number, productOfferingId: number, mpGroup?: number): Observable<DeclineEnrollmentMethod> {
        const apiEndpoint = this.configuration.basePath + `/enrollment/shopping/products/${productOfferingId}/declinePreview`;
        let params = new HttpParams();
        if (memberId) {
            params = params.append("memberId", memberId ? memberId.toString() : "");
        }
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup != null ? mpGroup.toString() : "");
        return this.httpClient.get<DeclineEnrollmentMethod>(apiEndpoint, { headers, params });
    }

    voidCoverage(memberId: number, enrollmentId: number, mpGroup: number, voidRequest: any): Observable<any[]> {
        const apiEndPoint = this.configuration.basePath + `/members/${memberId}/enrollments/${enrollmentId}/void`;
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<any>(apiEndPoint, voidRequest, { headers: headers });
    }

    updateCoverageWithObserve(mpGroup: number, memberId: number, enrollmentsId: number, coverageDetails: any): Observable<any> {
        const apiEndPoint = this.configuration.basePath + `/members/${memberId}/enrollments/${enrollmentsId}/update`;
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post(apiEndPoint, coverageDetails, { headers: headers, observe: "response" });
    }

    // eslint-disable-next-line max-len
    getEnrollmentsWithPerPayCosts(memberId: number, mpGroup: number, perPayPeriodCosts: boolean): Observable<Enrollments[]> {
        let params = new HttpParams();
        params = params.set("includePerPayPeriodCosts", perPayPeriodCosts.toString());
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/enrollments";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<Enrollments[]>(apiEndPoint, { headers: headers, params: params });
    }

    approveOrRejectPendingEnrollments(memberId: number, mpGroup: number, requestBody: any): Observable<any> {
        const apiEndPoint = this.configuration.basePath + `/members/${memberId}/enrollments/approveOrReject`;
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put(apiEndPoint, requestBody, { headers: headers, observe: "response" });
    }

    getEnrolledPlanDocuments(memberId: number, mpGroup: number, enrollmentId: number): Observable<any[]> {
        const apiEndPoint = this.configuration.basePath + `/members/${memberId}/enrollments/${enrollmentId}/enrolledPlanDocuments`;
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<any[]>(apiEndPoint, { headers: headers });
    }
    getEnrollmentUnderwritingQuestions(memberId: number, enrollmentId: number, mpGroup: number): Observable<UnderwritingQuestions[]> {
        const apiEndPoint =
            this.configuration.basePath + "/members/" + memberId + "/enrollments/" + enrollmentId + "/underwritingQuestions";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<UnderwritingQuestions[]>(apiEndPoint, { headers: headers });
    }

    getHeadsetAdminContact(memberId: number, enrollmentId: number, mpGroup: number): Observable<AdminContact> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/enrollments/" + enrollmentId + "/headsetAdminContact";
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<AdminContact>(apiEndPoint, { headers: headers });
    }

    /**
     * service to get the unsigned forms
     * @param memberId memberId of the employee created
     * @param mpGroup? mpGroup is optional
     * @returns Observable<UnsignedApplicationForms[]>
     */
    getUnsignedApplicationForms(memberId: number, mpGroup?: number): Observable<UnsignedApplicationForms[]> {
        const apiEndPoint = this.configuration.basePath + "/enrollment/checkout/applications/forms?memberId=" + memberId;
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<UnsignedApplicationForms[]>(apiEndPoint, { headers: headers });
    }

    /**
     * service called to cancel the coverage
     * @param memberId: number, memberId of the employee
     * @param enrollmentId: number, enrollmentId of the current enrollment
     * @param endCoverageSummary: EndCoverageSummary, contains coverageEndDate and description
     * @param mpGroup: number, mpGroup is optional
     * @returns Observable<HttpResponse<unknown>> returns http responses i.e. 204, 403 or 503
     */
    cancelCoverage(
        memberId: number,
        enrollmentId: number,
        endCoverageSummary: EndCoverageSummary,
        mpGroup?: number,
    ): Observable<HttpResponse<unknown>> {
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/enrollments/" + enrollmentId + "/cancel";
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<HttpResponse<unknown>>(apiEndPoint, endCoverageSummary, {
            headers: headers,
        });
    }

    /**
     * To get the member coverage details to show data in view details pop up for AG plans
     * @param memberId Member id
     * @param cartItemId cart id
     * @param enrollmentId enrollment id
     * @param mpGroup mpGroup is optional
     * @returns Observable of MemberCoverageDetails
     */
    getMemberCoverageDetails(
        memberId: number,
        cartItemId?: number,
        enrollmentId?: number,
        mpGroup?: number,
    ): Observable<MemberCoverageDetails> {
        let params = new HttpParams();
        if (cartItemId) {
            params = params.append("cartItemId", cartItemId.toString());
        }
        if (enrollmentId) {
            params = params.append("enrollmentId", enrollmentId.toString());
        }
        const apiEndPoint = this.configuration.basePath + `/members/${memberId}/coverageDetails`;
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<MemberCoverageDetails>(apiEndPoint, {
            params: params,
            headers: headers,
        });
    }

    /**
     * http call to send otp to selected electronic address
     * @param groupId id of group
     * @param memberId id of member
     * @param electronicAddress selected electronic address
     * @returns Observable<HttpResponse<unknown>> http response.
     */
    sendOneTimePass(groupId: number, memberId: number, electronicAddress: { [key: string]: string }): Observable<HttpResponse<unknown>> {
        const apiEndPoint = this.configuration.basePath + "/auth/oneTimePass/send";
        const requestPayload = {
            groupId,
            memberId,
            ...electronicAddress,
        };
        return this.httpClient.post<HttpResponse<unknown>>(apiEndPoint, requestPayload);
    }

    /**
     * http call to verify entered otp
     * @param groupId  id of group
     * @param memberId id of member
     * @param code otp
     * @returns Observable<HttpResponse<unknown>> http response
     */
    verifyOneTimePass(groupId: number, memberId: number, code: string): Observable<HttpResponse<unknown>> {
        const apiEndPoint = this.configuration.basePath + "/auth/oneTimePass";
        const requestPayload = {
            groupId,
            memberId,
            code,
        };
        return this.httpClient.post<HttpResponse<unknown>>(apiEndPoint, requestPayload, {
            observe: "response",
        });
    }
    /**
     * This method is used to custom sort beneficiaries based on allocationType
     * @param beneficiary1 is the beneficiary one details to sort
     * @param beneficiary2 is the beneficiary two details to sort
     * @returns order of array
     */
    private customSortBeneficiaryOrder(beneficiary1: EnrollmentBeneficiary, beneficiary2: EnrollmentBeneficiary): number {
        let beneficiaryOrder = 0;
        if (
            beneficiary1.allocationType === ThirdPartyBeneficiaryType.PRIMARY &&
            beneficiary2.allocationType === ThirdPartyBeneficiaryType.PRIMARY
        ) {
            beneficiaryOrder = 1;
        } else if (
            beneficiary1.allocationType === ThirdPartyBeneficiaryType.PRIMARY &&
            beneficiary2.allocationType !== ThirdPartyBeneficiaryType.PRIMARY
        ) {
            beneficiaryOrder = -1;
        }
        return beneficiaryOrder;
    }
    /**
     * This method is used to fetch hipaa consent details from aflac
     * @param memberId selected member id
     * @param mpGroup(optional param) selected mpGroup
     * @returns observable of hipaa status
     */
    getHipaaConsentDetails(memberId: number, mpGroup?: number): Observable<boolean> {
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/hipaaConsent`;
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<boolean>(apiEndPoint, {
            headers: headers,
        });
    }
    /**
     * this method is used to update hipaa consent preference
     * @param memberId selected member id
     * @param hipaaConsent hipaa consent preference
     * @param mpGroup(optional param )selected mpGroup
     * @returns return observable of void
     */
    updateHipaaConsentDetails(memberId: number, hipaaConsent: boolean, mpGroup?: number): Observable<void> {
        const params = new HttpParams().append("hipaaConsent", hipaaConsent.toString());
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/hipaaConsent`;
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<void>(apiEndPoint, "", {
            headers: headers,
            params: params,
        });
    }

    /**
     * this method is used to send request for customer registration for CIAM
     * @param activityPageCode store page information from where api call is made
     * @param memberId stores member id
     * @param [mpGroupId]
     * @returns Observable of void
     */
    registerCustomer(activityPageCode: string, memberId: number, mpGroupId?: number): Observable<void> {
        const params = new HttpParams().append("activityPageCode", activityPageCode);
        const apiEndPoint = `${this.configuration.basePath}/aflac/members/${memberId}/registerEverwellCustomer`;
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroupId?.toString() || "");
        return this.httpClient.post<void>(apiEndPoint, "", {
            headers,
            params,
        });
    }

    /**
     * Method to updateEbsPaymentOnFile for all existing enrollments
     * @param memberId
     * @param groupId
     * @param ebsEnrollments
     * @returns Observable<any>
     */
    updateEbsPaymentOnFile(memberId: number, groupId: string, ebsEnrollments: EbsPaymentFileEnrollment): Observable<any> {
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/enrollments/updateEbsPaymentOnFile`;
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", groupId?.toString() || "");
        return this.httpClient.put(apiEndPoint, ebsEnrollments, {
            headers: headers,
        });
    }

    /**
     * Downloads preliminary form
     * @param memberId id of the employee selected for enrollment
     * @param preliminaryFormPath path of the preliminary form to be displayed
     * @param cartItemId id of the item present in cart whose form needs to be viewed
     * @param mpGroupId id of the group selected
     * @returns preliminary form
     */
    downloadPreliminaryForm(
        memberId: number,
        preliminaryFormPath: string,
        cartItemId: number,
        mpGroupId: number,
        enrollmentId?: number,
    ): Observable<BlobPart> {
        let params = new HttpParams();
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/shoppingCart/downloadPreliminaryForm`;
        const headers: HttpHeaders = new HttpHeaders({ "Content-Type": "application/json" })
            .set("MP-Group", mpGroupId?.toString() || "")
            .set("Accept", "application/pdf,*/*");
        if (enrollmentId) {
            params = new HttpParams().set("preliminaryFormPath", preliminaryFormPath).append("enrollmentId", enrollmentId);
        } else {
            params = new HttpParams().set("preliminaryFormPath", preliminaryFormPath).append("cartItemId", cartItemId);
        }
        return this.httpClient.get<BlobPart>(apiEndPoint, {
            headers,
            params,
            responseType: "blob" as "json",
            observe: "body",
        });
    }

    /**
     * Emails preliminary forms
     * @param memberId id of the employee selected for enrollment
     * @param email id provided/selected in preliminary step to send the forms
     * @param mpGroupId id of the group selected
     * @param preliminaryForms array of preliminaryFormPath and cartItem selected for enrollment
     * @returns preliminary forms
     */
    emailPreliminaryForms(
        memberId: number,
        email: string,
        mpGroupId: number,
        preliminaryForms: PreliminaryForm[],
    ): Observable<HttpResponse<unknown>> {
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/shoppingCart/emailPreliminaryForms`;
        const headers: HttpHeaders = new HttpHeaders({ "Content-Type": "application/json" }).set("MP-Group", mpGroupId?.toString() || "");
        const emailPreliminaryFormsRequest = {
            email,
            preliminaryForms,
        };
        return this.httpClient.post<HttpResponse<unknown>>(apiEndPoint, emailPreliminaryFormsRequest, {
            headers,
        });
    }
}
