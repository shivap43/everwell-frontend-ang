import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Observable } from "rxjs";
import { Configuration } from "../configuration";
import { BASE_PATH } from "../variables";
import { AccountList, FilterParameters, AccountListResponse } from "./models";
import { PageableResponse } from "../shared/models/pageable.model";
import { AccountListType } from "../account/enums/account-list-type.enum";

@Injectable({
    providedIn: "root",
})
export class AccountListService {
    unassignedOnly = "unassignedOnly";
    configuration = new Configuration();
    protected basePath = "/api";
    constructor(protected http: HttpClient, @Optional() @Inject(BASE_PATH) basePath: string, @Optional() configuration: Configuration) {
        if (configuration) {
            this.configuration = configuration;
            this.configuration.basePath = configuration.basePath || basePath || this.basePath;
        } else {
            this.configuration.basePath = basePath || this.basePath;
        }
    }
    /**
     * @description Function to call listAccounts API
     * @param filterParam {FilterParameters}
     * @returns Account list in form of PageableResponse
     * @memberof AccountListService
     */
    listAccountsPageable(filterParam: FilterParameters): Observable<PageableResponse<AccountList>> {
        if (filterParam === null) {
            return this.http.get<PageableResponse<AccountList>>(`${this.configuration.basePath}/accountList`);
        }
        const params = this.setParams(filterParam);

        return this.http.get<PageableResponse<AccountList>>(`${this.configuration.basePath}/accountList`, {
            params: params,
        });
    }

    /**
     * @description Function to call accountlist API
     * @param filterParam {FilterParameters}
     * @returns {Observable<AccountListResponse>}
     * @memberof AccountListService
     */
    getListAccounts(filterParam: FilterParameters): Observable<AccountListResponse> {
        if (filterParam === null) {
            return this.http.get<AccountListResponse>(`${this.configuration.basePath}/accountList`);
        }
        const params = this.setParams(filterParam);

        return this.http.get<AccountListResponse>(`${this.configuration.basePath}/accountList`, { params: params });
    }

    /**
     * @description Function to set httpParams
     * @param filterParam
     * @returns HttpParams
     */
    setParams(filterParam: FilterParameters): HttpParams {
        let params = new HttpParams()
            .set("search", filterParam.search ? filterParam.search.toString() : "")
            .set("property", filterParam.property ? filterParam.property.toString() : "")
            .set("value", filterParam.value ? filterParam.value.toString() : "")
            .set("filter", filterParam.filter ? filterParam.filter.toString() : "")
            .set("page", filterParam.page ? filterParam.page.toString() : "")
            .set("size", filterParam.size ? filterParam.size.toString() : "");

        if (filterParam.unassignedOnly) {
            params = params.set(this.unassignedOnly, filterParam.unassignedOnly.toString());
        }
        if (filterParam.includeAllSubordinates) {
            params = params.set("includeAllSubordinates", filterParam.includeAllSubordinates.toString());
        }
        if (filterParam.filteredGroupList) {
            params = params.set("filteredGroupList", filterParam.filteredGroupList.toString());
        }
        return params;
    }

    /**
     * @description Function to call listAccounts API
     * @param filterParam {FilterParameters}
     * @returns {Observable<AccountList[]>}
     * @memberof AccountListService
     */
    listAccounts(filterParam: FilterParameters): Observable<AccountList[]> {
        if (filterParam === null) {
            return this.http.get<AccountList[]>(`${this.configuration.basePath}/accountList`);
        }
        const params = this.setParams(filterParam);

        return this.http.get<AccountList[]>(`${this.configuration.basePath}/accountList`, { params: params });
    }
    getAccount(mpGroup: string): Observable<any> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.http.get(`${this.configuration.basePath}/account`, { headers: headers });
    }
    /**
     * @description returns total number of accounts for the producer
     * @param producerId producer id of current producer
     * @param type account type enum
     * @param includeAllSubordinates boolean value
     * @returns total number of accounts for producer as Observable of number
     * @memberof AccountListService
     */
    getTotalAccounts(type: AccountListType, includeAllSubordinates: boolean, producerId?: number): Observable<number> {
        let params = new HttpParams().set("type", type).set("includeAllSubordinates", includeAllSubordinates.toString());
        if (producerId) {
            params = params.set("alternateProducerId", producerId.toString());
        }
        return this.http.get<number>(`${this.configuration.basePath}/accountList/total`, { params: params });
    }

    /**
     * Service to refesh Prospect account
     * @param mpGroup Group Id
     * @returns {Observable<void>}
     */
    refreshProspectAccount(mpGroup: number): Observable<void> {
        const params = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.http.put<void>(`${this.configuration.basePath}/aflac/account/refresh/prospectData`, {}, { headers: params });
    }
}
