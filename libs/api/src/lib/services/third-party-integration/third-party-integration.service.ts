import { Injectable, Optional, Inject } from "@angular/core";
import { BASE_PATH } from "../variables";
import { Configuration } from "../configuration";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { ProcessTpiEnrollments, ThirdPartyEnrollments } from "./models";

@Injectable({
    providedIn: "root",
})
export class ThirdPartyIntegrationService {
    configuration = new Configuration();
    protected basePath = "/api";
    constructor(
        protected httpClient: HttpClient,
        @Optional() @Inject(BASE_PATH) basePath: string,
        @Optional() configuration: Configuration
    ) {
        if (configuration) {
            this.configuration = configuration;
            this.configuration.basePath = configuration.basePath || basePath || this.basePath;
        } else {
            this.configuration.basePath = basePath || this.basePath;
        }
    }

    /**
     * This method is used to upload tpi census xml details to database
     * @param tpiCensusUploadXML is upload tpi census xml of type string
     * @returns response thrown by the system
     */
    processTpiCensus(tpiCensusUploadXML: string): Observable<string> {
        return this.httpClient.post<string>(`${this.configuration.basePath}/tpi/census/process`, tpiCensusUploadXML);
    }

    /**
     * This method is used to update tpi census in database
     * @param encryptedData is the encrypted data which is coming from route params
     * @returns response thrown by the system
     */
    updateTpiCensus(encryptedData: string): Observable<string> {
        const params = new HttpParams().append("encData", encryptedData);
        return this.httpClient.post<string>(`${this.configuration.basePath}/tpi/census/update`, "", {
            params: params,
        });
    }
    /**
     * This method is used to get all third party enrollments from database
     * @param encryptedData is the encrypted data which is coming from route params
     * @returns all the third party enrollments
     */
    getTpiEnrollments(encryptedData: string): Observable<ThirdPartyEnrollments[]> {
        const params = new HttpParams().append("encData", encryptedData);
        return this.httpClient.get<ThirdPartyEnrollments[]>(`${this.configuration.basePath}/tpi/enrollments`, {
            params: params,
        });
    }
    /**
     * This method is used to process third party integration enrollments
     * @param processTpiEnrollment is the requested payload of type ProcessTpiEnrollments
     * @returns response thrown by the system
     */
    processTpiEnrollments(processTpiEnrollment: ProcessTpiEnrollments): Observable<string> {
        const params = new HttpParams()
            .append("guid", processTpiEnrollment.guid)
            .append("ssn", processTpiEnrollment.ssn);
        if (processTpiEnrollment.product) {
            params.append("product", processTpiEnrollment.product);
        }
        if (processTpiEnrollment.plan) {
            params.append("plan", processTpiEnrollment.plan);
        }
        return this.httpClient.get<string>(`${this.configuration.basePath}/tpi/enrollments/process`, {
            params: params,
        });
    }
}
