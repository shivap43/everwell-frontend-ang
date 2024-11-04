import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatDialog } from "@angular/material/dialog";
import { RouterTestingModule } from "@angular/router/testing";
import { EmpoweredSheetService } from "@empowered/common-services";
import { Application, EnrollmentMethod, MemberContactListDisplay, RequiredConstraint, ResponsePanel, GetPlan } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store";
import { EnrollmentsActions } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { AppFlowService } from "@empowered/ngxs-store";
import {
    mockAppFlowService,
    mockEmpoweredSheetService,
    mockLanguageService,
    mockMatBottomSheet,
    mockMatDialog,
    mockStaticService,
} from "@empowered/testing";
import { provideMockStore } from "@ngrx/store/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { ConsentStatementComponent } from "./consent-statement/consent-statement.component";
import { SignatureAppComponent } from "./signature-app.component";
import { StaticService } from "@empowered/api";
import { of } from "rxjs";
import { SendEnrollmentSummaryEmailModalComponent, SendEnrollmentSummaryEmailModalService } from "@empowered/ui";
const mockEnrollmentSummaryEmailService = {
    open: (contactList: MemberContactListDisplay[], dialog: any) => {},
    // afterClosed$:() => of{} as Observable<SendEnrollmentSummaryEmailModalResponseData>,
} as SendEnrollmentSummaryEmailModalService<SendEnrollmentSummaryEmailModalComponent>;
describe("SignatureAppComponent", () => {
    let component: SignatureAppComponent;
    let fixture: ComponentFixture<SignatureAppComponent>;
    let store: Store;
    let empoweredSheetService: EmpoweredSheetService;
    let appFlowService: AppFlowService;
    let ngrxStore: NGRXStore;
    let staticService: StaticService;
    let sendEnrollmentSummaryEmailModalService: SendEnrollmentSummaryEmailModalService<SendEnrollmentSummaryEmailModalComponent>;
    const fb: FormBuilder = new FormBuilder();
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SignatureAppComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule, ReactiveFormsModule],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MatBottomSheet,
                    useValue: mockMatBottomSheet,
                },
                {
                    provide: AppFlowService,
                    useValue: mockAppFlowService,
                },
                {
                    provide: EmpoweredSheetService,
                    useValue: mockEmpoweredSheetService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: SendEnrollmentSummaryEmailModalService,
                    useValue: mockEnrollmentSummaryEmailService,
                },
                DatePipe,
                FormBuilder,
                NGRXStore,
                provideMockStore({}),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SignatureAppComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        empoweredSheetService = TestBed.inject(EmpoweredSheetService);
        appFlowService = TestBed.inject(AppFlowService);
        ngrxStore = TestBed.inject(NGRXStore);
        sendEnrollmentSummaryEmailModalService = TestBed.inject(SendEnrollmentSummaryEmailModalService);
        staticService = TestBed.inject(StaticService);
        window.open = jest.fn();
        component.signatureForm = fb.group({
            privacyNote: [false],
        });
    });

    describe("SignatureAppComponent", () => {
        it("should create component", () => {
            expect(component).toBeTruthy();
        });
    });
    describe("openModal()", () => {
        it("should open a consent statement modal", () => {
            const spy = jest.spyOn(empoweredSheetService, "openSheet");
            component.openModal();
            expect(spy).toBeCalledWith(ConsentStatementComponent);
        });
    });
    describe("changeHippaValue()", () => {
        it("should capture the hippa checkbox value", () => {
            const event = {
                checked: true,
            } as MatCheckbox;
            component.changeHipaaValue(event);
            expect(component.isHipaaChecked).toEqual(event.checked);
        });
    });
    describe("print()", () => {
        it("should open the pdf in new window", () => {
            const spy = jest.spyOn(window, "open");
            component.print();
            expect(spy).toBeCalledWith(component.unSignedFileURL, "_blank");
        });
    });

    describe("downloadPreliminaryForm()", () => {
        it("should make downloadPreliminaryForm api call", () => {
            component.memberId = 7;
            component.preliminaryForms = [{ preliminaryFormPath: "resource/aflac/NY-6800.pdf", cartItemId: 74 }];
            component.mpGroup = 86686;
            const spy = jest.spyOn(ngrxStore, "dispatch");
            component.downloadPreliminaryForm(0);
            expect(spy).toBeCalledWith(
                EnrollmentsActions.downloadPreliminaryForm({
                    memberId: component.memberId,
                    preliminaryFormPath: component.preliminaryForms[0].preliminaryFormPath,
                    cartItemId: component.preliminaryForms[0].cartItemId,
                    mpGroupId: component.mpGroup,
                }),
            );
        });
    });

    describe("constructVF2FDetails()", () => {
        it("should construct detail for virtual face to face", () => {
            const planDetail = {
                planId: 123,
                sections: [{ steps: [{ type: "VERIFICATION_CODE" }] }],
            } as Application;
            component.constructVF2FDetails(planDetail, 78);
            expect(component.vF2FStepDetails).toStrictEqual([
                {
                    planId: 123,
                    cartId: 78,
                    vF2FStepDetail: [{ steps: [{ type: "VERIFICATION_CODE" }] }],
                },
            ]);
        });
    });

    describe("checkConstraint()", () => {
        it("should return true when the constraint response is empty string", () => {
            const constraint = { response: "" } as RequiredConstraint;
            const answered = [{ value: ["any value"] }] as ResponsePanel[];
            expect(component.checkConstraint(constraint, answered)).toBe(true);
        });

        it("should return true when the constraint response is string", () => {
            const constraint = { response: "response" } as RequiredConstraint;
            const answered = [{ value: ["any value", "response"] }] as ResponsePanel[];
            expect(component.checkConstraint(constraint, answered)).toBe(true);
        });

        it("should return false when constraint is not passed", () => {
            const constraint = {} as RequiredConstraint;
            const answered = [] as ResponsePanel[];
            expect(component.checkConstraint(constraint, answered)).toBe(false);
        });
    });

    describe("openPrivacyNote()", () => {
        it("should open privacy note in new window", () => {
            component.privacyPracticesNoticeLink = "aflac/privacy/note.pdf";
            const spy = jest.spyOn(window, "open");
            component.openPrivacyNote();
            expect(spy).toBeCalledWith("aflac/privacy/note.pdf");
        });
    });

    describe("gotoNextSubStep()", () => {
        it("should notify side nav regarding upcoming step and also enable the next step", () => {
            const spy = jest.spyOn(appFlowService, "emitVf2fStep");
            component.gotoNextSubStep(1);
            expect(spy).toBeCalledWith(1);
        });
    });

    describe("checkReviewApplicationCompleted()", () => {
        it("should return false when the review of PDF is not completed and set error message 'secondary.portal.applicationFlow.reviewSome'", () => {
            component.isButtonClicked = [false, true];
            component.someApplicationReviewRequired = true;
            component.checkReviewApplicationCompleted();
            expect(component.showError).toBe(true);
            expect(component.errorMessage).toStrictEqual("secondary.portal.applicationFlow.reviewSome");
            expect(component.checkReviewApplicationCompleted()).toBe(false);
        });

        it("should return false when the review of PDF is not completed and set error message 'secondary.portal.applicationFlow.reviewALL'", () => {
            component.isButtonClicked = [false, true];
            component.someApplicationReviewRequired = false;
            component.checkReviewApplicationCompleted();
            expect(component.showError).toBe(true);
            expect(component.errorMessage).toStrictEqual("secondary.portal.applicationFlow.reviewALL");
            expect(component.checkReviewApplicationCompleted()).toBe(false);
        });

        it("should return true when the review of PDF is completed and no error message is set", () => {
            component.isButtonClicked = [false, false];
            component.checkReviewApplicationCompleted();
            expect(component.showError).toBe(false);
            expect(component.checkReviewApplicationCompleted()).toBe(true);
        });
    });

    describe("showAllErrors()", () => {
        it("should set privacyNoteError to false when privacyNote form control value of signatureForm is true", () => {
            component.signatureForm.controls.privacyNote.setValue(true);
            component.showAllErrors();
            expect(component.privacyNoteError).toBe(false);
        });

        it("should set privacyNoteError to true when privacyNote form control value of signatureForm is false", () => {
            component.signatureForm.controls.privacyNote.setValue(false);
            component.showAllErrors();
            expect(component.privacyNoteError).toBe(true);
        });
    });

    describe("updateError()", () => {
        it("should set privacyNoteError to false when 'checked' value passed to updateError is true", () => {
            component.updateError({ checked: true });
            expect(component.signatureForm.controls.privacyNote.value).toBe(true);
            expect(component.privacyNoteError).toBe(false);
        });

        it("should set privacyNoteError to true when 'checked' value passed to updateError is false", () => {
            component.updateError({ checked: false });
            expect(component.signatureForm.controls.privacyNote.value).toBe(null);
            expect(component.privacyNoteError).toBe(true);
        });
    });

    describe("showEnrollmentSummaryEmailModal()", () => {
        it("should call showEnrollmentSummaryEmailModal() when flag is true", () => {
            jest.spyOn(SignatureAppComponent.prototype as any, "watchForEnrollmentSummaryModalAfterClosedEvent").mockImplementation();
            const spy = jest.spyOn(component, "showEnrollmentSummaryEmailModal").mockImplementation();
            component.planObject = {
                resinstate: false,
                application: {
                    id: "1",
                    cartData: {
                        id: "1",
                        enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                    },
                },
            };
            component.allData = [];
            component.allDataWithNoSigns = [];
            component.allCartItems = [];
            component.isHeadset = false;
            component.isEnrollmentSummaryReceiptEnabled = true;

            component.saveSignature("confirmed");
            expect(spy).toBeCalled();
        });
        it("should not call showEnrollmentSummaryEmailModal() when flag is false", () => {
            jest.spyOn(SignatureAppComponent.prototype as any, "watchForEnrollmentSummaryModalAfterClosedEvent").mockImplementation();
            const spy = jest.spyOn(component, "showEnrollmentSummaryEmailModal").mockImplementation();
            component.planObject = {
                resinstate: false,
                application: {
                    id: "1",
                    cartData: {
                        id: "1",
                        enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                    },
                },
            };
            component.allData = [];
            component.allDataWithNoSigns = [];
            component.allCartItems = [];
            component.isHeadset = false;
            component.isEnrollmentSummaryReceiptEnabled = false;

            component.saveSignature("confirmed");
            expect(spy).not.toBeCalled();
        });
        it("should open modal on showEnrollmentSummaryEmailModal()", () => {
            const spy = jest.spyOn(sendEnrollmentSummaryEmailModalService, "open");
            jest.spyOn(SignatureAppComponent.prototype as any, "watchForEnrollmentSummaryModalAfterClosedEvent").mockImplementation();
            component.showEnrollmentSummaryEmailModal();
            expect(spy).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const spy = jest.spyOn(appFlowService, "emitVf2fStep");
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy).toBeCalledWith(0);
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });

    describe("checkForMandatoryToViewPlans()", () => {
        it("should set isHospitalProduct to true if it is Hospital Product", () => {
            component.reviewRequiredPolicySeriesRegex = "A71000=A71[0-9][0-9][0-9],VSN100=VSN1[0-9][0-9],B40000=B4[0-9][0-9][0-9][0-9]";
            const mockplan = [
                {
                    id: 1220,
                    policySeries: "B40100",
                    product: {
                        id: 3,
                        name: "Hospital",
                    },
                },
            ] as GetPlan[];
            component.isHospitalProduct = false;
            component.viewMandatoryIds = [];
            jest.spyOn(store, "selectSnapshot").mockReturnValue(mockplan);
            component.checkForMandatoryToViewPlans();
            expect(component.isHospitalProduct).toBeTruthy();
        });
        it("should set isHospitalProduct to false if it is not Hospital Product", () => {
            component.reviewRequiredPolicySeriesRegex = "A71000=A71[0-9][0-9][0-9],VSN100=VSN1[0-9][0-9],B40000=B4[0-9][0-9][0-9][0-9]";
            const mockplan = [
                {
                    id: 1220,
                    policySeries: "B40100",
                    product: {
                        id: 1,
                        name: "Test",
                    },
                },
            ] as GetPlan[];
            component.isHospitalProduct = true;
            component.viewMandatoryIds = [];
            jest.spyOn(store, "selectSnapshot").mockReturnValue(mockplan);
            component.checkForMandatoryToViewPlans();
            expect(component.isHospitalProduct).toBeFalsy();
        });
    });
});
