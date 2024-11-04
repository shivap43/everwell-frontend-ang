import { EmailSMSAudit } from "./models/email-sms-audit.model";
import { Inject, Injectable, Optional } from "@angular/core";
import { Observable } from "rxjs";
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from "@angular/common/http";
import { Configuration } from "../configuration";
import { BASE_PATH } from "../variables";

import { AbstractNotificationModel, NotificationCode } from "@empowered/constants";

const ENROLLMENTS_PENDING_TRANSMITTAL = "ENROLLMENTS_PENDING_TRANSMITTAL";
@Injectable({
    providedIn: "root",
})
export class NotificationService {
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

    // fetching single notification data, we cannot use interceptor as we need to call for all account and specific account
    getNotification(code: string, mpGroup?: number): Observable<AbstractNotificationModel[]> {
        const apiEndPoint = this.configuration.basePath + "/notifications/codes/" + code;
        let header = new HttpHeaders();
        header = header.set("MP-Group", mpGroup ? mpGroup.toString() : "");

        return this.httpClient.get<AbstractNotificationModel[]>(apiEndPoint, {
            headers: header,
        });
    }
    /**
     * fetching multiple notifications data
     * we cannot use interceptor as we need to call for all account and specific account
     * @param portal logged in portal
     * @param mpGroup mpGroup if group specific notifications needs to be fetched
     */
    getNotifications(portal: string, mpGroup?: number): Observable<AbstractNotificationModel[]> {
        const apiEndPoint = this.configuration.basePath + "/notifications";
        let header = new HttpHeaders();
        header = header.set("mp-portal", portal.toString());
        if (mpGroup) {
            header = header.set("MP-Group", mpGroup.toString());
        }
        return this.httpClient.get<AbstractNotificationModel[]>(apiEndPoint, {
            headers: header,
        });
    }

    /**
     * Gets new hire rules based in ruleId
     * @param portal portal the user is logged in to
     * @param mpGroup mpGroup of the selected group
     * @return {Observable} returns observable of NotificationCode[]
     */
    getNotificationCodes(portal: string, mpGroup?: number): Observable<NotificationCode[]> {
        const apiEndPoint = this.configuration.basePath + "/notifications/codes";
        let header = new HttpHeaders();
        header = header.set("mp-portal", portal.toString());
        header = header.set("MP-Group", mpGroup != null ? mpGroup.toString() : " ");
        return this.httpClient.get<NotificationCode[]>(apiEndPoint, {
            headers: header,
        });
    }

    dismissNotifications(codeId: number, portal: string): Observable<HttpResponse<any>> {
        const apiEndPoint = this.configuration.basePath + `/notifications/codes/${codeId}/dismiss`;
        let header = new HttpHeaders();
        header = header.set("mp-portal", portal);
        header = header.set("MP-Group", "");
        return this.httpClient.post<any>(apiEndPoint, null, {
            headers: header,
        });
    }

    dismissNotification(notificationId: number, portal: string): Observable<HttpResponse<any>> {
        const apiEndPoint = this.configuration.basePath + `/notifications/${notificationId}`;
        let header = new HttpHeaders();
        header = header.set("mp-portal", portal);
        header = header.set("MP-Group", "");
        return this.httpClient.post<any>(apiEndPoint, null, {
            headers: header,
        });
    }
    /**
     *  Updating the email opt out for the notifications, when opted
     *  not sending the nonessential email or text notifications to admin and employees
     * @param isEmailOptOut : boolean value, whether the user opted for the notifications not to send
     * @param mpGroup : mpGroup id
     * @returns Observable<HttpResponse<unknown>>
     */
    updateEmailOptOut(isEmailOptOut: boolean, mpGroup?: number): Observable<HttpResponse<unknown>> {
        const apiEndPoint = this.configuration.basePath + `/notifications/emailSMS/optOut?optOut=${isEmailOptOut}`;
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup != null ? mpGroup.toString() : "");
        return this.httpClient.put<HttpResponse<unknown>>(apiEndPoint, null, {
            headers: headers,
            observe: "response",
        });
    }
    /**
     * get the email opt out for the notifications
     * @param mpGroup : mpGroup id
     * @return: boolean value
     */
    getOptOutOfNotifications(mpGroup?: number): Observable<boolean> {
        const apiEndPoint = this.configuration.basePath + "/notifications/emailSMS/optOut";
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup != null ? mpGroup.toString() : "");
        return this.httpClient.get<boolean>(apiEndPoint, {
            headers: headers,
        });
    }
    /**
     * Gets emails and/or texts sent to either admins or an employee of a group
     * @param memberId if defined, represents the member whose mails/texts are to be fetched.
     * @returns observable of the emails/texts
     */
    getEmailSmsAudit(memberId?: number): Observable<EmailSMSAudit[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");
        let params = new HttpParams();
        if (memberId) {
            params = params.set("memberId", memberId ? memberId.toString() : "");
        }
        return this.httpClient.get<EmailSMSAudit[]>(`${this.configuration.basePath}/notifications/emailSMS/audit`, {
            headers,
            params,
        });
    }
    /**
     * This method is used to get notification display text for specific notification code
     * @param notifications contains all notification related to an account
     * @param overrideNotificationText contains override notification text
     * @returns updated notification details related to an account
     */
    getNotificationDisplayText(notifications: AbstractNotificationModel[], overrideNotificationText: string): AbstractNotificationModel[] {
        return notifications.map((eachNotification: AbstractNotificationModel) => ({
            ...eachNotification,
            displayText:
                eachNotification.code.code === ENROLLMENTS_PENDING_TRANSMITTAL ? overrideNotificationText : eachNotification.displayText,
        }));
    }
}
