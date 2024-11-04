import { StaticUtilService } from "@empowered/ngxs-store";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { Paymetric, FormField } from "./paymetric.model";
import { switchMap } from "rxjs/operators";
import { PayMetricData } from "@empowered/constants";

@Injectable({
    providedIn: "root",
})
// This service is not from Aflac or Montoya, its a paymetric service use to validate Credit card details.
export class PaymetricService {
    constructor(private http: HttpClient, private readonly staticUtilService: StaticUtilService) {}
    isValidCard(value: string, token: string, id: string): Observable<PayMetricData> {
        const formField: FormField[] = [{ Name: "CreditCardNumber", Value: value, IsToTokenize: true }];
        const payload: Paymetric = {
            AccessToken: token,
            FormFields: formField,
            MerchantGuid: id,
        };

        return this.staticUtilService
            .cacheConfigValue("paymetric.XiInterceptUrl")
            .pipe(switchMap((paymetricUrl) => this.http.post<PayMetricData>(paymetricUrl, payload)));
    }
}
