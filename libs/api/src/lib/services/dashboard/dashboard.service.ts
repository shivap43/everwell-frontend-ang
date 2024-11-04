import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Configuration } from "../configuration";
import { BASE_PATH } from "../variables";
import { AccountDetails } from "./models";
import { Observable } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class DashboardService {
    defaultHeaders = new HttpHeaders();
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
    getAccount(mpGroup: string): Observable<any> {
        const apiEndPoint = this.configuration.basePath + "/account";
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<AccountDetails>(apiEndPoint, {
            headers: this.defaultHeaders,
        });
    }

    deactivateAccount(mpGroup: string): Observable<any> {
        const apiEndPoint = this.configuration.basePath + "/account/deactivate";
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<string>(apiEndPoint, "", {
            headers: this.defaultHeaders,
            observe: "response",
        });
    }
}
