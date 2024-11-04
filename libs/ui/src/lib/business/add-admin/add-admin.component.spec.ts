import { Component, CUSTOM_ELEMENTS_SCHEMA, forwardRef, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { Subject } from "rxjs";
import { LanguageService } from "@empowered/language";
import { ControlValueAccessor, FormBuilder, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { DatePipe } from "@angular/common";
import { AddAdminComponent } from "./add-admin.component";
import { MemberService } from "@empowered/api";
import { mockActivatedRoute, mockLanguageService, mockMatDialogRef } from "@empowered/testing";
import { MatMenuModule } from "@angular/material/menu";

const mockRouter = {
    url: "some route",
};

describe("AddAdminComponent", () => {
    let component: AddAdminComponent;
    let fixture: ComponentFixture<AddAdminComponent>;
    let memberService: MemberService;
    let matdialogRef: MatDialogRef<any>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddAdminComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                RouterTestingModule,
                FormBuilder,
                DatePipe,
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, MatMenuModule, ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddAdminComponent);
        component = fixture.componentInstance;
        memberService = TestBed.inject(MemberService);
        matdialogRef = TestBed.inject(MatDialogRef);
        component.selectedOption = new FormControl(null, Validators.required);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getCustomers()", () => {
        it("should get the customers", () => {
            component.mpGroup = 12345;
            const spy = jest.spyOn(memberService, "searchMembers");
            component.getCustomers();
            expect(spy).toBeCalledTimes(1);
            expect(spy).toBeCalledWith({ payload: 12345 });
        });
    });

    describe("chooseOption()", () => {
        it("should set the value to the selectedOption", () => {
            component.chooseOption("someText");
            expect(component.selectedOption.value).toBe("someText");
        });
    });

    describe("onNext()", () => {
        it("should set the error if invalid", () => {
            component.onNext();
            expect(component.selectedOption.getError("require")).toBeTruthy();
        });

        it("should close the dialog ref if valid", () => {
            component.selectedOption.setValue("someText");
            const spy = jest.spyOn(matdialogRef, "close");
            component.onNext();
            expect(spy).toBeCalledTimes(1);
        });
    });
});
