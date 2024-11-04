import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { LanguageModel } from "../../shared/models/language.model";
import { ConfigModel } from "../../shared/models/config.model";
import { Observable } from "rxjs";
import { Configuration } from "../../configuration";
import { BASE_PATH } from "../../variables";
import { BreakpointSizes } from "@empowered/constants";

@Injectable({
    providedIn: "root",
})
export class CommonService {
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
    /**
     * Getting the landing language before authentication
     *
     * @param tagName language tag
     * @param vocabulary either spanish or english
     * @returns list of matching languages based on the tagname and vocabulary
     */
    getLandingLanguages(tagName: string, vocabulary?: string): Observable<LanguageModel[]> {
        vocabulary = vocabulary === undefined ? "" : vocabulary;
        const params = new HttpParams().set("vocabulary", vocabulary).set("tagNames", tagName);
        return this.http.get<LanguageModel[]>(`${this.configuration.basePath}/static/landingLanguages`, {
            params,
        });
    }
    /**
     * @param tagname language tagname which is string type
     * @param vocabulary either spanish or english
     * @param date date created
     * @param partnerId
     * @param breakpointSize either "XS", "SM", "MD", "LG", or "XL";
     * @param mpGroup group id for specific user which is string type
     * @returns list of matching languages based on all the params above
     */
    getLanguages(
        tagName: string,
        vocabulary?: string,
        date?: string,
        partnerId?: string,
        breakpointSize?: BreakpointSizes,
        mpGroup?: string,
    ): Observable<any> {
        vocabulary = vocabulary === undefined ? "" : vocabulary;
        date = date === undefined ? "" : date;
        let headers: HttpHeaders = new HttpHeaders();
        if (mpGroup) {
            headers = headers.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        }
        let params = new HttpParams().set("tagNames", tagName);
        if (vocabulary) {
            params = params.append("vocabulary", vocabulary);
        }
        if (date) {
            params = params.append("date", date);
        }
        if (partnerId) {
            params = params.append("partnerId", partnerId);
        }
        if (breakpointSize) {
            params = params.append("breakpointSize", breakpointSize);
        }
        return this.http.get<LanguageModel[]>(`${this.configuration.basePath}/static/languages`, {
            headers,
            params,
        });
    }

    getConfigurations(names: string): Observable<ConfigModel[]> {
        const httpOptions = {
            params: {
                names,
            },
        };
        return this.http.get<ConfigModel[]>("/api/static/configs", httpOptions);
    }
}
