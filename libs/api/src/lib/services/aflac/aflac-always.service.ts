import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { BASE_PATH } from "../variables";
import { Configuration } from "../configuration";
import { AflacAlwaysEnrollments, AflacAlwaysEnrollmentsSelection } from "@empowered/constants";
import { Observable } from "rxjs";
import { SendReminderMode } from "../member";

@Injectable({ providedIn: "root" })
export class AflacAlwaysService {
    private defaultHeaders = new HttpHeaders();
    private configuration = new Configuration();
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

    getAflacAlwaysEnrollments(mpGroupId: number, memberId: number): Observable<AflacAlwaysEnrollments[]> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroupId.toString());
        return this.httpClient.get<AflacAlwaysEnrollments[]>(
            this.configuration.basePath + `/aflac/members/${memberId}/enrollments/aflacAlways`,
            {
                headers: this.defaultHeaders,
            },
        );
    }

    submitAflacAlwaysEnrollments(
        mpGroupId: number,
        memberId: number,
        aflacAlwaysEnrollmentsResponse: AflacAlwaysEnrollmentsSelection,
    ): Observable<void> {
        this.defaultHeaders = this.defaultHeaders.set("MP-Group", mpGroupId.toString());
        return this.httpClient.post<void>(
            this.configuration.basePath + `/aflac/member/${memberId}/enrollments/aflacAlways`,
            aflacAlwaysEnrollmentsResponse,
            { headers: this.defaultHeaders },
        );
    }

    requestAflacAlwaysSignature(
        mpGroup: number,
        memberId: number,
        contactInfo: SendReminderMode,
        isReminder: boolean = false,
    ): Observable<HttpResponse<void>> {
        const httpOptions = {
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
            params: { isReminder },
        };
        return this.httpClient.post<HttpResponse<void>>(
            `${this.configuration.basePath}/aflac/members/${memberId}/enrollments/aflacAlways/pendingMessage`,
            contactInfo,
            httpOptions,
        );
    }
}
