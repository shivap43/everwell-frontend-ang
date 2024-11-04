import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { AuthenticationService, StaticService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { CheckForm } from "@empowered/ngxs-store";
import {
    mockActivatedRoute,
    mockAuthenticationService,
    mockDatePipe,
    mockLanguageService,
    mockMatDialog,
    mockStaticService,
} from "@empowered/testing";
import { EmpoweredModalService } from "@empowered/common-services";
import { NgxsModule, Store } from "@ngxs/store";
import { CensusStatementModalComponent } from "../census-statement-modal/census-statement-modal.component";
import { ReviewFlowService } from "../services/review-flow.service";
import { VerifyUserComponent } from "./verify-user.component";
import { MatDatepicker } from "@angular/material/datepicker";
import { StoreModule } from "@ngrx/store";
import { throwError } from "rxjs";
@Directive({
    selector: "[matDatepicker]",
})
class MockMatDatePickerDirective {
    @Input() matDatepicker!: MatDatepicker<unknown>;
}

@Directive({
    selector: "[empoweredDateTransform]",
})
class MockDateTransformDirective {
    @Input() notCalenderFormat: boolean;
}
@Directive({
    selector: "[empoweredInput]",
})
class MockInputDirective {}
describe("VerifyUserComponent", () => {
    let component: VerifyUserComponent;
    let fixture: ComponentFixture<VerifyUserComponent>;
    let empoweredModalService: EmpoweredModalService;
    let store: Store;
    let authenticationService: AuthenticationService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VerifyUserComponent, MockMatDatePickerDirective, MockDateTransformDirective, MockInputDirective],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule, ReactiveFormsModule],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                FormBuilder,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: AuthenticationService,
                    useValue: mockAuthenticationService,
                },
                ReviewFlowService,
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                EmpoweredModalService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VerifyUserComponent);
        component = fixture.componentInstance;
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        store = TestBed.inject(Store);
        authenticationService = TestBed.inject(AuthenticationService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should set memberId and mpGroup", () => {
            component.ngOnInit();
            expect(component.memberId).toBe(1);
            expect(component.groupId).toBe(12345);
            expect(component.guid).toBe("guid12345");
        });
    });

    describe("consentStatement()", () => {
        it("should open CensusStatementModalComponent", () => {
            const spy1 = jest.spyOn(empoweredModalService, "openDialog");
            component.consentStatement();
            expect(spy1).toBeCalledWith(CensusStatementModalComponent);
        });
    });

    describe("onSubmit()", () => {
        it("should dispatch store CheckForm when loginForm is invalid", () => {
            component.formName = "testForm";
            component.loginForm = { valid: false } as FormGroup;
            const spy1 = jest.spyOn(store, "dispatch");
            component.onSubmit();
            expect(spy1).toBeCalledWith(new CheckForm("testForm"));
        });
        it("should call getHeadsetSSO if the form is valid", () => {
            component.ngOnInit();
            component.formName = "testForm";
            component.loginForm = {
                valid: true,
                value: {
                    firstName: "Tommy",
                    lastName: "Clinton",
                    birthDate: "12/12/2021",
                    contactValue: "7897897890",
                },
            } as FormGroup;
            const spy1 = jest.spyOn(authenticationService, "getHeadsetSSO");
            component.onSubmit();
            expect(spy1).toBeCalledWith({
                birthDate: "12/12/2021",
                contactValue: "7897897890",
                firstName: "Tommy",
                groupId: 12345,
                guid: "guid12345",
                lastName: "Clinton",
            });
        });
        it("should call getHeadsetSSO and return error", () => {
            const error = {
                status: 401,
                message: "You are not logged in",
            };
            component.loginForm = {
                valid: true,
                value: {
                    firstName: "Tommy",
                    lastName: "Clinton",
                    birthDate: "12/12/2021",
                    contactValue: "7897897890",
                },
            } as FormGroup;
            jest.spyOn(authenticationService, "getHeadsetSSO").mockReturnValueOnce(throwError(error));
            component.onSubmit();
            expect(component.isSpinnerLoading).toBeFalsy();
            expect(component.errorMessage).toEqual("secondary.api.401.undefined");
            expect(component.showErrorMessage).toBeTruthy();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });
});
