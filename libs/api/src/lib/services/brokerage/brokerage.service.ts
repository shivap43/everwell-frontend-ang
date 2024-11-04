import { Injectable, Optional, Inject } from "@angular/core";
import { HttpClient, HttpHeaders, HttpResponse, HttpParams, HttpEvent } from "@angular/common/http";
import { BASE_PATH } from "../variables";
import { Configuration } from "../configuration";
import { BrandingModel, BrandingColorFormat, LogoSize } from "../account";
import { Observable } from "rxjs";

const API_DOMAIN_PREFIX = "brokerage";

@Injectable({
    providedIn: "root",
})
export class BrokerageService {
    configuration = new Configuration();
    protected basePath = "/api";
    API_PATH_BROKERAGE_SERVICE: string;

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
        this.API_PATH_BROKERAGE_SERVICE = `${this.configuration.basePath}/${API_DOMAIN_PREFIX}/brandings`;
    }

    /**
     * Get the account brandings for the group. Returns a max of two brandings, always display the latest VALID branding
     *
     * @param mpGroup The ID for the group associated with the brokerage, needed to get brokerage for members/admins
     * @returns http request for brandings associated with header
     */
    getBrokerageBrandings(mpGroup: number): Observable<BrandingModel[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<BrandingModel[]>(`${this.API_PATH_BROKERAGE_SERVICE}`, {
            headers: headers,
        });
    }

    /**
     * Adds the new branding to the group, Until this upload was successful, it will show as pending
     *
     * @param brokerageId The ID for the brokerage
     * @param brandingModel new branding to save
     */
    saveBrokerageBranding(brandingModel: BrandingModel): Observable<HttpResponse<unknown>> {
        return this.httpClient.post(`${this.API_PATH_BROKERAGE_SERVICE}`, brandingModel, {
            observe: "response",
        });
    }

    /**
     * Resets (RE: Delete) the account brandings for the group
     *
     * @returns response from the API request
     */
    resetBrokerageBranding(): Observable<HttpResponse<unknown>> {
        return this.httpClient.delete(`${this.API_PATH_BROKERAGE_SERVICE}`, {
            observe: "response",
        });
    }

    /**
     * Get a specific branding by its ID
     *
     * @param brandingId the id of the desired branding
     * @returns the branding model that corresponds to the id
     */
    getBrokerageBranding(brandingId: number): Observable<BrandingModel> {
        return this.httpClient.get<BrandingModel>(`${this.API_PATH_BROKERAGE_SERVICE}/${brandingId}`, {});
    }

    /**
     * Generate a preview image based on the specifications
     *
     * @param colorFormat HEX or RGB
     * @param colorCode The color to generate an image for
     * @param logoSize The size of the logo
     * @returns logo data for the preview
     */
    getBrokerageBrandingPreview(colorFormat: BrandingColorFormat, colorCode: string, logoSize: LogoSize): Observable<Blob> {
        return this.httpClient.get<Blob>(`${this.API_PATH_BROKERAGE_SERVICE}/preview`, {
            params: new HttpParams().set("colorFormat", colorFormat).set("colorCode", colorCode).set("size", logoSize),
            responseType: "blob" as "json",
        });
    }

    /**
     * Download the brokerage document for the given document ID
     *
     * @param documentId the ID of the target document
     * @returns the document's data
     */
    downloadBrokerageDocument(documentId: number): Observable<Blob> {
        const headers = new HttpHeaders({ "Content-Type": "application/json", "MP-Group": "" });
        return this.httpClient.get<Blob>(`${this.configuration.basePath}/${API_DOMAIN_PREFIX}/documents/${documentId}/download`, {
            headers: headers,
            responseType: "blob" as "json",
        });
    }
    /**
     * Uploading the brokerage document for generating document id for brokerage branding
     *
     * @param file Brokerage logo file
     * @param multipartFileUploadConfig indicates if the multipart file upload config enabled
     * @returns documentId attached in response location header data
     */
    uploadBrokerageDocument(file: File, multipartFileUploadConfig?: boolean): Observable<HttpEvent<string>> {
        const headers = new HttpHeaders();
        const formData: FormData = new FormData();
        let params = new HttpParams();
        if (multipartFileUploadConfig) {
            formData.append("multipartFile", file, file.name);
            headers.append("Content-Type", "multipart/form-data");
        } else {
            params = params.set("objectKey", file.name);
        }
        return this.httpClient.post<string>(
            `${this.configuration.basePath}/brokerage/documents`,
            multipartFileUploadConfig ? formData : null,
            {
                headers,
                params,
                reportProgress: true,
                observe: "events",
            },
        );
    }
}
