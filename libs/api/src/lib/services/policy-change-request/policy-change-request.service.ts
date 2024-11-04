import { Inject, Injectable, Optional } from "@angular/core";
import { Observable } from "rxjs";

import { PolicyChangeRequestListModel, FindPolicyholderModel, PolicyChangeFormDetailsModel } from "./models";
import { HttpClient, HttpHeaders, HttpParams, HttpEvent } from "@angular/common/http";
import { Configuration } from "../configuration";
import { BASE_PATH } from "../variables";
import { map } from "rxjs/operators";
import { PolicyTransactionForms } from "./enums/policy-transaction-forms.enum";
import { MP_APPLICATION_TYPE } from "../shopping";

@Injectable({
    providedIn: "root",
})
export class PolicyChangeRequestService {
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

    // fetching policy list records
    getListChangeForms(mpGroup?: number, memberId?: number): Observable<any> {
        const apiEndPoint = this.configuration.basePath + "/policyChangeRequests/forms";
        let params: any;
        if (mpGroup) {
            this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        } else {
            this.defaultHeaders = new HttpHeaders();
        }
        if (memberId) {
            params = new HttpParams().set("memberId", memberId ? memberId.toString() : "");
        } else {
            params = new HttpParams();
        }
        return this.httpClient.get<PolicyChangeRequestListModel>(apiEndPoint, {
            headers: this.defaultHeaders,
            params: params,
        });
    }
    /**
     * Refreshing policy change requests
     * @param mpGroup mpGroup of the account
     * @param memberId member id of employee
     * @returns Observable of type PolicyChangeRequestListModel
     */
    refreshListChangeForms(mpGroup?: number, memberId?: number): Observable<PolicyChangeRequestListModel> {
        const apiEndPoint = this.configuration.basePath + "/policyChangeRequests/refresh";
        let params = new HttpParams();
        let headers: HttpHeaders = new HttpHeaders();

        headers = headers.set("MP-Group", mpGroup ? mpGroup.toString() : "");

        if (memberId) {
            params = new HttpParams().set("memberId", memberId ? memberId.toString() : "");
        }
        return this.httpClient.put<PolicyChangeRequestListModel>(apiEndPoint, null, {
            headers: headers,
            params: params,
        });
    }

    // fetching policy list records
    getPolicyChangeForm(formId: number): Observable<PolicyChangeRequestListModel> {
        const apiEndPoint = this.configuration.basePath + `/policyChangeRequests/forms/${formId}`;
        return this.httpClient.get<PolicyChangeRequestListModel>(apiEndPoint);
    }

    getPolicyChangeFormDetails(formId: number): Observable<PolicyChangeFormDetailsModel> {
        const apiEndPoint = this.configuration.basePath + `/policyChangeRequests/forms/${formId}/details`;
        return this.httpClient.get<PolicyChangeFormDetailsModel>(apiEndPoint);
    }

    // Downloading policy change request list
    downloadPolicyChangeRequests(mpGroup?: number): Observable<any> {
        const apiEndPoint = this.configuration.basePath + "/policyChangeRequests/download";
        if (mpGroup) {
            this.defaultHeaders = new HttpHeaders({ "Content-Type": "application/vnd.ms-excel" }).set("MP-Group", mpGroup.toString());
        } else {
            this.defaultHeaders = new HttpHeaders({ "Content-Type": "application/vnd.ms-excel" });
        }
        this.defaultHeaders.append("Accept", "application/vnd.ms-excel, */*");
        return this.httpClient.get<PolicyChangeRequestListModel>(apiEndPoint, {
            headers: this.defaultHeaders,
            responseType: "blob" as "json",
            observe: "body",
        });
    }

    /**
     * Search the policies and allowed forms for PCR
     * @param searchParams: PCR search form values
     * @returns Observable of FindPolicyHolderModel
     */
    searchPolicies(searchparams: any): Observable<FindPolicyholderModel> {
        let params: any;
        const apiEndPoint = this.configuration.basePath + "/policyChangeRequests/policySearch";
        params = new HttpParams()
            .set("firstName", searchparams.firstName)
            .set("lastName", searchparams.lastName)
            .set("birthDate", searchparams.birthDate);
        if (searchparams.zip) {
            params = params.append("zip", searchparams.zip);
        }
        if (searchparams.policyNumber) {
            params = params.append("policyNumber", searchparams.policyNumber);
        }
        return this.httpClient
            .get<FindPolicyholderModel>(apiEndPoint, {
            headers: this.defaultHeaders,
            params: params,
        })
            .pipe(
                map((response) => {
                    if (
                        response &&
                        response.allowedForms &&
                        response.allowedForms.length &&
                        response.policies &&
                        response.policies.length
                    ) {
                        response.allowedForms = response.allowedForms.filter((form) => form in PolicyTransactionForms);

                        const riders = response.policies.filter((policy) => policy.rider);
                        if (riders.length) {
                            response.policies = response.policies.filter((policy) => !policy.rider);
                        }
                        response.riderPolicies = riders;
                    }
                    return response;
                }),
            );
    }

    /**
     * @param file - File to be uploaded
     * @param mpGroup - ID of the group
     * @param memberId - ID of the member
     * @param cifNumber - CIF number of the member
     * @param allowMultiPartFile - Whether to upload multipart file
     * @returns Observable of HttpEvent with status of the upload
     */
    uploadSupportiveTransactionDocuments(
        file: File,
        mpGroup: number,
        memberId: number,
        cifNumber: string,
        allowMultiPartFile?: boolean,
    ): Observable<HttpEvent<any>> {
        const apiEndPoint = this.configuration.basePath + "/policyChangeRequests/transactionDocuments";
        let headers = this.defaultHeaders;
        let params = new HttpParams();
        const formData = new FormData();

        // If allowMultiPartFile revert to uploading multipart file to API
        if (allowMultiPartFile) {
            formData.append("file", file, file.name);
            headers.append("Content-Type", "multipart/form-data");
            if (mpGroup && memberId && cifNumber) {
                formData.append("cifNumber", cifNumber);
            } else {
                if (mpGroup && memberId) {
                    formData.append("mpGroup", mpGroup ? mpGroup.toString() : "");
                    formData.append("memberId", memberId ? memberId.toString() : "");
                }
                if (cifNumber) {
                    formData.append("cifNumber", cifNumber);
                }
            }
        } else {
            // If false then make call to API using filename
            params = params.set("objectKey", file.name);
            if (mpGroup && memberId && cifNumber) {
                params = params.set("cifNumber", cifNumber);
            } else {
                if (mpGroup && memberId) {
                    headers = headers.set("MP-Group", mpGroup ? mpGroup.toString() : "");
                    params = params.set("memberId", memberId ? memberId : "");
                }
                if (cifNumber) {
                    params = params.set("cifNumber", String(cifNumber));
                }
            }
        }

        return this.httpClient.post<string>(apiEndPoint, allowMultiPartFile ? formData : null, {
            headers: headers,
            params: params,
            reportProgress: true,
            observe: "events",
        });
    }

    /**
     * @param formId ID of the policyChangeTransaction section
     * @param transactionDocumentIds IDs of the policy change transaction document
     * @returns Observable with the status of the request
     */
    addTransactionDocumentsToForm(formId: number, transactionDocumentIds: number[]): Observable<any> {
        const apiEndPoint = this.configuration.basePath + `/policyChangeRequests/forms/${formId}`;
        return this.httpClient.put(apiEndPoint, transactionDocumentIds);
    }

    getListChangeForm(mpGroup: number, memberId: number): Observable<any> {
        const apiEndPoint = this.configuration.basePath + `/policyChangeRequests/forms/?${memberId}`;
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get(apiEndPoint);
    }

    savePolicyChangeRequest(signature: string, forms: any, policyHolderDetails: any): Observable<any> {
        const apiEndPoint = this.configuration.basePath + "/policyChangeRequests";
        this.defaultHeaders = this.defaultHeaders.set("mp-application", MP_APPLICATION_TYPE.MARKETPLACE_2);
        const requestBody = {
            signature: signature,
            forms: forms,
            firstName: policyHolderDetails["firstName"],
            lastName: policyHolderDetails["lastName"],
            birthDate: policyHolderDetails["birthDate"],
            zip: policyHolderDetails["zip"],
            policyNumber: policyHolderDetails["policyNumber"],
        };
        return this.httpClient.post(apiEndPoint, requestBody, { headers: this.defaultHeaders });
    }

    /**
     * API call to save policy change request
     * @param formgive info about address1 , address2, city, state, zip etc
     * @param groupId gives the group id
     * @param memberId gives the member id
     * @param signature give signature info
     * @param policyNumber gives policy number
     * @returns Observable<void>
     */
    savePolicyChangeRequestMemeber(
        forms: any,
        groupId: number,
        memberId: number,
        signature: string,
        policyNumber?: string,
    ): Observable<void> {
        const apiEndPoint = this.configuration.basePath + "/policyChangeRequests";
        this.defaultHeaders = this.defaultHeaders.set("mp-application", MP_APPLICATION_TYPE.MARKETPLACE_2);
        const requestBody = { forms, groupId, memberId, signature, policyNumber };
        return this.httpClient.post<void>(apiEndPoint, requestBody, { headers: this.defaultHeaders });
    }

    /**
     * @param transactionDocumentId ID of the policy change transaction document
     * @returns Document related to the policyChange request transaction
     */
    getPolicyChangeTransactionDocument(transactionDocumentId: number): Observable<any> {
        const apiEndPoint = this.configuration.basePath + `/policyChangeRequests/transactionDocuments/${transactionDocumentId}`;
        return this.httpClient.get(apiEndPoint);
    }

    /**
     * @param transactionDocumentId ID of the policy change transaction document
     * @returns policyChange request transaction document
     */
    downloadPolicyChangeTransactionDocument(transactionDocumentId: any): Observable<any> {
        const apiEndPoint = this.configuration.basePath + `/policyChangeRequests/transactionDocuments/${transactionDocumentId}/download`;
        return this.httpClient.get(apiEndPoint);
    }
}
