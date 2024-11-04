import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { MemberService, StaticService } from "@empowered/api";
import { Configurations } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { mockActivatedRoute, mockDomSanitizer, mockLanguageService, mockMatDialogRef, mockStaticService } from "@empowered/testing";
import { NgxsModule } from "@ngxs/store";
import { of, throwError } from "rxjs";
import { ReviewFlowService } from "../services/review-flow.service";
import { PdaReviewComponent } from "./pda-review.component";

describe("PdaReviewComponent", () => {
    let component: PdaReviewComponent;
    let fixture: ComponentFixture<PdaReviewComponent>;
    let memberService: MemberService;
    let staticService: StaticService;
    let formBuilder: FormBuilder;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PdaReviewComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule, ReactiveFormsModule],
            providers: [
                FormBuilder,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                MemberService,
                {
                    provide: DomSanitizer,
                    useValue: mockDomSanitizer,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                ReviewFlowService,

                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PdaReviewComponent);
        component = fixture.componentInstance;
        component.userDetails = { memberId: 1, groupId: 12345 };
        memberService = TestBed.inject(MemberService);
        staticService = TestBed.inject(StaticService);
        formBuilder = TestBed.inject(FormBuilder);
        component.formType = "PDA";
        component.formId = 12;
        component.memberId = 1;
        component.mpGroup = 12345;
        component.groupId = 12345;
        component.dialogRef = {
            close: () => {},
        };
        component.customerSign = "John";
        component.thirdFormGroup = formBuilder.group({
            signature: [""],
        });
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should set memberId and mpGroup", () => {
            component.ngOnInit();
            expect(component.memberId).toBe(1);
            expect(component.mpGroup).toBe(12345);
            expect(component.groupId).toBe(12345);
        });
    });

    describe("getForm()", () => {
        it("should call downloadMemberForm and download data on success api response", () => {
            const spy1 = jest.spyOn(memberService, "downloadMemberForm").mockReturnValueOnce(of("Downloaded"));
            component.isSpinnerLoading = true;
            component.getForm();
            expect(spy1).toBeCalledWith(1, "PDA", 12, 12345);
            expect(component.unSignedData).toBe("Downloaded");
            expect(component.isSpinnerLoading).toBe(false);
        });
        it("should call downloadMemberForm and show error message on api error", () => {
            const spy1 = jest.spyOn(memberService, "downloadMemberForm").mockReturnValueOnce(
                throwError({
                    error: { message: "some api error message" },
                }),
            );
            component.isSpinnerLoading = true;
            component.languageSecondStringsArray["secondary.portal.review.downloadErrorMsg"] = "error downloading form";
            component.getForm();
            expect(spy1).toBeCalledWith(1, "PDA", 12, 12345);
            expect(component.unSignedData).toBe(undefined);
            expect(component.isSpinnerLoading).toBe(false);
            expect(component.saveError).toBe(true);
            expect(component.errorMessage).toBe("error downloading form");
        });
    });
    describe("onSubmit()", () => {
        it("should call signMemberForm", () => {
            const spy1 = jest.spyOn(memberService, "signMemberForm").mockReturnValueOnce(of(null));
            component.esignature = "vk";
            component.isSpinnerLoading = true;
            component.onSubmit();
            expect(spy1).toBeCalledWith(1, "PDA", 12, { signature: "vk" }, 12345);
            expect(component.isSpinnerLoading).toBe(false);
        });
    });
    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component["unsubscribe$"], "next");
            const spyForComplete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
    describe("closeDialog()", () => {
        it("should close out the dialog", () => {
            const spy = jest.spyOn(component["dialogRef"], "close");
            component.closeDialog();
            expect(spy).toBeCalled();
        });
    });
    describe("hasError()", () => {
        it("hasError should mark the signature falsy as validator", () => {
            expect(component.hasError("signature", "required")).toBeFalsy();
        });
    });
    describe("getConfigurationSpecifications()", () => {
        it("should return customerSign as 'John' with valid config response", () => {
            const spy1 = jest.spyOn(staticService, "getConfigurations").mockReturnValue(
                of([
                    {
                        value: "John,Wick",
                    } as Configurations,
                ]),
            );
            expect(component.customerSign).toBe("John");
            component.getConfigurationSpecifications();
            expect(spy1).toBeCalledWith("user.enrollment.telephone_signature_placeholder", 12345);
        });
        it("should return customerSign as '' with invalid config response", () => {
            const spy1 = jest.spyOn(staticService, "getConfigurations").mockReturnValue(
                of([
                    {
                        value: "",
                    } as Configurations,
                ]),
            );
            component.getConfigurationSpecifications();
            expect(component.customerSign).toBe("");
            expect(spy1).toBeCalledWith("user.enrollment.telephone_signature_placeholder", 12345);
        });
    });
});
