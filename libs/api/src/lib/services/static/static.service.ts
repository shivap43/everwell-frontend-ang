import { HttpClient, HttpParams, HttpHeaders, HttpResponse } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Observable } from "rxjs";
import { Configuration } from "../configuration";
import { BASE_PATH } from "../variables";
import { CallCenter, CallCenterProducersWithAccountInfo, County } from "./models";
import { Configurations, CountryState } from "@empowered/constants";

@Injectable({
    providedIn: "root",
})
export class StaticService {
    configuration = new Configuration();
    protected basePath = "/api";

    constructor(private http: HttpClient, @Optional() @Inject(BASE_PATH) basePath: string, @Optional() configuration: Configuration) {
        if (configuration) {
            this.configuration = configuration;
            this.configuration.basePath = configuration.basePath || basePath || this.basePath;
        } else {
            this.configuration.basePath = basePath || this.basePath;
        }
    }

    getStates(): Observable<CountryState[]> {
        return this.http.get<CountryState[]>(`${this.configuration.basePath}/static/states`);
    }
    /**
     *
     * This function is used to validate the state and zip code whether the zip code is belongs to that state.
     * @param state State abbreviation
     * @param zip  zip code of respective state
     * @returns Observable<HttpResponse<void>>
     */
    validateStateZip(state: string, zip: string): Observable<HttpResponse<void>> {
        const data = {
            state: state,
            zip: zip,
        };
        return this.http.get<void>(`${this.configuration.basePath}/static/validateStateZip`, {
            params: data,
            observe: "response",
        });
    }

    getCounties(state: string): Observable<County[]> {
        return this.http.get<County[]>(
            `${this.configuration.basePath}/static/counties?state=${state}
        `,
        );
    }
    getCities(state: string): Observable<string[]> {
        return this.http.get<string[]>(
            `${this.configuration.basePath}/static/cities?state=${state}
      `,
        );
    }

    getEmailTypes(): Observable<string[]> {
        return this.http.get<string[]>(`${this.configuration.basePath}/static/emailTypes
        `);
    }

    getPhoneNumberTypes(): Observable<string[]> {
        return this.http.get<string[]>(`${this.configuration.basePath}/static/phoneNumberTypes
        `);
    }

    getSuffixes(): Observable<string[]> {
        return this.http.get<string[]>(`${this.configuration.basePath}/static/suffixes
    `);
    }

    getCountries(): Observable<string[]> {
        return this.http.get<string[]>(`${this.configuration.basePath}/static/countries
    `);
    }

    getEthnicities(): Observable<string[]> {
        return this.http.get<string[]>(`${this.configuration.basePath}/static/ethnicities
    `);
    }

    getGenders(): Observable<string[]> {
        return this.http.get<string[]>(`${this.configuration.basePath}/static/genders
    `);
    }

    getMaritalStatuses(): Observable<string[]> {
        return this.http.get<string[]>(`${this.configuration.basePath}/static/maritalStatuses
    `);
    }

    getUSCitizenshipOptions(): Observable<string[]> {
        return this.http.get<string[]>(`${this.configuration.basePath}/static/usCitizenshipOptions
    `);
    }

    getConfigurations(names: string, mpGroup?: number, partnerId?: string): Observable<Configurations[]> {
        let headers: any;
        let params = new HttpParams().set("names", names);
        params = partnerId ? params.set("partnerId", partnerId) : params;
        if (mpGroup) {
            headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        } else {
            headers = new HttpHeaders();
        }
        return this.http.get<Configurations[]>(`${this.configuration.basePath}/static/configs`, {
            params: params,
            headers: headers,
            observe: "body",
        });
    }
    getRegex(names: string): Observable<any> {
        const params = new HttpParams().set("names", names);
        return this.http.get<any>(`${this.configuration.basePath}/static/regex`, {
            params: params,
            observe: "body",
        });
    }

    getCallCenterProducersWithAccountInfo(
        callCenterId: number,
        search: string,
        expand?: string,
    ): Observable<CallCenterProducersWithAccountInfo[]> {
        let params = new HttpParams();
        params = params.set("search", search);
        if (expand) {
            params = params.set("expand", expand);
        }
        return this.http.get<CallCenterProducersWithAccountInfo[]>(
            `${this.configuration.basePath}/static/callCenters/${callCenterId}/producers`,
            {
                params: params,
            },
        );
    }

    getCallCenters(): Observable<CallCenter[]> {
        return this.http.get<CallCenter[]>(`${this.configuration.basePath}/static/callCenters`);
    }

    getCallCenter(callCenterId: number): Observable<CallCenter> {
        return this.http.get<CallCenter>(`${this.configuration.basePath}/static/callCenters/${callCenterId}`);
    }
    /**
     * This function is used to get base url
     * @returns Observable<string>
     */
    getFileServer(): Observable<string> {
        return this.http.get(`${this.configuration.basePath}/static/fileServer`, {
            responseType: "text",
        });
    }

    /**
     * Returns US time zones.
     *
     * @returns an observable of a list of US timezones
     */
    getTimeZones(): Observable<string[]> {
        return this.http.get<string[]>(`${this.configuration.basePath}/static/timeZones`);
    }
}
