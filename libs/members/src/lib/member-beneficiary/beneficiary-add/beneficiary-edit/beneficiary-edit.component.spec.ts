import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NO_ERRORS_SCHEMA, Directive, Input, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { AuthenticationService, MemberService, StaticService } from "@empowered/api";
import { BeneficiaryEditComponent } from "./beneficiary-edit.component";
import { LanguageModule, LanguageService } from "@empowered/language";
import { NgxsModule, Store } from "@ngxs/store";
import { MaskApplierService, NgxMaskPipe } from "ngx-mask";
import { SharedState, UtilService, MOCK_REGEX_DATA, MemberBeneficiary } from "@empowered/ngxs-store";
import { EmpoweredModalService } from "@empowered/common-services";
import {
    mockLanguageService,
    mockMatDialog,
    mockMatDialogRef,
    mockMemberService,
    mockMembersBusinessService,
    mockStaticService,
} from "@empowered/testing";
import { MaterialModule, MembersBusinessService } from "@empowered/ui";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";

@Directive({
    selector: "[hiddenInput]",
})
class MockHiddenInputDirective {
    @Input("hiddenInput") hiddenInputDir: string;
}

@Directive({
    selector: "[patterns]",
})
class MockPatternDirective {
    @Input("patterns") matchPatterns: string;
}

@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any) {
        return "replaced";
    }
}

const error = {} as Error;
error["error"] = {
    status: 400,
    code: "badParameter",
    message: "One or more parameters were invalid.",
    details: [
        {
            code: "duplicate",
            field: "name",
            message: "beneficiaries cannot have same profile",
        },
    ],
};
const fgName: FormGroup = new FormBuilder().group({
    firstName: "Test",
    lastName: "Test",
});
const fg: FormGroup = new FormBuilder().group({
    name: fgName,
    ssn: "231-234-5555",
});

describe("BeneficiaryEditComponent", () => {
    let component: BeneficiaryEditComponent;
    let fixture: ComponentFixture<BeneficiaryEditComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BeneficiaryEditComponent, MockPatternDirective, MockHiddenInputDirective, MockReplaceTagPipe],
            providers: [
                DatePipe,
                NgxMaskPipe,
                {
                    provide: AuthenticationService,
                    useValue: {},
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: UtilService,
                    useValue: {},
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                { provide: MaskApplierService, useValue: {} },
                { provide: MemberService, useValue: mockMemberService },
                {
                    provide: EmpoweredModalService,
                    useValue: mockMatDialog,
                },
                {
                    provide: MembersBusinessService,
                    useValue: mockMembersBusinessService,
                },
                { provide: LanguageService, useValue: mockLanguageService },
            ],
            imports: [
                NgxsModule.forRoot([SharedState, MemberBeneficiary]),
                HttpClientTestingModule,
                MaterialModule,
                LanguageModule,
                ReactiveFormsModule,
                MatDialogModule,
                MatDatepickerModule,
                MatNativeDateModule,
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        jest.resetAllMocks();
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            core: {
                regex: { ...MOCK_REGEX_DATA },
                portal: "PRODUCER",
            },
            Member: {
                mpGroup: 111,
                memberId: 222,
            },
        });
        fixture = TestBed.createComponent(BeneficiaryEditComponent);
        component = fixture.componentInstance;
        component.INDIVIDUAL_EDIT_FORM = fg;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("showErrorAlertMessage()", () => {
        it("should return errorMessage 'secondary.portal.members.api.duplicate.beneficiary' when detail code is duplicate and detail field is Name", () => {
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toBe("secondary.portal.members.api.duplicate.beneficiary");
        });

        it("should set error as duplicate when detail code is duplicate and detail field is SSN", () => {
            error["error"].details[0].field = "SSN";
            component.showErrorAlertMessage(error);
            expect(component.showErrorMessage).toBeFalsy();
            expect(component.INDIVIDUAL_EDIT_FORM.controls.ssn.errors?.duplicate).toBeTruthy();
        });

        it("should return errorMessage from detail message when detail code is ValidEmail", () => {
            error["error"].details[0].code = "ValidEmail";
            error["error"].details[0].message = "invalid email format for beneficiary";
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toBe("invalid email format for beneficiary");
        });

        it("should return generic errorMessage as 'secondary.portal.members.api.400.badParameter.dob' when the error does not fall in above scenarios", () => {
            error["error"].details[0].status = "400";
            error["error"].details[0].code = "badParameter";
            error["error"].details[0].field = "dob";
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toBe("secondary.portal.members.api.400 badParameter dob");
        });

        it("should set error as duplicate when status is other than 400 and 409 and code is duplicate", () => {
            error["error"].status = 404;
            error["error"].code = "duplicate";
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toBe("secondary.portal.members.api.404.duplicate");
        });

        it("should set generic error when status is other than 400 and 409 and code is not duplicate", () => {
            error["error"].status = 401;
            error["error"].code = "AuthError";
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toBe("secondary.api.401.AuthError");
        });

        it("should set error as duplicate when status is 409 and code is duplicate and detail field is ssn", () => {
            error["error"].status = 409;
            error["error"].code = "duplicate";
            error["error"].details[0].field = "SSN";
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toBe("primary.portal.members.api.ssn.duplicate.nonMmp");
        });

        it("should set error as duplicate when status is 409 and code is duplicate and detail field is itin", () => {
            error["error"].status = 409;
            error["error"].code = "duplicate";
            error["error"].details[0].field = "ITIN";
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toBe("primary.portal.members.api.ssn_itin.duplicate.nonMmp");
        });

        it("should set error as duplicate when status is 409 and code is duplicate and detail field is anyother", () => {
            error["error"].status = 409;
            error["error"].code = "duplicate";
            error["error"].details[0].field = "anyother";
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toBe("secondary.portal.members.api.duplicate.beneficiary");
        });
    });
});
