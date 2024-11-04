import { HttpClient, HttpEvent, HttpHeaders, HttpParams } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Configuration } from "../configuration";
import { CustomHttpUrlEncodingCodec } from "../encoder";
import { BASE_PATH } from "../variables";
import { DocumentQuery, ReportCriteria } from "./models";
import { Document, Documents } from "@empowered/constants";

@Injectable({
    providedIn: "root",
})
export class DocumentApiService {
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

    // expand can have values: ["uploadAdminId"]
    getDocuments(expand?: string): Observable<Document[]> {
        let headers = this.defaultHeaders;
        let params = new HttpParams({ encoder: new CustomHttpUrlEncodingCodec() });

        headers = headers.set("MP-Group", "");
        if (expand) {
            params = params.set("expand", expand);
        }
        return this.httpClient.get<Document[]>(`${this.configuration.basePath}/documents`, { headers, params });
    }

    getDocument(documentId: number, mpGroup?: string, expand?: "uploadAdminId"): Observable<Document> {
        let headers = this.defaultHeaders;
        let params = new HttpParams({ encoder: new CustomHttpUrlEncodingCodec() });

        headers = headers.set("MP-Group", mpGroup != null ? (mpGroup ? mpGroup.toString() : "") : "");
        if (expand) {
            params = params.set("expand", expand);
        }

        return this.httpClient.get<Document>(`${this.configuration.basePath}/documents/${documentId}`, {
            headers,
            params,
        });
    }

    /**
     * Method used to get the existing documents from the backend
     * @param mpGroup Group id
     * @param query DocumentQuery having type and value
     * @param expand option parameter if value is uploadAdminId we get the admin details
     * @returns list of existing documents and related data
     */
    searchDocuments(mpGroup: number, query?: DocumentQuery, expand?: string): Observable<Documents> {
        const headers = new HttpHeaders({ "Content-Type": "application/json" }).set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();

        if (query !== undefined) {
            Object.entries(query).forEach(([key, value]) => {
                params = expand ? params.set(key, value).set("expand", expand) : params.set(key, value);
            });
        }

        return this.httpClient.get<Documents>(`${this.configuration.basePath}/documents/search`, { headers, params });
    }

    downloadDocument(documentId: number, mpGroup?: number): Observable<any> {
        const headers = new HttpHeaders({ "Content-Type": "application/json" })
            .set("MP-Group", mpGroup ? mpGroup.toString() : "")
            .set("Accept", "application/octet-stream,application/vnd.ms-excel,  application/pdf,*/*");
        return this.httpClient.get<any>(`${this.configuration.basePath}/documents/${documentId}/download`, {
            headers: headers,
            responseType: "blob" as "json",
            observe: "body",
        });
    }
    /**
     * This method is used to process the file uploaded to the aws s3 bucket or
     * upload file based on config
     * @param file is the file uploaded
     * @param multipartFileUploadConfig indicates if the multipart file upload config enabled
     * @param mpGroup is the group number of the account
     * @param type represents the type of file which is required only for
     * specialized documents listed which are stored differently than standard uploads
     * @param planId is id of the plan and is required if type is PLAN_BROCHURE
     * @returns observable of http events
     */
    uploadDocument(
        file: File,
        multipartFileUploadConfig?: boolean,
        mpGroup?: number,
        type?: string,
        planId?: string,
    ): Observable<HttpEvent<string>> {
        const headers = this.defaultHeaders.append("MP-Group", mpGroup != null ? mpGroup.toString() : "");
        let params = new HttpParams();
        const formData: FormData = new FormData();
        if (multipartFileUploadConfig) {
            formData.append("multipartFile", file, file.name);
            headers.append("Content-Type", "multipart/form-data");
        } else {
            params = params.set("objectKey", file.name);
        }
        if (type) {
            params = params.append("type", type);
        }
        if (planId) {
            params = params.append("planId", planId);
        }
        return this.httpClient.post<string>(`${this.configuration.basePath}/documents`, multipartFileUploadConfig ? formData : null, {
            headers: headers,
            params: params,
            reportProgress: true,
            observe: "events",
        });
    }

    deleteDocument(documentId: number, mpGroup?: number): Observable<any> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete<any>(`${this.configuration.basePath}/documents/${documentId}`, {
            headers,
        });
    }

    createReport(reportCriteria: ReportCriteria): Observable<string | null> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");

        return this.httpClient
            .post(`${this.configuration.basePath}/documents/reports`, reportCriteria, {
                headers,
                observe: "response",
            })
            .pipe(map((response) => response.headers.get("Location")));
    }
}
