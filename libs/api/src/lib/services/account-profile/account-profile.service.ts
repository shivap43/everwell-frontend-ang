import { HttpClient, HttpHeaders, HttpResponse, HttpParams } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Observable } from "rxjs";
import { Configuration } from "../configuration";
import { BASE_PATH } from "../variables";
import { Organization, ClassType, RegionType, Region } from "./models";
import { switchMap, tap } from "rxjs/operators";
import { ClassNames, CreateClass } from "../member";
import { RiskClass } from "@empowered/constants";

@Injectable({
    providedIn: "root",
})
export class AccountProfileService {
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
    getOrganizations(mpGroup: string): Observable<Organization[]> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<Organization[]>(`${this.configuration.basePath}/account/organizations`, {
            headers: headers,
        });
    }

    /**
     * This method is used to create organizations
     * @param createMemberObj is create member object which has to be passed to API
     * @param mpGroup is the group number of the account
     * @returns Observable of type HttpResponse<void>
     */
    createOrganization(createMemberObj: Organization, mpGroup?: string): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup : "");
        return this.httpClient.post<void>(`${this.configuration.basePath}/account/organizations`, createMemberObj, {
            headers: headers,
            observe: "response",
        });
    }

    getClassTypes(mpGroup?: string): Observable<ClassType[]> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<ClassType[]>(`${this.configuration.basePath}/account/classTypes`, {
            headers: headers,
        });
    }
    getClasses(classTypeId: any, mpGroup?: string): Observable<ClassNames[]> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");

        return this.httpClient.get<ClassNames[]>(`${this.configuration.basePath}/account/classTypes/${classTypeId}/classes`, {
            headers: headers,
        });
    }
    getClassTypeClassMap(mapKey: string = "ID", visibleOnly: boolean = false): Observable<any> {
        const headers = new HttpHeaders().set("MP-Group", "");
        const params = new HttpParams().set("mapKey", mapKey).set("visibleOnly", visibleOnly.toString());
        return this.httpClient.get<any>(`${this.configuration.basePath}/account/classTypeClassMap`, {
            headers: headers,
            params: params,
        });
    }
    // Class type
    getClassType(classTypeId: number, mpGroup: string): Observable<ClassType> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<ClassType>(`${this.configuration.basePath}/account/classTypes/${classTypeId}`, {
            headers: headers,
        });
    }
    createClassType(createClassTypeReq: { classType: ClassType; class: ClassNames }, mpGroup: string): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<void>(`${this.configuration.basePath}/account/classTypes`, createClassTypeReq, {
            headers: headers,
            observe: "response",
        });
    }
    updateClassType(updateClassTypeReq: ClassType, classTypeId: number, mpGroup: string): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<void>(`${this.configuration.basePath}/account/classTypes/${classTypeId}`, updateClassTypeReq, {
            headers: headers,
            observe: "response",
        });
    }
    deleteClassType(classTypeId: number, mpGroup: string): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete<void>(`${this.configuration.basePath}/account/classTypes/${classTypeId}`, {
            headers: headers,
            observe: "response",
        });
    }

    // Class
    getClass(classTypeId: number, classId: number, mpGroup: string): Observable<ClassNames> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<ClassNames>(
            `${this.configuration.basePath}/account/classTypes/${classTypeId}/classes/${classId}
            `,
            {
                headers: headers,
            },
        );
    }
    /**
     *
     *@description HTTP service function to create class
     * @param {CreateClass} createClassReq
     * @param {number} classTypeId
     * @param {string} mpGroup
     * @returns {Observable<HttpResponse<void>>}
     * @memberof AccountProfileService
     */
    createClass(createClassReq: CreateClass, classTypeId: number, mpGroup: string): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<void>(`${this.configuration.basePath}/account/classTypes/${classTypeId}/classes`, createClassReq, {
            headers: headers,
            observe: "response",
        });
    }
    updateClass(updateClassReq: ClassType, classTypeId: number, classId: number, mpGroup: string): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<void>(
            `${this.configuration.basePath}/account/classTypes/${classTypeId}/classes/${classId}`,
            updateClassReq,
            {
                headers: headers,
                observe: "response",
            },
        );
    }
    deleteClass(classTypeId: number, classId: number, mpGroup: string): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete<void>(`${this.configuration.basePath}/account/classTypes/${classTypeId}/classes/${classId}`, {
            headers: headers,
            observe: "response",
        });
    }
    // gets all the existing region types
    getRegionTypes(mpGroup?: number): Observable<RegionType[]> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup != null ? mpGroup.toString() : "");
        return this.httpClient.get<RegionType[]>(`${this.configuration.basePath}/account/regionTypes`, {
            headers: headers,
        });
    }
    // gets all the existing regions under particular region type
    getRegions(regionTypeId: number, mpGroup?: number): Observable<Region[]> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup != null ? mpGroup.toString() : "");
        return this.httpClient.get<Region[]>(`${this.configuration.basePath}/account/regionTypes/${regionTypeId}/regions`, {
            headers: headers,
        });
    }

    // Region type
    getRegionType(regionTypeId: number, mpGroup: number): Observable<RegionType> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<RegionType>(`${this.configuration.basePath}/account/regionTypes/${regionTypeId}`, {
            headers: headers,
        });
    }
    // creates region type
    createRegionType(createRegionTypeReq: RegionType, mpGroup: number): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<void>(`${this.configuration.basePath}/account/regionTypes`, createRegionTypeReq, {
            headers: headers,
            observe: "response",
        });
    }
    // editing a region type
    updateRegionType(updateRegionTypeReq: RegionType, regionTypeId: number, mpGroup: number): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<void>(`${this.configuration.basePath}/account/regionTypes/${regionTypeId}`, updateRegionTypeReq, {
            headers: headers,
            observe: "response",
        });
    }
    // removes region type from the list
    deleteRegionType(regionTypeId: number, mpGroup: number): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete<void>(`${this.configuration.basePath}/account/regionTypes/${regionTypeId}`, {
            headers: headers,
            observe: "response",
        });
    }
    // get Region for particular region type
    getRegion(regionTypeId: number, regionId: number, mpGroup: number): Observable<Region> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<Region>(
            `${this.configuration.basePath}/account/regionTypes/${regionTypeId}/regions/${regionId}
        `,
            {
                headers: headers,
            },
        );
    }
    // creating a region
    createRegion(createRegionReq: Region, regionTypeId: number, mpGroup: number): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.post<void>(`${this.configuration.basePath}/account/regionTypes/${regionTypeId}/regions`, createRegionReq, {
            headers: headers,
            observe: "response",
        });
    }
    // editing a region
    updateRegion(updateRegionReq: Region, regionTypeId: number, regionId: number, mpGroup: number): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.put<void>(
            `${this.configuration.basePath}/account/regionTypes/${regionTypeId}/regions/${regionId}`,
            updateRegionReq,
            {
                headers: headers,
                observe: "response",
            },
        );
    }
    // removes region from the list
    deleteRegion(regionTypeId: number, regionId: number, mpGroup: number): Observable<HttpResponse<void>> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.delete<void>(`${this.configuration.basePath}/account/regionTypes/${regionTypeId}/regions/${regionId}`, {
            headers: headers,
            observe: "response",
        });
    }
    validatePostalRange(regionTypeId: number, start: string, end: string, mpGroup: number): Observable<any> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().set("start", start).set("end", end);
        return this.httpClient.get<any>(`${this.configuration.basePath}/account/regionTypes/${regionTypeId}/validatePostalRange`, {
            headers: headers,
            params: params,
        });
    }
    getAccountCarrierRiskClasses(carrierId: number, mpGroup: number): Observable<RiskClass[]> {
        const headers = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const params = new HttpParams().set("carrierId", carrierId.toString());
        return this.httpClient.get<RiskClass[]>(`${this.configuration.basePath}/account/carrierRiskClasses`, {
            headers: headers,
            params: params,
        });
    }

    /**
     * This function is used to get PEO classes/Departments from accountProfileService.
     * @param mpGroup mpgroup of account
     * @returns Observable of type ClassName
     */
    getEmployeePEOClasses(mpGroup: string, peoCarrierId: number): Observable<ClassNames[]> {
        // passing mpGroup to getClassTypes api to get class types and based on class type id = 1 we will fetch classes.
        return this.getClassTypes(mpGroup).pipe(
            switchMap((classTypes) => this.getClasses(classTypes.find((classType) => classType.carrierId === peoCarrierId)?.id)),
        );
    }

    /**
     * This function is used to get Organizations/Departments from accountProfileService.
     * @param mpGroup mpgroup of account
     * @param isAflacUSer boolean flag which is true if user is aflac specific.
     * @param corporateString string of "CORPORATE"
     * @param undefinedString string of "UNDEFINED"
     * @returns Observable of type Organization
     */
    getOrganizationData(
        mpGroup: string,
        isAflacUSer: boolean,
        corporateString: string,
        undefinedString: string,
    ): Observable<Organization[]> {
        // passing mpGroup to getOrganizations api to get organizations/Departments.
        let organizations = [];
        return this.getOrganizations(mpGroup).pipe(
            tap((organizationsResp) => {
                organizations = isAflacUSer
                    ? organizationsResp.map((organization) => {
                        organization.name = organization.name === corporateString ? undefinedString : organization.name;
                        return organization;
                    })
                    : organizationsResp;
            }),
        );
    }
}
