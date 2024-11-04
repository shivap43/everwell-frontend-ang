import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { AuthenticationService, MemberService, StaticService } from "@empowered/api";
import { MembersBusinessService } from "../../services/members-business.service";
import { LanguageService } from "@empowered/language";
import { NgxsModule, Store } from "@ngxs/store";
import { MaskApplierService, NgxMaskPipe } from "ngx-mask";
import { of } from "rxjs";
import { SharedState, MOCK_REGEX_DATA, MemberBeneficiary } from "@empowered/ngxs-store";
import { UtilService } from "@empowered/ngxs-store";
import { BeneficiaryAddComponent } from "./beneficiary-add.component";
import { EmpoweredModalService } from "@empowered/common-services";
import {
    mockLanguageService,
    mockMatDialog,
    mockMatDialogRef,
    mockMemberService,
    mockMembersBusinessService,
    mockStaticService,
} from "@empowered/testing";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MaterialModule } from "../../material/material.module";

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

describe("BeneficiaryAddComponent", () => {
    let component: BeneficiaryAddComponent;
    let fixture: ComponentFixture<BeneficiaryAddComponent>;
    let store: Store;
    let staticService: StaticService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BeneficiaryAddComponent, MockReplaceTagPipe],
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
                MaterialModule,
                HttpClientTestingModule,
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
        fixture = TestBed.createComponent(BeneficiaryAddComponent);
        component = fixture.componentInstance;
        component.INDIVIDUAL_TYPE_FORM = fg;
        staticService = TestBed.inject(StaticService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("excludeBeneficiaryType()", () => {
        it("should exclude beneficiary type from beneficiary types array", () => {
            component.beneficiaryType = [
                {
                    value: "INDIVIDUAL",
                },
                { value: "TRUST" },
            ];
            component.excludeBeneficiaryType("INDIVIDUAL");
            expect(component.beneficiaryType).toStrictEqual([{ value: "TRUST" }]);
        });
    });

    describe("getSuffixes()", () => {
        it("should get all the suffixes for beneficiaries", () => {
            const suffixData = ["SUFFIX1", "SUFFIX2"];
            const spy = jest.spyOn(staticService, "getSuffixes").mockReturnValue(of(suffixData));
            component.getSuffixes();
            expect(spy).toBeCalled();
            expect(component.suffixes).toBe(suffixData);
        });
    });
    describe("getStates()", () => {
        it("should get all the states", () => {
            const states = [
                { abbreviation: "AZ", name: "Arizona" },
                { abbreviation: "PR", name: "Puerto Rico" },
            ];
            const spy = jest.spyOn(staticService, "getStates").mockReturnValue(of(states));
            component.getStates();
            expect(spy).toBeCalled();
            expect(component.states).toBe(states);
        });
    });

    describe("getConfigurations()", () => {
        it("should get the charity enable config value", () => {
            const configValue = [{ name: "charity", value: "false", dataType: "boolean" }];
            component.beneficiaryType = [{ name: "INDIVIDUAL" }, { name: "TRUST" }, { name: "CHARITY" }];
            jest.spyOn(staticService, "getConfigurations").mockReturnValue(of(configValue));
            component.getConfigurations();
            expect(component.beneficiaryType).toStrictEqual([{ name: "INDIVIDUAL" }, { name: "TRUST" }]);
        });
    });

    describe("checkUserType()", () => {
        it("should get the portal from store", () => {
            component.checkUserType();
            expect(component.portal).toBe("PRODUCER");
            expect(component.isMemberPortal).toBeFalsy();
        });
    });

    describe("hideErrorAlertMessage()", () => {
        it("should hide alert message based", () => {
            component.checkUserType();
            expect(component.errorMessage).toBe("");
            expect(component.showErrorMessageInAlert).toBeFalsy();
        });
    });

    describe("isStateOptionField()", () => {
        it("should set state as required field if it exists as required", () => {
            component.requiredFields = ["state"];
            component.isStateOptionField();
            expect(component.stateOptionalField).toBeTruthy();
        });
        it("should set state as optional field if it not exists as required", () => {
            component.requiredFields = [];
            component.isStateOptionField();
            expect(component.stateOptionalField).toBeFalsy();
        });
    });

    describe("isSsnOptionField()", () => {
        it("should set ssn as required field if it exists as required", () => {
            component.requiredFields = ["ssn"];
            component.isSsnOptionField();
            expect(component.ssnOptionalField).toBeFalsy();
        });
        it("should set ssn as optional field if it not exists as required", () => {
            component.requiredFields = [];
            component.isSsnOptionField();
            expect(component.ssnOptionalField).toBeTruthy();
        });
    });

    describe("showErrorAlertMessage()", () => {
        it("should return errorMessage 'secondary.portal.members.api.duplicate.beneficiary' when detail code is duplicate and detail field is Name", () => {
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toBe("secondary.portal.members.api.duplicate.beneficiary");
        });

        it("should set error as duplicate when detail code is duplicate and detail field is SSN", () => {
            error["error"].details[0].field = "SSN";
            component.showErrorAlertMessage(error);
            expect(component.showErrorMessageInAlert).toBeFalsy();
            expect(component.INDIVIDUAL_TYPE_FORM.controls.ssn.errors?.duplicate).toBeTruthy();
        });

        it("should return errorMessage from detail message when detail code is ValidEmail", () => {
            error["error"].details[0].code = "ValidEmail";
            error["error"].details[0].message = "invalid email format for beneficiary";
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toBe("invalid email format for beneficiary");
        });

        it("should return generic errorMessage as 'secondary.portal.members.api.400.badParameter.dob' when the error does not fall in above scenarios", () => {
            error["error"].details[0].code = "DOB";
            error["error"].details[0].field = "dob";
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toBe("secondary.portal.members.api.400.badParameter.dob");
        });

        it("should set error as duplicate when status is 409 and code is duplicate and detail field is ssn", () => {
            error["error"].status = 409;
            error["error"].code = "duplicate";
            error["error"].details[0].field = "ssn";
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toBe("primary.portal.members.api.ssn.duplicate.nonMmp");
        });

        it("should set error as duplicate when status is 409 and code is duplicate and detail field is itin", () => {
            error["error"].status = 409;
            error["error"].code = "duplicate";
            error["error"].details[0].field = "anyother";
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toBe("secondary.portal.members.api.duplicate.beneficiary");
        });

        it("should set generic error when status is other than 400 and 409", () => {
            error["error"].status = 401;
            error["error"].code = "AuthError";
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toBe("secondary.api.401.AuthError");
        });
    });
});
