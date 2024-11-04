import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportPolicyFormComponent } from "./import-policy-form.component";
import { HttpHeaders, HttpResponse } from "@angular/common/http";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from "@angular/forms";
import { AflacService, MemberService } from "@empowered/api";
import { MemberProfile } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { mockAflacService, mockLanguageService, mockMatDialogData, mockMemberService, mockTpiService } from "@empowered/testing";
import { of, throwError } from "rxjs";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { provideMockStore } from "@ngrx/store/testing";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { ProductOfferingsState } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import { PRODUCT_OFFERINGS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.reducer";
import { ProductsState } from "@empowered/ngrx-store/ngrx-states/products";
import { PRODUCTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/products/products.reducer";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { TpiServices } from "@empowered/common-services";

describe("ImportPolicyFormComponent", () => {
    let component: ImportPolicyFormComponent;
    let fixture: ComponentFixture<ImportPolicyFormComponent>;
    let aflacService: AflacService;
    let memberService: MemberService;
    const mockedInitialState = {
        [PRODUCT_OFFERINGS_FEATURE_KEY]: {
            ...ProductOfferingsState.initialState,
        },
        [PRODUCTS_FEATURE_KEY]: {
            ...ProductsState.initialState,
            selectedProductId: 8,
        },
        [ACCOUNTS_FEATURE_KEY]: {
            ...AccountsState.initialState,
            selectedMPGroup: 111,
        },
        [MEMBERS_FEATURE_KEY]: {
            ...MembersState.initialState,
            selectedMemberId: 333,
        },
    };
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ImportPolicyFormComponent],
            providers: [
                NGRXStore,
                provideMockStore({ initialState: mockedInitialState }),
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: AflacService,
                    useValue: mockAflacService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                { provide: MAT_DIALOG_DATA, useValue: mockMatDialogData },
                { provide: TpiServices, useValue: mockTpiService },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            imports: [ReactiveFormsModule, HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ImportPolicyFormComponent);
        component = fixture.componentInstance;
        aflacService = TestBed.inject(AflacService);
        memberService = TestBed.inject(MemberService);
        fixture.detectChanges();
        component.formGroup = new FormGroup({
            policyNumber: new FormControl("", [Validators.required]),
        });
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should call buildFormGroup() and retrieveMemberInfo()", () => {
            const spy1 = jest.spyOn(component, "buildFormGroup");
            const spy2 = jest.spyOn(component, "retrieveMemberInfo");
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
                },
                birthDate: "1980-01-01",
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
            component.retrieveMemberInfo(1, 1);
            expect(spy).toBeCalled();
        });
    });

    describe("onImportPolicy()", () => {
        it("should emit observable importPolicyClicked$ on getting invoked", () => {
            const spy = jest.spyOn(component, "importPolicy");
            component.onImportPolicy();
            expect(spy).toBeCalled();
        });
    });

    describe("ImportPolicy()", () => {
        it("should return if policy number not passed", () => {
            component.importPolicy(1, 1, 1);
            expect(component.formGroup.valid).toBeFalsy();
        });

        it("should invoke policy lookup service on submit", () => {
            component.formGroup.get("policyNumber").setValue("123XYZ");
            component.importPolicy(1, 1, 1);
            expect(component.apiResponseStatus).toBeTruthy();
        });

        it("should throw policy not found error on submit", () => {
            component.formGroup.get("policyNumber").setValue("123XYZ");
            const errorPayload = {
                status: 400,
                statusText: "Bad Request",
                error: { status: 400, code: "badParameter", message: "Invalid policy number." },
            };
            jest.spyOn(aflacService, "policyLookup").mockReturnValue(throwError(errorPayload));
            component.importPolicy(1, 1, 1);
            expect(component.apiResponseStatus).toBeFalsy();
            expect(component.errorMessage).toStrictEqual("primary.portal.aflac.always.modal.select.policies.import.policy.not.found");
        });

        it("should throw policy not eligible error on submit", () => {
            component.formGroup.get("policyNumber").setValue("123XYZ");
            const errorPayload = {
                status: 400,
                statusText: "Bad Request",
                error: { status: 400, code: "badParameter", message: "Policy not eligible for Aflac Always" },
            };
            jest.spyOn(aflacService, "policyLookup").mockReturnValue(throwError(errorPayload));
            component.importPolicy(1, 1, 1);
            expect(component.apiResponseStatus).toBeFalsy();
            expect(component.errorMessage).toStrictEqual("Policy not eligible for Aflac Always");
        });
    });
});
