import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { RouterTestingModule } from "@angular/router/testing";
import { Configuration, MemberService } from "@empowered/api";
import { NgxsModule } from "@ngxs/store";
import { of, Subscription } from "rxjs";
import { ReviewAndSubmitComponent } from "./review-and-submit.component";
import { mockDatePipe, mockMemberService } from "@empowered/testing";
import { MatTableModule } from "@angular/material/table";
import { MatMenuModule } from "@angular/material/menu";

@Component({
    template: "",
    selector: "empowered-mon-spinner",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {
    @Input() iconSize!: string;
}
@Pipe({
    name: "titlecase",
})
class MockTitleCasePipe implements PipeTransform {
    transform(value: string) {
        return "Savings";
    }
}
@Component({
    selector: "mon-alert",
    template: "",
})
class MockMonAlertComponent {}

describe("ReviewAndSubmitComponent", () => {
    let component: ReviewAndSubmitComponent;
    let fixture: ComponentFixture<ReviewAndSubmitComponent>;
    let memberService: MemberService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ReviewAndSubmitComponent,
                MockMonIconComponent,
                MockMonSpinnerComponent,
                MockTitleCasePipe,
                MockMonAlertComponent,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                { provide: MatDialog, useValue: {} },
                { provide: MatDialogRef, useValue: {} },
                { provide: DatePipe, useValue: mockDatePipe },
                { provide: Configuration, useValue: {} },
                { provide: mockMemberService, useValue: MemberService },
            ],
            imports: [
                NgxsModule.forRoot(),
                HttpClientTestingModule,
                ReactiveFormsModule,
                RouterTestingModule,
                MatTableModule,
                MatMenuModule,
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ReviewAndSubmitComponent);
        component = fixture.componentInstance;
        memberService = TestBed.inject(MemberService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("createFormControl()", () => {
        it("should create the review-submit form", () => {
            component.reviewAndSubmitForm = null;
            component.validationRegex = {
                ALPHANUMERIC_WITH_SPACES: "Sample_Validation_regex",
            };
            component.createFormControl();
            expect(component.reviewAndSubmitForm).toBeInstanceOf(FormGroup);
        });
    });

    describe("toTitleCase()", () => {
        it("should return string in title case", () => {
            expect(component.toTitleCase("hello world")).toBe("Hello world");
        });
    });

    describe("ngOnDestroy()", () => {
        it("should unsubscribe from subscriptions", () => {
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [of(null).subscribe()];
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });
    });

    describe("getZipFormat()", () => {
        it("should return the zip in proper format", () => {
            expect(component.getZipFormat("3-00-01")).toBe("30001");
        });
    });
    describe("updateMemberPaymentData", () => {
        it("should not call paymentmethods API in Global PCR flow", () => {
            component.isMember = false;
            component.isDirect = false;
            component.isAdmin = false;
            component.memberId = 12345;
            component.isPayroll = false;
            const spy1 = jest.spyOn(memberService, "updatePaymentMethod");
            const spy2 = jest.spyOn(memberService, "getPaymentMethods");
            component.updateMemberPaymentData(1, "1234");
            expect(spy1).toBeCalledTimes(0);
            expect(spy2).toBeCalledTimes(0);
        });
        beforeEach(() => {
            component.memberId = 12345;
            component.storeDataArray = [
                {
                    billingType: "BANK_ACCOUNT",
                    accountHoldersName: {
                        firstName: "test",
                        lastName: "AJ",
                    },
                    accountNumber: "1234",
                    tempusTokenIdentityGuid: "1234",
                    transitNumber: "123ef",
                    accountType: "savings",
                    address1: "test",
                    city: "test",
                    state: "AL",
                    zip: "35232",
                    id: 1,
                },
            ];
        });
        it("should call paymentmethods API in Group/Employee PCR flow when payroll keyword available in URL", () => {
            component.isPayroll = true;
            const spy = jest.spyOn(memberService, "getPaymentMethods");
            component.updateMemberPaymentData(0, "1234");
            expect(spy).toHaveBeenCalled();
        });
        it("should call paymentmethods API in Group/Employee PCR flow when member keyword available in URL", () => {
            component.isMember = true;
            const spy = jest.spyOn(memberService, "getPaymentMethods");
            component.updateMemberPaymentData(0, "1234");
            expect(spy).toHaveBeenCalled();
        });
        it("should call paymentmethods API in Group/Employee PCR flow when direct keyword available in URL", () => {
            component.isMember = true;
            const spy = jest.spyOn(memberService, "getPaymentMethods");
            component.updateMemberPaymentData(0, "1234");
            expect(spy).toHaveBeenCalled();
        });
        it("should call paymentmethods API in Group/Employee PCR flow when admin keyword available in URL", () => {
            component.isAdmin = true;
            const spy = jest.spyOn(memberService, "getPaymentMethods");
            component.updateMemberPaymentData(0, "1234");
            expect(spy).toHaveBeenCalled();
        });
    });
});
