import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Configuration } from "../configuration";
import { BASE_PATH } from "../variables";
import { Observable, BehaviorSubject } from "rxjs";
import { Admin } from "@empowered/constants";

@Injectable({
    providedIn: "root",
})
export class AdminService {
    defaultHeaders = new HttpHeaders();
    configuration = new Configuration();
    isUpdated = new BehaviorSubject<any>({ isUpdated: false });
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

    updateAdminList(value: boolean): void {
        this.isUpdated.next(value);
    }
    getAdmin(adminId: number, expand?: string): Observable<Admin> {
        const params = new HttpParams();
        if (expand) {
            params.append("expand", expand);
        }
        return this.httpClient.get<Admin>(`${this.configuration.basePath}/admins/${adminId}`, {
            params: params,
        });
    }
    getAccountAdmins(mpGroup?: number, expand?: "roleId" | "reportsToId" | "roleId,reportsToId"): Observable<Admin[]> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = expand ? new HttpParams().append("expand", expand) : new HttpParams();
        return this.httpClient.get<Admin[]>(`${this.configuration.basePath}/account/admins`, {
            headers: this.defaultHeaders,
            params: params,
        });
    }
    getAccountAdminRoles(mpGroup?: number, expand?: string): Observable<Admin[]> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().append("expand", "roleId");
        return this.httpClient.get<Admin[]>(`${this.configuration.basePath}/account/admins/roles`, {
            headers: this.defaultHeaders,
            params: params,
        });
    }
    removeAsAccountAdmin(adminId: number, mpGroup?: number): Observable<Admin> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete<Admin>(`${this.configuration.basePath}/account/admins/${adminId}`, {
            headers: this.defaultHeaders,
        });
    }
    createAdmin(mpGroup: number, formBody: any): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/account/admins`;
        return this.httpClient.post<any>(apiEndPoint, formBody, {
            headers: this.defaultHeaders,
        });
    }
    updateAccountAdmin(admin: Admin, mpGroup?: number): Observable<string> {
        const id = admin.id;
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        this.defaultHeaders.set("Content-Type", "application/json");
        return this.httpClient.put<string>(`${this.configuration.basePath}/account/admins/${id}`, admin, {
            headers: this.defaultHeaders,
        });
    }
    searchAccountAdmins(query?: any): Observable<any> {
        let params = new HttpParams();
        if (query !== undefined) {
            for (const key in query) {
                if (query[key]) {
                    params = params.set(key, query[key]);
                }
            }
        }
        return this.httpClient.get<any>(`${this.configuration.basePath}/admins/accountAdmins/search`, {
            params: params,
        });
    }
    importAdmin(mpGroup: number, admin: unknown): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/account/admins/import`;
        this.defaultHeaders.set("Content-Type", "application/json");

        return this.httpClient.post<any>(apiEndPoint, admin, {
            headers: this.defaultHeaders,
        });
    }
    promoteMember(mpGroup: number, admin: unknown): Observable<any> {
        this.defaultHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = `${this.configuration.basePath}/account/admins/promote`;
        this.defaultHeaders.set("Content-Type", "application/json");
        return this.httpClient.post<any>(apiEndPoint, admin, { headers: this.defaultHeaders });
    }
    getAdminPreferences(adminId: number): Observable<any> {
        return this.httpClient.get<any>(`${this.configuration.basePath}/admins/${adminId}/preferences`);
    }
    getAdminContact(adminId: number): Observable<any> {
        return this.httpClient.get<any>(`${this.configuration.basePath}/admins/${adminId}/contact`);
    }
}
