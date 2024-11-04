import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Configuration } from "../configuration";
import { BASE_PATH } from "../variables";
import { Observable, of } from "rxjs";
import { PaymentType, TempusSessionObjectModel } from "@empowered/constants";

@Injectable({
    providedIn: "root",
})
export class PaymentService {
    headers = new HttpHeaders();
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
     * Gets session ID and tempusTokenIdentityGuid to open iframe
     * @param paymentType if paymentType provided is bank_draft then bank_draft iframe will be open and
     * if paymentType is not provided then credit card iframe will be open
     * @returns tempus session object
     */
    getSession(paymentType?: PaymentType): Observable<TempusSessionObjectModel> {
        let params = new HttpParams();
        if (paymentType) {
            params = params.set("paymentType", paymentType);
        }
        return this.httpClient.get<TempusSessionObjectModel>(`${this.configuration.basePath}/tempus/session`, {
            params,
        });
    }
}
