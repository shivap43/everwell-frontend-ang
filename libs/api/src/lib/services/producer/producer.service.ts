import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, Optional, Inject } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { CountryState } from "@empowered/constants";
import { Configuration } from "../configuration";
import { BASE_PATH } from "../variables";
import { ProducerListItem, ReceivedAccountInvitation, ProducerInformation } from "./models";
@Injectable({
    providedIn: "root",
})
export class ProducerService {
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

    updateSubProducerList(value: boolean): void {
        this.isUpdated.next(value);
    }
    getAllProducersLicensedStates(mpGroup: number): Observable<CountryState[]> {
        const httpOptions = {
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<CountryState[]>(`${this.configuration.basePath}/producers/licensedStates`, httpOptions);
    }

    producerSearch(searchParams: any): Observable<any> {
        return this.httpClient.get<any>(`${this.configuration.basePath}/producers/search`, {
            headers: this.defaultHeaders,
            params: searchParams,
        });
    }
    /**
     *@description service method to retrieve producer information
     * @param {string} producerId is mandatory
     * @returns {Observable<ProducerInformation>} It returns Observable of Producer Information
     * @memberof ProducerService
     */
    getProducerInformation(producerId: string): Observable<ProducerInformation> {
        return this.httpClient.get<ProducerInformation>(`${this.configuration.basePath}/producers/${producerId}/producerInformation`);
    }

    getRecentlyInvitedProducers(producerId: string, mpGroup: number): Observable<ProducerListItem[]> {
        const httpOptions = {
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<ProducerListItem[]>(
            `${this.configuration.basePath}/producers/${producerId}/recentlyInvited`,
            httpOptions,
        );
    }

    getReceivedAccountInvitations(producerId: string): Observable<ReceivedAccountInvitation[]> {
        return this.httpClient.get<ReceivedAccountInvitation[]>(
            `${this.configuration.basePath}/producers/${producerId}/accountInvitations`,
        );
    }

    respondToInvitation(producerId: string, accountId: string, action: string): Observable<any> {
        return this.httpClient.post<any>(`${this.configuration.basePath}/producers/${producerId}/accountInvitations/${accountId}`, action, {
            headers: this.defaultHeaders.set("Content-Type", "application/json"),
        });
    }
}
