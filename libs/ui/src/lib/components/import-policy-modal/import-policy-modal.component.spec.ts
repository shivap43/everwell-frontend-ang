import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { ImportPolicyModalComponent } from "./import-policy-modal.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NgxsModule } from "@ngxs/store";
import { MemberService } from "@empowered/api";
import { MemberProfile } from "@empowered/constants";
import { of } from "rxjs";
import { HttpHeaders, HttpResponse } from "@angular/common/http";
import { mockLanguageService, mockMatDialogRef } from "@empowered/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { MatMenuModule } from "@angular/material/menu";

const matDialogData = {
    mpGroup: 123,
    memberId: 987,
    productId: 13456,
    productName: "Cancer",
    enrollmentType: "F2F",
    enrollmentStateAbbreviation: "PR",
};

const mockMemberService = {
    getMember: (memberId: number, fullProfile: boolean, mpGroup?: string) => of({} as HttpResponse<MemberProfile>),
} as MemberService;

describe("ImportPolicyModalComponent", () => {
    let component: ImportPolicyModalComponent;
    let fixture: ComponentFixture<ImportPolicyModalComponent>;
    let mockDialog: MatDialogRef<ImportPolicyModalComponent, any>;
    let memberService: MemberService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ImportPolicyModalComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: matDialogData,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
            ],
            imports: [ReactiveFormsModule, HttpClientTestingModule, NgxsModule.forRoot([]), MatMenuModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ImportPolicyModalComponent);
        component = fixture.componentInstance;
        mockDialog = TestBed.inject(MatDialogRef);
        memberService = TestBed.inject(MemberService);
        component.form = new FormGroup({
            policyNumber: new FormControl("", [Validators.required]),
        });
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should call initializeForm() and getMemberInfo()", () => {
            const spy1 = jest.spyOn(component, "initializeForm");
            const spy2 = jest.spyOn(component, "getMemberInfo");
            component.ngOnInit();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });
    });

    describe("getMemberInfo()", () => {
        it("should call getMember()", () => {
            const response = {
                id: 1,
                name: {
                    firstName: "ARwGxhj",
                    lastName: "AackOYH",
                    maidenName: "",
                    nickname: "",
                    suffix: "",
                },
                birthDate: "1980-01-01",
                gender: "MALE",
                profile: {
                    allowCallCenter: false,
                    communicationPreference: "EMAIL",
                    correspondenceLocation: "HOME",
                    correspondenceType: "ELECTRONIC",
                    courtOrdered: false,
                    hiddenFromEmployee: false,
                    ineligibleForCoverage: false,
                    languagePreference: "ENGLISH",
                    maritalStatus: "UNREPORTED",
                    medicareEligibility: false,
                    test: false,
                    tobaccoStatus: "UNDEFINED",
                },
                workInformation: {
                    employeeIdRequired: false,
                    hireDate: "2018-10-10",
                    hoursPerWeekRequired: false,
                    organizationId: 1,
                    payrollFrequencyId: 5,
                },
                verificationInformation: {
                    verifiedEmail: "ssnmasking+577815197@gmail.com",
                    verifiedPhone: "2812053028",
                    zipCode: "31537-9346",
                },
                registrationStatus: "EVERWELL_EXISTING",
            } as MemberProfile;
            const spy = jest.spyOn(memberService, "getMember").mockReturnValue(
                of({
                    body: response,
                    type: 4,
                    clone: null,
                    headers: new HttpHeaders({ "Content-Type": "application/json" }),
                    status: 200,
                    statusText: "OK",
                    url: "api/members/1?fullProfile=true",
                    ok: true,
                } as HttpResponse<MemberProfile>),
            );
            component.getMemberInfo();
            expect(spy).toBeCalled();
        });
    });

    describe("onCancel()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onCancel();
            expect(spy1).toBeCalledWith(false);
        });
    });

    describe("initializeForm()", () => {
        it("should initialize form", () => {
            const formGroup = component.form;
            const formValues = { policyNumber: "" };
            component.initializeForm();
            expect(formGroup.value).toEqual(formValues);
        });
    });
});
