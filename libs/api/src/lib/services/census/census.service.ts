import { HttpClient, HttpHeaders, HttpParams, HttpEvent, HttpResponse } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { Configuration } from "../configuration";
import { Document } from "@empowered/constants";
import { BASE_PATH } from "../variables";
import { CensusMapping } from "./models/census-mapping.model";
import { CensusStatus } from "./models/census-status.model";
import { CensusTemplate, RSLIEligibility } from "./models";

@Injectable({
    providedIn: "root",
})
export class CensusService {
    defaultHeaders = new HttpHeaders();
    configuration = new Configuration();
    protected basePath = "/api";
    private readonly updateDashboardDetails$: Subject<boolean> = new Subject<boolean>();
    getUpdateDashboardDetails: Observable<boolean> = this.updateDashboardDetails$.asObservable();

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
     * update the value for redirection
     * @param type: boolean
     * @returns void
     */
    updateDashboardDetails(type: boolean): void {
        this.updateDashboardDetails$.next(type);
    }

    checkUploadCensusAccess(mpGroup: number): Observable<Object> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.head(`${this.configuration.basePath}/census/upload`, {
            headers: headers,
        });
    }

    /**
     * to process the the file which is upload to aws s3 bucket
     * @param {string} file uploaded file
     * @param {boolean} multipartFileUploadConfig indicates if the multipart file upload config enabled
     * @param {number} mpGroup group number
     * @param {boolean} changeFile to update existing file or not
     * @param {number} mappingId optional and used when mapping id is present in the url
     * @returns {Observable<HttpResponse<unknown>}
     */
    uploadCensus(
        file: File,
        mpGroup: number,
        changeFile: boolean,
        multipartFileUploadConfig?: boolean,
        mappingId?: number,
    ): Observable<HttpEvent<unknown>> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        const formData: FormData = new FormData();
        if (multipartFileUploadConfig) {
            headers.append("Content-Type", "multipart/form-data");
            formData.append("multipartFile", file, file.name);
        } else {
            params = params.set("objectKey", file.name);
        }
        params = params.set("changeFile", changeFile.toString());
        if (mappingId) {
            params = params.set("mappingId", mappingId.toString());
        }
        return this.httpClient.post(`${this.configuration.basePath}/census/upload`, multipartFileUploadConfig ? formData : null, {
            headers: headers,
            params: params,
            reportProgress: true,
            observe: "events",
        });
    }

    checkUploadStatus(documentId: Document["id"], mpGroup: number): Observable<CensusStatus> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const documentID = documentId.toString();
        return this.httpClient.get<CensusStatus>(`${this.configuration.basePath}/census/upload/${documentID}`, {
            headers: headers,
        });
    }

    getCensusTemplate(mpGroup: number): Observable<CensusTemplate> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<CensusTemplate>(`${this.configuration.basePath}/census/template`, {
            headers: headers,
        });
    }
    getSavedCensusMappings(mpGroup: number): Observable<CensusMapping[]> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<CensusMapping[]>(`${this.configuration.basePath}/census/mappings`, {
            headers: headers,
        });
    }

    saveCensusMapping(censusMapping: CensusMapping, mpGroup: number): Observable<HttpResponse<any>> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        headers.append("Content-Type", "application/json");
        return this.httpClient.post<any>(`${this.configuration.basePath}/census/mappings`, censusMapping, {
            headers: headers,
            observe: "response",
        });
    }

    getCensusMapping(mappingId: CensusMapping["id"], mpGroup: number): Observable<CensusMapping> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<CensusMapping>(`${this.configuration.basePath}/census/mappings/${mappingId}`, {
            headers: headers,
        });
    }
    saveMemberContact(memberId: number, contactInfo: any, contactType: string, mpGroup: number): Observable<any> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/contacts/" + contactType;
        return this.httpClient.put(apiEndPoint, contactInfo, { headers: headers });
    }
    /**
     * Returns info about whether the minimum number has been met and the number of employees needed for eligibility for the account
     * @returns {Observable<RSLIEligibility>}
     */
    getRSLIEligibility(mpGroup?: number): Observable<RSLIEligibility> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<RSLIEligibility>(`${this.configuration.basePath}/census/estimate/rsliEligibility`, {
            headers,
        });
    }
    /**
     * Returns the response status from import subsribers API
     * @param mpGroup: number
     * @returns {Observable<HttpResponse<unknown>>}
     */
    importSubscribers(mpGroup: number): Observable<HttpResponse<unknown>> {
        let header = new HttpHeaders();
        header = header.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/census/import`;
        return this.httpClient.post<HttpResponse<unknown>>(apiEndPoint, " ", {
            headers: header,
            observe: "response",
        });
    }

    /**
     * processTPICensusUpload: Method to process the uploaded file.
     * @param censusXML : string
     * @param token : string
     * @returns {Observable<HttpResponse<string>>}
     */
    processTPICensusUpload(censusXML: string, token: string): Observable<string> {
        const formData: FormData = new FormData();
        formData.append("censusXML", censusXML);
        const header = new HttpHeaders().set("X-CSRF-TOKEN", token);
        return this.httpClient.post<string>(`${this.configuration.basePath}/tpi/census/process`, formData, {
            headers: header,
        });
    }
}
