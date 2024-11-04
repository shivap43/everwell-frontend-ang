import { Injectable, Optional, Inject } from "@angular/core";
import { HttpHeaders, HttpClient, HttpResponse } from "@angular/common/http";
import { Configuration, BASE_PATH } from "@empowered/api";
import { Accounts } from "@empowered/constants";
import { Observable } from "rxjs";
import { MPGroupAccountService } from "./mpgroup-account.service";

@Injectable({
    providedIn: "root",
})
export class PageLogService {
    configuration = new Configuration();
    protected basePath = "/api";
    mpGroupAccount$: Observable<Accounts>;

    constructor(
        protected httpClient: HttpClient,
        @Optional() configuration: Configuration,
        @Optional() @Inject(BASE_PATH) basePath: string,
        private mpGroupAccountService: MPGroupAccountService,
    ) {
        this.mpGroupAccount$ = this.mpGroupAccountService.mpGroupAccount$;
        if (configuration) {
            this.configuration = configuration;
            this.configuration.basePath = configuration.basePath || basePath || this.basePath;
        } else {
            this.configuration.basePath = basePath || this.basePath;
        }
    }
    /**
     * This method updates the page log
     * @param uri page log object
     * @param mpGroup group id
     * @returns observable of http response
     */
    updatePageLog(uri: unknown, mpGroup?: string): Observable<HttpResponse<any>> {
        let header = new HttpHeaders();
        header = header.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/log/pageLog`;
        return this.httpClient.put(apiEndPoint, uri, { headers: header, observe: "response" });
    }
}
