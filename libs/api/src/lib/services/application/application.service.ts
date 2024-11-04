import { Injectable, Optional, Inject } from "@angular/core";
import { BASE_PATH } from "../variables";
import { Configuration } from "../configuration";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { EnrollmentMethod, Application } from "@empowered/constants";

@Injectable({
    providedIn: "root",
})
export class ApplicationService {
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
    getApplications(memberId: number, mpGroup: number, includeRider?: boolean): Observable<Application[]> {
        includeRider = !(includeRider === undefined || null) ? includeRider : true;
        const httpOptions = {
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<Application[]>(
            `${this.configuration.basePath}/enrollment/checkout/applications?memberId=${memberId}&includeRiders=${includeRider}`,
            httpOptions,
        );
    }

    getApplicationsByPlan(
        planId: number,
        memberId: number,
        mpGroup: number,
        state: string,
        enrollmentMethod: EnrollmentMethod,
        includeRider?: boolean,
    ): Observable<Application[]> {
        includeRider = !(includeRider === undefined || null) ? includeRider : true;
        const httpOptions = {
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<Application[]>(
            `${
                this.configuration.basePath
                // eslint-disable-next-line max-len
            }/enrollment/checkout/applications/plans/${planId}?memberId=${memberId}&includeRiders=${includeRider}&state=${state}&enrollmentMethod=${enrollmentMethod}`,
            httpOptions,
        );
    }
    getPaymetricAccessToken(carrierId: number): Observable<any> {
        return this.httpClient.get(`${this.configuration.basePath}/enrollment/checkout/applications/paymetric/${carrierId}`, {
            responseType: "text",
        });
    }
}
