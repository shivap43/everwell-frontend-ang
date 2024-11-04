import { ProposalCreateUpdate } from "./models/proposal-create-update.model";
import { BASE_PATH } from "./../variables";
import { Injectable, Optional, Inject } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from "@angular/common/http";
import { Configuration } from "../configuration";
import { Proposal, ProposalEmail, ProposalProductChoice, ProposalPlanChoices } from "./models";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { MissingEmployerFlyer } from "./models/missing-employer-flyer.model";
@Injectable({
    providedIn: "root",
})
export class ProposalService {
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

    getProposals(): Observable<Proposal[]> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");

        return this.httpClient.get<Proposal[]>(`${this.configuration.basePath}/proposals`, { headers });
    }

    createProposal(proposalCreate: ProposalCreateUpdate): Observable<string | null> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");

        return this.httpClient
            .post(`${this.configuration.basePath}/proposals`, proposalCreate, { headers, observe: "response" })
            .pipe(map((response) => response.headers.get("Location")));
    }

    getProposal(proposalId: number): Observable<Proposal> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");

        return this.httpClient.get<Proposal>(`${this.configuration.basePath}/proposals/${proposalId}`, { headers });
    }

    updateProposal(proposalId: number, proposalUpdate: ProposalCreateUpdate): Observable<HttpResponse<unknown>> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");

        return this.httpClient.put<HttpResponse<unknown>>(`${this.configuration.basePath}/proposals/${proposalId}`, proposalUpdate, {
            headers,
            observe: "response",
        });
    }

    deleteProposal(proposalId: number): Observable<HttpResponse<unknown>> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");

        return this.httpClient.delete<HttpResponse<unknown>>(`${this.configuration.basePath}/proposals/${proposalId}`, {
            headers,
            observe: "response",
        });
    }

    downloadProposal(
        proposalId: number,
        state: string,
        proposalType: "FULL" | "RATES_ONLY",
        zip?: string,
    ): Observable<HttpResponse<BlobPart>> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");
        headers = headers.set("Accept", "application/pdf,application/json");

        let params = new HttpParams();
        params = params.set("state", state);
        params = params.set("proposalType", proposalType);
        if (zip) {
            params = params.set("zip", zip);
        }

        return this.httpClient.get<BlobPart>(`${this.configuration.basePath}/proposals/${proposalId}/download`, {
            headers: headers,
            params: params,
            responseType: "blob" as "json",
            observe: "response",
        });
    }

    emailProposal(proposalId: number, proposalEmail: ProposalEmail): Observable<HttpResponse<unknown>> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");

        return this.httpClient.post<HttpResponse<unknown>>(`${this.configuration.basePath}/proposals/${proposalId}/email`, proposalEmail, {
            headers,
            observe: "response",
        });
    }

    getProposalProductChoices(proposalId: number): Observable<ProposalProductChoice[]> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");

        return this.httpClient.get<ProposalProductChoice[]>(`${this.configuration.basePath}/proposals/${proposalId}/products`, { headers });
    }

    saveProposalProductChoices(proposalId: number, proposalProductChoices: ProposalProductChoice[]): Observable<HttpResponse<unknown>> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");

        return this.httpClient.put<HttpResponse<unknown>>(
            `${this.configuration.basePath}/proposals/${proposalId}/products`,
            proposalProductChoices,
            { headers, observe: "response" },
        );
    }

    getProposalPlanChoices(proposalId: number): Observable<ProposalPlanChoices> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");

        return this.httpClient.get<ProposalPlanChoices>(`${this.configuration.basePath}/proposals/${proposalId}/products/plans`, {
            headers,
        });
    }

    saveProposalPlanChoices(proposalId: number, proposalPlanChoices: ProposalPlanChoices): Observable<HttpResponse<unknown>> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", "");

        return this.httpClient.put<HttpResponse<unknown>>(
            `${this.configuration.basePath}/proposals/${proposalId}/products/plans`,
            proposalPlanChoices,
            { headers, observe: "response" },
        );
    }

    /**
     * Method to invoke MissingEmployerFlyer info
     * @param proposalId
     * @param state
     */
    getMissingEmployerFlyer(proposalId: number, mpGroup: string, state?: string): Observable<MissingEmployerFlyer[]> {
        let params = new HttpParams();
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", mpGroup);
        if (state) {
            params = params.set("state", state);
        }
        return this.httpClient.get<MissingEmployerFlyer[]>(`${this.configuration.basePath}/proposals/${proposalId}/missingEmployerFlyer`, {
            headers: headers,
            params: params,
        });
    }
}
