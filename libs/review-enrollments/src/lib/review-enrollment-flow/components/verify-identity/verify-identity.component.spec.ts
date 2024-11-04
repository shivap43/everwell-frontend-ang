import { ComponentFixture, TestBed } from "@angular/core/testing";
import { VerifyIdentityComponent } from "./verify-identity.component";
import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { AuthenticationService, StaticService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import {
    mockActivatedRoute,
    mockAuthenticationService,
    mockDatePipe,
    mockLanguageService,
    mockMatDialog,
    mockStaticService,
} from "@empowered/testing";
import { EmpoweredModalService } from "@empowered/common-services";
import { NgxsModule } from "@ngxs/store";
import { ReviewFlowService } from "../../services/review-flow.service";
import { CensusStatementModalComponent } from "../census-statement-modal/census-statement-modal.component";
import { MatDatepicker } from "@angular/material/datepicker";

@Component({
    selector: "mat-datepicker",
    template: "",
})
class MockMatDatePickerComponent {}

@Component({
    selector: "mat-datepicker-toggle",
    template: "",
})
class MockMatDatePickerToggleComponent {}

@Directive({
    selector: "[matDatepicker]",
})
class MockMatDatePickerDirective {
    @Input() matDatepicker!: MatDatepicker<unknown>;
}

describe("VerifyIdentityComponent", () => {
    let component: VerifyIdentityComponent;
    let fixture: ComponentFixture<VerifyIdentityComponent>;
    let empoweredModalService: EmpoweredModalService;
    let authenticationService: AuthenticationService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                VerifyIdentityComponent,
                MockMatDatePickerComponent,
                MockMatDatePickerToggleComponent,
                MockMatDatePickerDirective,
            ],
            imports: [HttpClientTestingModule, ReactiveFormsModule, NgxsModule.forRoot([]), RouterTestingModule],
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
        fixture = TestBed.createComponent(VerifyIdentityComponent);
        component = fixture.componentInstance;
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        authenticationService = TestBed.inject(AuthenticationService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should set memberId and mpGroup", () => {
            component.ngOnInit();
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
                birthDate: "2021-12-12",
                contactValue: "7897897890",
                firstName: "Tommy",
                groupId: 12345,
                guid: "guid12345",
                lastName: "Clinton",
            });
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
