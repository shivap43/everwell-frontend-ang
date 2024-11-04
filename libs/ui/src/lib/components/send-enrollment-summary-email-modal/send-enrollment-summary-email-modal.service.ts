import { Inject, Injectable, Optional } from "@angular/core";
import { BehaviorSubject, Observable, of, Subject } from "rxjs";
import { EmpoweredModalService } from "@empowered/common-services";
import { Contact, SendEnrollmentSummaryEmailModalResponseData } from "./send-enrollment-summary-email-modal.model";
import { MemberContactListDisplay } from "@empowered/constants";
import { take, tap } from "rxjs/operators";
import { ComponentType } from "@angular/cdk/overlay";
import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { BASE_PATH, Configuration, SendReminderMode } from "@empowered/api";

@Injectable({
    providedIn: "root",
})
export class SendEnrollmentSummaryEmailModalService<T> {
    #afterClosed$ = new Subject<SendEnrollmentSummaryEmailModalResponseData>();
    #email: string;
    #phone: string;
    defaultHeaders = new HttpHeaders();
    configuration = new Configuration();
    protected basePath = "/api";

    constructor(
        private readonly empoweredModalService: EmpoweredModalService,
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

    /**
     * @description Fires when the modal closes
     *
     * @return {Observable<SendEnrollmentSummaryEmailModalResponseData>} An observable that emits the data returned
     *     by the afterClosed$ subject.
     */
    get afterClosed$(): Observable<SendEnrollmentSummaryEmailModalResponseData> {
        return this.#afterClosed$.asObservable();
    }

    /**
     * @description The email to send the summary message to
     */
    get email(): string {
        return this.#email;
    }

    /**
     * @description Sets the email to send the summary message to
     * @param {string} email
     */
    set email(email: string) {
        this.#email = email;
    }

    /**
     * @description The phone to send the summary message to
     */
    get phone(): string {
        return this.#phone;
    }

    /**
     * @description Sets the phone to send the summary message to
     * @param {string} phone
     */
    set phone(phone: string) {
        this.#phone = phone;
    }

    /**
     * @description Opens the instance and emits an "open" event.
     * @returns {void}
     */
    open(contactList: MemberContactListDisplay[], dialog: ComponentType<T>): void {
        this.empoweredModalService
            .openDialog(dialog, { data: { contactList } })
            .afterClosed()
            .pipe(take(1))
            .subscribe((response: SendEnrollmentSummaryEmailModalResponseData): void => this.#afterClosed$.next(response));
    }

    /**
     * @description Sends the summary email to the given email address
     * @retukrns {Observable<void>}
     */
    send(mpGroup: number, memberId: number, contactInfo: SendReminderMode): Observable<HttpResponse<void>> {
        const httpOptions = {
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };
        return this.httpClient.post<HttpResponse<void>>(
            `${this.configuration.basePath}/members/${memberId}/enrollments/summary`,
            contactInfo,
            httpOptions,
        );
    }

    /**
     * @description Fetches the contact details of the user
     * @param {string} mpGroup The group id which the user belongs to
     * @param {memeberId} memberId The memberId of the user
     */
    getEmailAndPhoneDetails(mpGroup, memberId): Observable<Contact[]> {
        let headers = this.defaultHeaders;
        headers = headers.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<Contact[]>(`${this.configuration.basePath}/members/${memberId}/contacts`, {
            headers,
        });
    }
}
