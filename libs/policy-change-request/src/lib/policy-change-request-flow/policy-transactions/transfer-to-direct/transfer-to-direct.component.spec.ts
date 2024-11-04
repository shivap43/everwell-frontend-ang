import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Component, CUSTOM_ELEMENTS_SCHEMA, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { NgxsModule } from "@ngxs/store";
import { NgxMaskPipe } from "ngx-mask";
import { Subscription } from "rxjs";
import { TransferToDirectComponent } from "./transfer-to-direct.component";
import {
    mockMatDialog,
    mockDatePipe,
    mockLanguageService,
    mockMemberService,
    mockRouter,
    mockPaymentService,
    mockEmpoweredModalService,
} from "@empowered/testing";
import { DatePipe } from "@angular/common";
import {
    PaymentDetailsPromptComponent,
    PolicyChangeRequestCancelPopupComponent,
    PolicyChangeRequestConfirmationPopupComponent,
} from "@empowered/ui";
import { LanguageService } from "@empowered/language";
import { MatDatepicker } from "@angular/material/datepicker";
import { MemberService, PaymentService, StaticService } from "@empowered/api";
import { of } from "rxjs";
import { Configurations, PaymentType } from "@empowered/constants";
import { Router } from "@angular/router";
import { EmpoweredModalService } from "@empowered/common-services";
import { RouterTestingModule } from "@angular/router/testing";

@Component({
    selector: "mat-datepicker",
    template: "",
})
class MockMatDatepickerComponent {}

@Component({
    selector: "mat-datepicker-toggle",
    template: "",
})
class MockMatDatepickerToggleComponent {
    @Input() for!: string;
}

@Directive({
    selector: "[matDatepicker]",
})
class MockMatDatePickerDirective {
    @Input() matDatepicker!: MatDatepicker<unknown>;
}
@Directive({
    selector: "[language]",
})
class MockLanguageDirective {
    @Input() language!: string;

    transform(value: any): string {
        return value;
    }
}

describe("TransferToDirectComponent", () => {
    let component: TransferToDirectComponent;
    const formBuilder = new FormBuilder();
    let fixture: ComponentFixture<TransferToDirectComponent>;
    let staticService: StaticService;
    let memberService: MemberService;
    let paymentService: PaymentService;
    let empoweredModalService: EmpoweredModalService;
    let router: Router;
    let mockDialog: MatDialog;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                TransferToDirectComponent,
                MockMatDatepickerComponent,
                MockMatDatePickerDirective,
                MockMatDatepickerToggleComponent,
                MockLanguageDirective,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: MatDialogRef, useValue: {} },
                { provide: NgxMaskPipe, useValue: {} },
                { provide: DatePipe, useValue: mockDatePipe },
                { provide: LanguageService, useValue: mockLanguageService },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: PaymentService,
                    useValue: mockPaymentService,
                },
            ],
            imports: [ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule, NgxsModule.forRoot()],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TransferToDirectComponent);
        component = fixture.componentInstance;
        staticService = TestBed.inject(StaticService);
        memberService = TestBed.inject(MemberService);
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        paymentService = TestBed.inject(PaymentService);
        router = TestBed.inject(Router);
        mockDialog = TestBed.inject(MatDialog);
    });

    describe("TransferToDirectComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("setInitialValues()", () => {
            it("should set isPayroll to true when route url has payroll", () => {
                jest.spyOn(router, "url", "get").mockReturnValue("/producer/payroll");
                component.setInitialValues();
                expect(component.isPayroll).toEqual(true);
            });
            it("should set isMember to true when route url has member", () => {
                jest.spyOn(router, "url", "get").mockReturnValue("/member");
                component.setInitialValues();
                expect(component.isMember).toEqual(true);
            });
            it("should set isAdmin to true when route url has admin", () => {
                jest.spyOn(router, "url", "get").mockReturnValue("/admin/payroll");
                component.setInitialValues();
                expect(component.isAdmin).toEqual(true);
            });
            it("should set isDirect to true when route url has direct", () => {
                jest.spyOn(router, "url", "get").mockReturnValue("/direct");
                component.setInitialValues();
                expect(component.isDirect).toEqual(true);
            });
        });

        describe("openConfirmationPopup()", () => {
            it("should open PolicyChangeRequestConfirmationPopupComponent", () => {
                const openSpy = jest.spyOn(mockDialog, "open");
                component.openConfirmationPopup();
                expect(openSpy).toHaveBeenCalledWith(PolicyChangeRequestConfirmationPopupComponent, expect.anything());
            });
        });
        describe("getDocumentId()", () => {
            it("should push the documentId into documentIdArray", () => {
                component.getDocumentId(1);
                expect(component.documentIdArray).toHaveLength(1);
            });
        });

        describe("cancel()", () => {
            it("should open PolicyChangeRequestCancelPopupComponent on clicking cancel", () => {
                const openSpy = jest.spyOn(mockDialog, "open");
                component.cancel();
                expect(openSpy).toHaveBeenCalledWith(PolicyChangeRequestCancelPopupComponent, expect.anything());
            });
        });
        describe("ngOnDestroy()", () => {
            it("should cleanup subscriptions", () => {
                const spy = jest.spyOn(component["unsubscribe$"], "next");
                const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

                fixture.destroy();

                expect(spy).toBeCalledTimes(1);
                expect(spy2).toBeCalledTimes(1);
            });
        });
        describe("getConfigValues()", () => {
            it("should call get configurations api with tempus url and mp group when getConfigValues called", () => {
                const spy = jest.spyOn(staticService, "getConfigurations");
                component.mpGroup = 12345;
                component.getConfigValues();
                expect(spy).toBeCalledWith("general.feature.enable.pcr_transfer_to_direct_via_tempus", 12345);
            });
            it("should call get configurations api with authorization agreement and mp group when mp group is present", () => {
                const spy = jest.spyOn(staticService, "getConfigurations");
                component.mpGroup = 12345;
                component.getConfigValues();
                expect(spy).toBeCalledWith("user.payment.authorization_agreement", 12345);
            });
            it("should call get configurations api with authorization agreement without mpGroup when mp group is not present", () => {
                const spy = jest.spyOn(staticService, "getConfigurations");
                component.getConfigValues();
                expect(spy).toBeCalledWith("user.payment.authorization_agreement");
            });
        });
        describe("closeNoPaymentInfoAlert()", () => {
            it("should set showNoCardError to false when selected payment method is credit card", () => {
                component.closeNoPaymentInfoAlert();
                expect(component.showNoCardError).toBe(false);
            });
            it("should set showNoAccountError to false when selected payment method is other than credit card", () => {
                component.closeNoPaymentInfoAlert();
                expect(component.showNoAccountError).toBe(false);
            });
        });
        describe("getBankDraftConfigValues()", () => {
            it("should call get configurations api with tempus ach pcr url and mp group when getBankDraftConfigValues called", () => {
                const spy = jest.spyOn(staticService, "getConfigurations");
                component.mpGroup = 12345;
                component.getBankDraftConfigValues();
                expect(spy).toBeCalledWith("general.feature.enable.pcr_ach_transfer_to_direct_via_tempus", 12345);
            });
            it("should set bankDraftTempusConfig to false if ach pcr config is off when getBankDraftConfigValues called", () => {
                jest.spyOn(staticService, "getConfigurations").mockReturnValue(of([{ value: "FALSE" }] as Configurations[]));
                component.mpGroup = 12345;
                component.getBankDraftConfigValues();
                expect(component.bankDraftTempusConfig).toBe(false);
            });
            it("should not call  getPaymentMethods of member service if memberId and mpGroup is not present when getBankDraftConfigValues called", () => {
                jest.clearAllMocks();
                jest.spyOn(staticService, "getConfigurations").mockReturnValue(of([{ value: "TRUE" }] as Configurations[]));
                const spy = jest.spyOn(memberService, "getPaymentMethods");
                component.getBankDraftConfigValues();
                expect(spy).not.toBeCalled();
            });
            it("should call getPaymentMethods of member service when config is on and mpGroup is present when getBankDraftConfigValues called", () => {
                jest.clearAllMocks();
                const spy = jest.spyOn(memberService, "getPaymentMethods");
                component.mpGroup = 12345;
                component.memberId = 10;
                jest.spyOn(staticService, "getConfigurations").mockReturnValue(of([{ value: "TRUE" }] as Configurations[]));
                component.getBankDraftConfigValues();
                expect(spy).toBeCalledWith(10, 12345);
            });
            it("should have only pnc ach bank accounts in addedBankAccounts when getBankDraftConfigValues called", () => {
                jest.clearAllMocks();
                jest.spyOn(staticService, "getConfigurations").mockReturnValue(of([{ value: "TRUE" }] as Configurations[]));
                jest.spyOn(memberService, "getPaymentMethods").mockReturnValue(
                    of([
                        { id: 1, paymentType: PaymentType.BANKDRAFT, accountName: "PNC account", tempusTokenIdentityGuid: "token guid" },
                        { id: 10, paymentType: PaymentType.BANKDRAFT, accountName: "paymetric account" },
                    ]),
                );
                component.memberId = 10;
                component.getBankDraftConfigValues();
                expect(component.addedBankAccounts).toEqual([
                    { id: 1, paymentType: PaymentType.BANKDRAFT, accountName: "PNC account", tempusTokenIdentityGuid: "token guid" },
                ]);
            });
            it("should call get configurations api with tempus ach edit retire and mp group when getBankDraftConfigValues called", () => {
                const spy = jest.spyOn(staticService, "getConfigurations");
                component.mpGroup = 12345;
                component.getBankDraftConfigValues();
                expect(spy).toBeCalledWith("general.feature.enable.ach_edit_tempus_payment_service", 12345);
            });
            it("should call initializeBillingForms if bankDraftTempusConfig is true and mpGroup is undefined", () => {
                jest.spyOn(staticService, "getConfigurations").mockReturnValue(of([{ value: "TRUE" }] as Configurations[]));
                const spy = jest.spyOn(component, "initializeBillingForms");
                component.transferToDirectForm = formBuilder.group({});
                component.mpGroup = undefined;
                component.getBankDraftConfigValues();
                expect(spy).toHaveBeenCalled();
            });
        });
        describe("openBankDraftPrompt()", () => {
            beforeEach(() => {
                component.memberId = 1;
                component.mpGroup = 12345;
                jest.spyOn(staticService, "getConfigurations").mockReturnValue(
                    of([{ value: "some url", name: "some name", dataType: "dataType" }]),
                );
                jest.spyOn(paymentService, "getSession").mockReturnValue(of({ tempusTokenIdentityGuid: "token guid", sessionId: "1234" }));
            });

            it("should call getConfigurations and getSessions api call to open iframe when editModal passed is false in openBankDraftPrompt method", () => {
                const spy1 = jest.spyOn(staticService, "getConfigurations");
                const spy2 = jest.spyOn(paymentService, "getSession");
                component.openBankDraftPrompt(false);
                expect(spy1).toBeCalled();
                expect(spy2).toBeCalled();
            });
            it("should open the dialog box for payment details prompt component with iframe url and session data to open the iframe on calling openBankDraftPrompt method", () => {
                const spy = jest.spyOn(empoweredModalService, "openDialog");
                component.openBankDraftPrompt(false);
                expect(spy).toBeCalledWith(PaymentDetailsPromptComponent, {
                    data: {
                        memberId: 1,
                        mpGroup: 12345,
                        tempusIframeURL: "some url",
                        tempusSessionObject: { tempusTokenIdentityGuid: "token guid", sessionId: "1234" },
                        paymentMethod: "BANK_DRAFT",
                    },
                });
            });
            it("should set disableAddAccount to false on calling openBankDraftPrompt method in edit mode", () => {
                component.openBankDraftPrompt(true);
                expect(component.disableAddAccount).toBe(false);
            });
            it("should set disableAddAccount to false on calling openBankDraftPrompt method", () => {
                component.openBankDraftPrompt(false);
                expect(component.disableAddAccount).toBe(false);
            });
        });
    });
});
