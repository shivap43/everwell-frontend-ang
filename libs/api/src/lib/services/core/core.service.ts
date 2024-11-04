import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Configuration } from "../configuration";
import { BASE_PATH } from "../variables";
import { Carrier } from "./models/carrier.model";
import { RiskClass, CoverageLevelRule, CoverageLevel, Product, GetPlan, PlanSeries } from "@empowered/constants";
import { CarrierContactDetails } from "./models/carrier-contact-details.model";
import { GetForms } from "./models/getForms.model";
import { FormsRepository } from "./models/formsRepository.model";
import { FormFilters } from "./models/formFilters.model";
import { PlanDetailsBase, PlanDocument } from "./models";

@Injectable({ providedIn: "root" })
export class CoreService {
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

    getProducts(): Observable<Product[]> {
        return this.httpClient.get<Product[]>(`${this.configuration.basePath}/core/products`, {});
    }
    /**
     * http call to get product details for a particular product
     * @param: productId - the id of the product
     * @returns: Observable<Product> - details of the product
     */
    getProduct(productId: number): Observable<Product> {
        return this.httpClient.get<Product>(`${this.configuration.basePath}/core/products/` + productId, {});
    }

    /**
     * Get all carriers data
     * @param [stateCode]
     * @returns carriers
     */
    getCarriers(stateCode?: string): Observable<Carrier[]> {
        let params = new HttpParams();
        if (stateCode) {
            // passing state code to get legal name according to it
            params = params.append("stateCode", stateCode);
        }
        return this.httpClient.get<Carrier[]>(`${this.configuration.basePath}/core/carriers`, { params: params });
    }
    getCarrierContacts(carrier: any): Observable<CarrierContactDetails[]> {
        return this.httpClient.get<CarrierContactDetails[]>(`${this.configuration.basePath}/core/carriers/${carrier.id}/contacts`, {
            headers: this.defaultHeaders,
        });
    }
    /**
     * Function to get the coverage levels
     * @param planId plan id
     * @param coverageLevelId coverage level id
     * @param fetchRetainRiders need to fetch retain rider or not
     * @param stateCode state code
     * @returns Observable of array of CoverageLevel
     */
    getCoverageLevels(
        planId: string,
        coverageLevelId?: number,
        fetchRetainRiders?: boolean,
        stateCode?: string,
        includeRules?: boolean,
    ): Observable<CoverageLevel[]> {
        let apiEndPoint = `${this.configuration.basePath}/core/plans/${planId}/coverageLevels`;
        let params = new HttpParams();
        if (coverageLevelId) {
            apiEndPoint += "?parentPlanCoverageLevelId=" + coverageLevelId;
        }
        if (coverageLevelId && fetchRetainRiders) {
            apiEndPoint += "&fetchRetainRiders=" + fetchRetainRiders;
        }
        if (stateCode) {
            params = params.append("stateCode", stateCode);
        }
        if (includeRules) {
            params = params.append("includeRules", includeRules);
        }
        return this.httpClient
            .get<CoverageLevel[]>(apiEndPoint, { params: params })
            .pipe(
                map((element) => element.sort((a1: CoverageLevel, a2: CoverageLevel) => (a1.displayOrder ?? -1) - (a2.displayOrder ?? -1))),
            );
    }
    getCoverageLevel(coverageLevelId: string): Observable<CoverageLevel> {
        const apiEndPoint = this.configuration.basePath + "/core/coverageLevels/" + coverageLevelId;
        return this.httpClient.get<CoverageLevel>(apiEndPoint, {});
    }
    /**
     * http call to get the file server base-path
     * @returns: Observable<string> - the file server base-path
     */
    getFileServer(): Observable<string> {
        return this.httpClient.get(`${this.configuration.basePath}/static/fileServer`, {
            responseType: "text",
        });
    }

    getCoverageLevelRules(coverageLevelId: string): Observable<CoverageLevelRule[]> {
        const apiEndPoint = this.configuration.basePath + "/core/coverageLevels/" + coverageLevelId + "/rules";
        return this.httpClient.get<CoverageLevelRule[]>(apiEndPoint, {});
    }
    /**
     * This method is used to fetch plan documents to display on video and documents tab of plan details
     * @param planIds represents array of planIds
     * @param state represents the situs state
     * @param mpGroup represents the mpGroup Id
     * @param property represents the property
     * @param value represents the value
     * @param filter represents the filter - DEPRECATED DO NOT USE filter argument, will be removed in the near future
     * @param channel represents the channel
     * @param referenceDate referenceDate
     * @returns Observable of planDocuments array
     */
    getPlanDocuments(
        planIds: number[],
        state: string,
        mpGroup?: string,
        property?: string,
        value?: string,
        /**
         * @deprecated filter this argument will be removed in the near future since it isn't being used
         */
        filter?: unknown,
        channel?: string,
        referenceDate?: string,
    ): Observable<PlanDocument[]> {
        const httpOptions: {
            params: {
                [param: string]: string | string[];
            };
            headers: {
                [header: string]: string | string[];
            };
        } = {
            params: {
                state,
            },
            headers: {},
        };

        if (mpGroup) {
            httpOptions.headers["MP-Group"] = mpGroup ? mpGroup.toString() : "";
        }
        if (property !== undefined) {
            httpOptions.params.property = property;
        }
        if (channel !== undefined) {
            httpOptions.params.channel = channel;
        }
        if (value !== undefined) {
            httpOptions.params.value = value;
        }
        // add reference date is headers if its available
        if (referenceDate) {
            httpOptions.headers["referenceDate"] = referenceDate;
        }
        return this.httpClient.post<PlanDocument[]>(`${this.configuration.basePath}/core/plans/documents`, planIds, httpOptions);
    }
    /* Fetching plan details of a particular plan by passing the id */
    getPlanDetails(planId: number): Observable<PlanDetailsBase> {
        return this.httpClient.get<PlanDetailsBase>(`${this.configuration.basePath}/core/plans/` + planId + "/details", {});
    }
    getPlan(planId: number): Observable<GetPlan> {
        return this.httpClient.get<GetPlan>(`${this.configuration.basePath}/core/plans/${planId}?expand=productId`);
    }
    /**
     * Gets carrier with given carrier id
     * @param carrierId
     * @param [stateCode]
     * @returns carrier data
     */
    getCarrier(carrierId: number, stateCode?: string): Observable<Carrier> {
        let params = new HttpParams();
        if (stateCode) {
            // passing state code to get legal name according to it
            params = params.append("stateCode", stateCode);
        }
        return this.httpClient.get<Carrier>(`${this.configuration.basePath}/core/carriers/${carrierId}`, { params: params });
    }
    getRiskClasses(carrierId: number): Observable<RiskClass[]> {
        return this.httpClient.get<RiskClass[]>(`${this.configuration.basePath}/core/carriers/` + carrierId + "/riskClasses", {});
    }
    getCoverageLevelRule(coverageLevelId: string, state?: string, planId?: string): Observable<CoverageLevelRule> {
        const httpOptions: {
            params: {
                [param: string]: string | string[];
            };
            headers: {
                [header: string]: string | string[];
            };
        } = { params: {}, headers: {} };

        if (state) {
            httpOptions.params.state = state ? state.toString() : "";
        }

        if (planId) {
            httpOptions.params.planId = planId ? planId.toString() : "";
        }

        const apiEndPoint = `${this.configuration.basePath}/core/coverageLevels/${coverageLevelId}/rule?`;
        return this.httpClient.get<CoverageLevelRule>(apiEndPoint, httpOptions);
    }
    getCarrierRiskClasses(carrierId: string): Observable<RiskClass[]> {
        return this.httpClient.get<RiskClass[]>(`${this.configuration.basePath}/core/carriers/${carrierId}/riskClasses`);
    }
    /**
     * This function will return getForms endpoint observable
     * @param requestBody endpoint post request observable will be created with this request body
     * @returns Observable<FormsRepository[]>
     */
    getForms(requestBody: GetForms): Observable<FormsRepository[]> {
        return this.httpClient.post<FormsRepository[]>(`${this.configuration.basePath}/core/forms`, requestBody);
    }
    /**
     * This function will return getFormsFilters endpoint observable
     * @param requestBody endpoint post request observable will be created with this request body
     * @returns Observable<FormFilters>
     */
    getFormFilters(requestBody: GetForms): Observable<FormFilters> {
        return this.httpClient.post<FormFilters>(`${this.configuration.basePath}/core/forms/filters`, requestBody);
    }

    /**
     * Gets plan series
     * @returns plan series
     */
    getPlanSeries(): Observable<PlanSeries[]> {
        return this.httpClient.get<PlanSeries[]>(`${this.configuration.basePath}/core/plans/series`);
    }
}
