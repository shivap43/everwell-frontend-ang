import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { AdminService, Configuration } from "@empowered/api";
import { Admin } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { SharedState } from "@empowered/ngxs-store";
import { mockActivatedRoute, mockLanguageService, mockMatDialog, mockRouter } from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { of, Subscription, throwError } from "rxjs";
import { AddAdminManuallyComponent } from "./add-admin-manually.component";
import { PhoneFormatConverterPipe } from "../../pipes/phone-format-converter.pipe";
import { MatMenuModule } from "@angular/material/menu";

describe("AddAdminManuallyComponent", () => {
    let component: AddAdminManuallyComponent;
    let fixture: ComponentFixture<AddAdminManuallyComponent>;
    let store: Store;
    let adminService: AdminService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddAdminManuallyComponent, PhoneFormatConverterPipe],
            providers: [
                FormBuilder,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                Configuration,
                AdminService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([SharedState]), MatMenuModule],
        }).compileComponents();
    });

    beforeEach(() => {
        adminService = TestBed.inject(AdminService);
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            core: {
                regex: { EMAIL: "SAMPLE_REGEX" },
            },
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddAdminManuallyComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("serviceCalls", () => {
        it("should make getAccountAdminRoles service call", () => {
            component.mpGroupId = 12345;
            const spy = jest.spyOn(adminService, "getAccountAdminRoles").mockReturnValue(
                of([
                    { id: 2, name: "GROUP OWNER" },
                    { id: 5, name: "GROUP HR ADMIN" },
                ] as unknown as Admin[]),
            );
            component.serviceCalls();
            expect(spy).toBeCalled();
            expect(component.adminRoles.length).toEqual(2);
        });
        it("should make getAccountAdminRoles service call and throw error", () => {
            component.mpGroupId = 12345;
            const error = {
                message: "api error message",
                status: 400,
            };
            const spy = jest.spyOn(adminService, "getAccountAdminRoles").mockReturnValue(throwError({ error }));
            component.serviceCalls();
            expect(spy).toBeCalled();
            expect(component.isSpinnerLoading).toBeFalsy();
        });
    });
    describe("closeForm", () => {
        it("should close the form", () => {
            const spy = jest.spyOn(component["dialogRef"], "close");
            component.closeForm();
            expect(spy).toBeCalled();
        });
    });
    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
