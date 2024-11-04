import { Injectable, Optional, Inject } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { BASE_PATH } from "../variables";
import { Configuration } from "../configuration";
import { Observable } from "rxjs";
import { CheckoutStatus } from "./models/checkoutStatus.model";
import { InstalledOS } from "@empowered/constants";

@Injectable({
    providedIn: "root",
})
export class AppTakerService {
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
    setCheckoutAllowed(mpGroup: string, flagToSet: boolean): Observable<any> {
        const params = new HttpParams().set("checkoutAllowed", flagToSet.toString());
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put(this.basePath + "/apptaker/maintenance/checkoutAllowed", "", {
            params: params,
            headers: headers,
            observe: "response",
        });
    }
    overrideMaintenanceLock(mpGroup: string): Observable<any> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put(this.basePath + "/apptaker/maintenance/overrideLock", "", {
            headers: headers,
            observe: "response",
        });
    }
    getPasscode(mpGroup: string, id: number): Observable<any> {
        // TODO: remove hard coded device identifier id after api changes are merged on dev
        const params = id ? new HttpParams().set("producerId", id.toString()) : new HttpParams();
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "").set("MP-DeviceIdentifier", "WIN123D");
        return this.httpClient.get(this.basePath + "/apptaker/passcode", {
            headers: headers,
            responseType: "text",
            observe: "response",
            params: params,
        });
    }
    getCheckOutStatus(mpGroup: string): Observable<CheckoutStatus> {
        // TODO: remove hard coded device identifier id after api changes are merged on dev
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "").set("MP-DeviceIdentifier", "WIN123D");

        return this.httpClient.get<CheckoutStatus>(this.basePath + "/apptaker/status", {
            headers: headers,
        });
    }
    getCheckoutAllowed(mpGroup: string): Observable<any> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get(this.basePath + "/apptaker/maintenance/checkoutAllowed", {
            headers: headers,
        });
    }
    getMaintananceLock(mpGroup: string): Observable<any> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get(this.basePath + "/apptaker/maintenance/lock", {
            headers: headers,
        });
    }

    /**
     * gets Observable of Unplugged URL based on installed OS
     * @param installedOS indicates operating system
     * @returns Observable<string> Observable of Unplugged URL
     */
    getUnpluggedDownloadURL(installedOS: InstalledOS): Observable<string> {
        const headers = new HttpHeaders().set("MP-DeviceIdentifier", "UNPLUGGED");
        const params = new HttpParams().set("installedOS", installedOS);
        return this.httpClient.get(this.basePath + "/apptaker/presignedURL", {
            headers: headers,
            responseType: "text",
            params,
        });
    }
}
