import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { mockLanguageService, mockMatDialogRef, mockMemberService } from "@empowered/testing";
import { FormBuilder } from "@angular/forms";
import { Configuration, MemberService } from "@empowered/api";
import { EBSInfoModalComponent } from "./ebs-info-modal.component";
import { Subscription, throwError } from "rxjs";

const matDialogData = {
    isFromNonEnrollmentFlow: true,
    mpGroup: "123",
    memberId: 1,
    email: "asd@gmail.com",
    ssn: 1231211234,
    fromComponentName: "EnrollmentDetailsComponent",
};

describe("EBSInfoModalComponent", () => {
    let component: EBSInfoModalComponent;
    let fixture: ComponentFixture<EBSInfoModalComponent>;
    let matDialogRef: MatDialogRef<EBSInfoModalComponent>;
    let memberService: MemberService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EBSInfoModalComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: matDialogData,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                FormBuilder,
                Configuration,
            ],
            imports: [],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EBSInfoModalComponent);
        memberService = TestBed.inject(MemberService);
        matDialogRef = TestBed.inject(MatDialogRef);
        component = fixture.componentInstance;
        window.open = jest.fn();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("Checking referring page flow from default", () => {
            component.ngOnInit();
            expect(component.fromEnrollmentDetails).toBe(true);
        });

        it("Checking referring page flow from CoverageSummaryComponent", () => {
            component.fromContEbs = true;
            component.data.fromComponentName = "CoverageSummaryComponent";
            component.ngOnInit();
            expect(component.fromContEbs).toBe(true);
        });
    });

    it("Check ebsPaymentOnFile when on file is true", () => {
        component.data.ebsPaymentOnFile = "true";
        component.ngOnInit();
        expect(component.ebsPaymentOnFile).toBe(1);
    });

    it("get EbsPaymentCallbackStatus", () => {
        const spy1 = jest.spyOn(memberService, "getEbsPaymentCallbackStatus");
        component.getEbsPaymentCallbackStatus();
        expect(spy1).toBeCalledTimes(1);
    });

    it("check getEbsPaymentCallbackStatus is called", () => {
        component.pollingSubscription = new Subscription();
        const spy1 = jest.spyOn(memberService, "getEbsPaymentCallbackStatus");
        component.gotoAflacEBS();
        expect(spy1).toBeCalled();
    });

    it("should open new window", () => {
        const spy = jest.spyOn(window, "open");
        component.gotoAflacEBS();
        expect(spy).toBeCalled();
    });

    it("Check if modal dialog component is closed when Back button is clicked or when paylogix windows is closed", () => {
        const spy = jest.spyOn(matDialogRef, "close");
        component.goBack();
        expect(spy).toBeCalled();
    });

    it("Check if modal dialog component is closed when Back button or X button is clicked", () => {
        const spy = jest.spyOn(matDialogRef, "close");
        component.goBack();
        expect(spy).toBeCalledWith({ fromContEbs: false, failedEbsPaymentCallback: false });
    });

    it("Check if modal dialog component is closed when Back button is clicked or when paylogix window is closed and is with a property", () => {
        const spy = jest.spyOn(matDialogRef, "close");
        component.gotoAflacEBS();
        component.goBack();
        expect(spy).toBeCalledWith({ fromContEbs: true, failedEbsPaymentCallback: false });
    });

    describe("updateEbsPaymentCallbackStatus", () => {
        it("check it is called successfully", () => {
            component.pollingSubscription = new Subscription();
            const spy1 = jest.spyOn(memberService, "updateEbsPaymentCallbackStatus");
            component.gotoAflacEBS();
            expect(spy1).toBeCalledTimes(1);
        });

        it("check it is called with a failure", () => {
            const error = {
                error: { message: "api error message" },
                status: 500,
            };
            expect(component.failedEbsPaymentCallback).toBe(false);
            jest.spyOn(memberService, "updateEbsPaymentCallbackStatus").mockReturnValue(throwError(error));
            component.gotoAflacEBS();
            expect(component.failedEbsPaymentCallback).toBe(true);
        });
    });

    describe("ngOnDestroy()", () => {
        it("Should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(spy1).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });
    });
});
