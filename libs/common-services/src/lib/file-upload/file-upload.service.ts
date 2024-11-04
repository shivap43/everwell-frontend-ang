import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Observable, combineLatest, iif, of, timer } from "rxjs";
import { Configuration, BASE_PATH } from "@empowered/api";
import { first, switchMap, take } from "rxjs/operators";
import { StaticUtilService } from "@empowered/ngxs-store";
import { ConfigName } from "@empowered/constants";

@Injectable({
    providedIn: "root",
})
export class FileUploadService {
    defaultHeaders = new HttpHeaders();
    configuration = new Configuration();
    protected basePath = "/api";

    constructor(
        protected httpClient: HttpClient,
        @Optional() @Inject(BASE_PATH) basePath: string,
        @Optional() configuration: Configuration,
        protected readonly staticUtilService: StaticUtilService,
    ) {
        if (configuration) {
            this.configuration = configuration;
            this.configuration.basePath = configuration.basePath || basePath || this.basePath;
        } else {
            this.configuration.basePath = basePath || this.basePath;
        }
    }

    /**
     * to get the pre signed url to upload file to aws s3
     * @param {string} objectKey name of the file which is being uploaded
     * @returns {Observable<string>} presignedURL
     */
    getPreSignedUrl(objectKey: string): Observable<string> {
        const params = new HttpParams().set("objectKey", objectKey);
        return this.httpClient.get(`${this.configuration.basePath}/aws/s3/presignedURL`, {
            responseType: "text",
            params,
        });
    }

    /**
     * to upload file to aws s3 bucket using presignedURL
     * @param {string} url presignedURL to which file will be uploaded
     * @param {File} file file to upload
     * @returns {Observable<HttpResponse<unknown>}
     */
    uploadFile(url: string, file: File): Observable<HttpResponse<null>> {
        const headers = this.defaultHeaders.set("Content-Type", "text/plain;charset=UTF-8");
        return this.httpClient.put<null>(url, file, {
            headers,
            observe: "response",
        });
    }

    /**
     * Gets the pre-signed URL from Backend and uploads the file to the S3 bucket
     * @param file - File to be uploaded
     * @returns Observable of HttpResponse
     */
    upload(file: File): Observable<number> {
        return this.getPreSignedUrl(file.name).pipe(
            switchMap((url) => this.uploadFile(url, file)),
            switchMap(() => this.staticUtilService.cacheConfigs([ConfigName.CSS_VIRUS_SCAN, ConfigName.FILE_UPLOAD_DELAY]).pipe(take(1))),
            switchMap(([css_scan, m_sec]) => iif(() => !this.staticUtilService.isConfigEnabled(css_scan), timer(+m_sec?.value), of(0))),
        );
    }

    /**
     * fetches the config data related to file upload
     * @param maxUploadFileSizeConfig config name of the max file upload size allowed if is different than the generic size
     * @returns Observable of values of configs
     */
    fetchFileUploadConfigs(maxUploadFileSizeConfig?: string): Observable<{ allowMultipartFileUpload: boolean; maxFileUploadSize: number }> {
        return combineLatest([
            this.staticUtilService.cacheConfigEnabled(ConfigName.ALLOW_MULTIPART_FILE_UPLOAD),
            this.staticUtilService.cacheConfigValue(maxUploadFileSizeConfig ? maxUploadFileSizeConfig : ConfigName.MAX_UPLOAD_FILE_SIZE),
        ]).pipe(
            switchMap(([allowMultipartFileUpload, maxFileUploadSize]) =>
                of({ allowMultipartFileUpload, maxFileUploadSize: +maxFileUploadSize }),
            ),
        );
    }
}
