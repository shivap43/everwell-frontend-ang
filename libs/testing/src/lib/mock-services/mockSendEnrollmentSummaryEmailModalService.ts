import { ComponentType } from "@angular/cdk/portal";
import { HttpHeaders, HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { SendReminderMode } from "../../../../api/src";
import { MemberContactListDisplay } from "../../../../constants/src";
import { SendEnrollmentSummaryEmailModalComponent } from "../../../../ui/src";

export const mockSendEnrollmentSummaryEmailModalService = {
    email: "abc@gmail.com",
    phone: "7891234560",
    "#afterClosed$": undefined,
    "#email": "",
    "#phone": "",
    defaultHeaders: new HttpHeaders(),
    configuration: undefined,
    basePath: "",
    empoweredModalService: undefined,
    httpClient: HttpClient,
    afterClosed$: undefined,
    open: (contactList: MemberContactListDisplay[], dialog: ComponentType<SendEnrollmentSummaryEmailModalComponent>) => of({}),
    send: (mpGroup: number, memberId: number, contactInfo: SendReminderMode) => of({}),
    getEmailAndPhoneDetails: (mpGroup: any, memberId: any) => of({}),
};
