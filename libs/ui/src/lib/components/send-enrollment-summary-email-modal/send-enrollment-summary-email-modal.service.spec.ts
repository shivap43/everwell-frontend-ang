import { TestBed } from "@angular/core/testing";

import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { Contact } from "./send-enrollment-summary-email-modal.model";
import { SendEnrollmentSummaryEmailModalService } from "./send-enrollment-summary-email-modal.service";
import { MAT_DIALOG_SCROLL_STRATEGY, MatDialog, MatDialogModule } from "@angular/material/dialog";
import { SendEnrollmentSummaryEmailModalComponent } from "./send-enrollment-summary-email-modal.component";
import { Overlay } from "@angular/cdk/overlay";
import { InjectionToken } from "@angular/core";
import { EmpoweredModalService } from "@empowered/common-services";
import { SendReminderMode } from "@empowered/api";

const MOCK_CONTACT_DATA: Contact = {
    addressed: {
        address1: "123 Maryland Street,",
        address2: "Central Avenue",
        city: "Sacramento",
        state: "CA",
        zip: "90001",
    },
    emailAddresses: [
        {
            email: "test@gmail.com",
            type: "PERSONAL",
            verified: true,
            primary: true,
            id: 1,
        },
    ],
    phoneNumbers: [
        {
            phoneNumber: 123456789,
            type: "HOME",
            isMobile: true,
            verified: true,
            primary: true,
            id: 1,
        },
    ],
    phoneNumber: "123456789",
    cellPhoneNumber: "123456789",
    email: "test@gmail.com",
    contactId: 1,
    contactType: "HOME",
    addressValidationDate: "2024-06-11T05:59:49",
    immediateContactPreference: "UNKNOWN",
    contactTimeOfDay: "MORNING",
};

describe("SendEnrollmentSummaryEmailModalService", () => {
    let service: SendEnrollmentSummaryEmailModalService<SendEnrollmentSummaryEmailModalComponent>;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                MatDialogModule,
                MatDialog,
                Overlay,
                {
                    provide: MAT_DIALOG_SCROLL_STRATEGY,
                    useValue: () => {},
                },
                SendEnrollmentSummaryEmailModalComponent,
                EmpoweredModalService,
            ],
        });
        service = TestBed.inject(SendEnrollmentSummaryEmailModalService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("getEmailAndPhoneDetails()", () => {
        it("should return email and phone details related to a group and member id", (done) => {
            expect.assertions(2);
            const mockContactDataArray = [MOCK_CONTACT_DATA];
            const memberId = 1;

            service.getEmailAndPhoneDetails(12345, 1).subscribe((data) => {
                expect(data).toBe(mockContactDataArray);
                done();
            });

            const req = httpTestingController.expectOne(`/api/members/${memberId}/contacts`);
            expect(req.request.method).toEqual("GET");
            req.flush(mockContactDataArray);
        });
    });

    describe("send()", () => {
        it("should send the summary email to the given address", () => {
            const memberId = 1;
            const mpGroup = 12345;
            const contactInfo: SendReminderMode = { email: MOCK_CONTACT_DATA.email };

            service.send(mpGroup, memberId, contactInfo).subscribe((data) => {
                expect(data).toBeDefined();
            });
            const req = httpTestingController.expectOne(`/api/members/${memberId}/enrollments/summary`);
            expect(req.request.method).toBe("POST");
        });

        it("should send the summary text to the given phone number", () => {
            const memberId = 1;
            const mpGroup = 12345;
            const contactInfo: SendReminderMode = { phoneNumber: MOCK_CONTACT_DATA.phoneNumber };

            service.send(mpGroup, memberId, contactInfo).subscribe((data) => {
                expect(data).toBeDefined();
            });
            const req = httpTestingController.expectOne(`/api/members/${memberId}/enrollments/summary`);
            expect(req.request.method).toBe("POST");
        });
    });
});
