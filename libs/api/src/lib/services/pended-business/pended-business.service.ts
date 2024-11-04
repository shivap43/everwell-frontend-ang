import { PendedBusinessExistence } from "./models/pended-business-existence.model";
import { Injectable, Optional, Inject } from "@angular/core";
import { Configuration } from "../configuration";
import { HttpClient, HttpHeaders, HttpResponse, HttpParams, HttpEvent } from "@angular/common/http";
import { BASE_PATH } from "../variables";
import { Observable } from "rxjs";
import {
    PendedBusinessOverview,
    PendedBusinessByType,
    PendedBusinessByLevel,
    PendedBusinessAccount,
    ResolveApplicationEmail,
    ApplicationDetail,
} from "./models";
import { PendedBusinessType } from "./enums";
@Injectable({
    providedIn: "root",
})
export class PendedBusinessService {
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
    checkExistence(producerId?: number): Observable<PendedBusinessExistence> {
        let params = new HttpParams();
        if (producerId) {
            params = params.append("optionalProducerId", producerId.toString());
        }
        return this.httpClient.get<PendedBusinessExistence>(`${this.configuration.basePath}/pendedBusiness/checkExistence`, {
            headers: this.defaultHeaders,
            params: params,
        });
    }
    getPendedBusinessOverview(producerId?: number): Observable<PendedBusinessOverview> {
        let params = new HttpParams();
        if (producerId) {
            params = params.append("optionalProducerId", producerId.toString());
        }
        return this.httpClient.get<PendedBusinessOverview>(`${this.configuration.basePath}/pendedBusiness/overview`, {
            headers: this.defaultHeaders,
            params: params,
        });
    }
    getPendedBusinessByType(
        businessType: "ALL" | "RESOLVED" | "NEWLY_TRANSMITTED",
        producerId?: number,
    ): Observable<PendedBusinessByType[]> {
        let params = new HttpParams();
        if (producerId) {
            params = params.append("optionalProducerId", producerId.toString());
        }
        return this.httpClient.get<PendedBusinessByType[]>(`${this.configuration.basePath}/pendedBusiness/${businessType}`, {
            headers: this.defaultHeaders,
            params: params,
        });
    }
    getPendedBusinessByLevel(searchLevel: string, producerId?: number): Observable<PendedBusinessByLevel[]> {
        let params = new HttpParams().set("searchLevel", searchLevel);
        if (producerId) {
            params = params.append("optionalProducerId", producerId.toString());
        }
        return this.httpClient.get<PendedBusinessByLevel[]>(`${this.configuration.basePath}/pendedBusiness/searchByLevel`, {
            headers: this.defaultHeaders,
            params,
        });
    }
    getPendedBusinessForAccount(accountNumber: string, companyCode: string, producerId?: number): Observable<PendedBusinessByType[]> {
        let params = new HttpParams().set("accountNumber", accountNumber).set("companyCode", companyCode);
        if (producerId) {
            params = params.append("optionalProducerId", producerId.toString());
        }
        return this.httpClient.get<PendedBusinessByType[]>(`${this.configuration.basePath}/pendedBusiness/searchByAccount`, {
            headers: this.defaultHeaders,
            params: params,
        });
    }

    /**
     * Uploads corrected application
     * @param uploadCompanyCode - Company Code
     * @param file - file to be uploaded
     * @param producerId - ID of the producer
     * @param allowMultiPartFile - Whether to upload multipart file
     * @returns Observable of HttpEvent
     */
    sendCorrectedApplication(
        uploadCompanyCode: string,
        file: File,
        producerId?: number,
        allowMultipartFileUpload?: boolean,
    ): Observable<HttpEvent<any>> {
        const formData = new FormData();
        const headers = this.defaultHeaders;
        let params = new HttpParams();
        params = params.append("uploadCompanyCode", uploadCompanyCode);
        if (allowMultipartFileUpload) {
            formData.append("correctedApplicationFile", file, file.name);
            headers.append("Content-Type", "multipart/form-data");
        } else {
            params = params.append("objectKey", file.name);
        }
        if (producerId) {
            params = params.append("optionalProducerId", producerId.toString());
        }

        return this.httpClient.post<string>(
            `${this.configuration.basePath}/pendedBusiness/applications/correct`,
            allowMultipartFileUpload ? formData : null,
            {
                headers: headers,
                params: params,
                reportProgress: true,
                observe: "events",
            },
        );
    }
    sendResolvedApplicationEmail(resolvedApplicationEmail: ResolveApplicationEmail, producerId?: number): Observable<HttpResponse<void>> {
        let params = new HttpParams();
        if (producerId) {
            params = params.append("optionalProducerId", producerId.toString());
        }
        return this.httpClient.put<void>(`${this.configuration.basePath}/pendedBusiness/applications/resolve`, resolvedApplicationEmail, {
            headers: this.defaultHeaders,
            observe: "response",
        });
    }
    getApplicationDetail(companyCode: string, queryParams: any, producerId?: number): Observable<ApplicationDetail> {
        if (producerId) {
            queryParams["optionalProducerId"] = producerId.toString();
        }
        return this.httpClient.get<ApplicationDetail>(`${this.configuration.basePath}/pendedBusiness/${companyCode}/applicationDetail`, {
            headers: this.defaultHeaders,
            params: queryParams,
        });
    }
    getPendedBusinessAccountList(
        companyCode: "ALL" | "US" | "NY",
        writingNumber?: string,
        producerId?: number,
    ): Observable<PendedBusinessAccount[]> {
        let params = new HttpParams();
        if (producerId) {
            params = params.append("optionalProducerId", producerId.toString());
        }
        if (writingNumber) {
            params = params.append("writingNumber", writingNumber);
        }
        return this.httpClient.get<PendedBusinessAccount[]>(`${this.configuration.basePath}/pendedBusiness/${companyCode}/accountList`, {
            headers: this.defaultHeaders,
            params,
        });
    }
    downloadApplication(applicationNumber: string, businessType: PendedBusinessType, producerId?: number): Observable<any> {
        let params = new HttpParams().set("applicationNumber", applicationNumber).set("businessType", businessType);
        if (producerId) {
            params = params.append("optionalProducerId", producerId.toString());
        }
        const headers = new HttpHeaders({ "Content-Type": "application/json" }).set(
            "Accept",
            "application/octet-stream,application/vnd.ms-excel,  application/pdf,*/*",
        );
        return this.httpClient.get<any>(`${this.configuration.basePath}/pendedBusiness/applications/download`, {
            headers: headers,
            params: params,
            responseType: "blob" as "json",
            observe: "body",
        });
    }
}
