import { Injectable, Inject, Optional } from "@angular/core";
import { Configuration } from "../configuration";
import { HttpClient, HttpHeaders, HttpResponse, HttpParams } from "@angular/common/http";
import { BASE_PATH } from "../variables";
import { Exceptions, ExceptionTypeCategory, ExceptionType } from "@empowered/constants";
import { Observable } from "rxjs";
import { AddException } from "./models/add-exception.model";

@Injectable({
    providedIn: "root",
})
export class ExceptionsService {
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
     * this function will get all the exceptions data based on the params passed
     * @param mpGroup
     * @param exceptionType
     * @param exceptionTypeCategories array of exception type categories.
     * Use [ENROLLMENT] on the enrollment options page and
     * [OFFERING, VAS] on the exceptions page
     * @returns observable based with data received from back end
     */
    getExceptions(
        mpGroup: string,
        exceptionType?: ExceptionType,
        exceptionTypeCategories?: ExceptionTypeCategory[],
    ): Observable<Exceptions[]> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        if (exceptionType) {
            params = params.append("exceptionType", exceptionType);
        }
        if (exceptionTypeCategories?.length) {
            params = params.append("exceptionTypeCategory", exceptionTypeCategories.join(","));
        }
        return this.httpClient.get<Exceptions[]>(`${this.configuration.basePath}/exceptions`, {
            headers,
            params,
        });
    }
    addException(mpGroup: string, exceptionPayload: AddException): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<void>(`${this.configuration.basePath}/exceptions`, exceptionPayload, {
            headers: headers,
            observe: "response",
        });
    }
    /**
     * this function will get the exception data based on the params passed
     * @param mpGroup
     * @param exceptionId
     * @returns observable based with data received from back end
     */
    getException(mpGroup: string, exceptionId: number): Observable<Exceptions> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<Exceptions>(`${this.configuration.basePath}/exceptions/${exceptionId}`, {
            headers: headers,
        });
    }
    updateException(mpGroup: string, exceptionId: number, exceptionPayload: AddException): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<void>(`${this.configuration.basePath}/exceptions/${exceptionId}`, exceptionPayload, {
            headers: headers,
            observe: "response",
        });
    }
    deleteException(mpGroup: string, exceptionId: number): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete<void>(`${this.configuration.basePath}/exceptions/${exceptionId}`, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Returns a list of exception types which the producer can create for the account
     *
     * @param exceptionTypeCategory
     * @param mpGroup
     * @returns observable of exception types belonging to the give category
     */
    getAllowedExceptionTypes(exceptionTypeCategories: ExceptionTypeCategory[], mpGroup?: number): Observable<string[]> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup?.toString() || "");
        const params = new HttpParams().set("exceptionTypeCategory", exceptionTypeCategories.join(","));
        return this.httpClient.get<string[]>(`${this.configuration.basePath}/exceptions/types/allowed`, {
            headers,
            params,
        });
    }
}
