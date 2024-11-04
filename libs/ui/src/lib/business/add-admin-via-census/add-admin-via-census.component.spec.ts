import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTableModule } from "@angular/material/table";
import { Router } from "@angular/router";
import { AdminService, Configuration } from "@empowered/api";
import { Admin } from "@empowered/constants";
import { SharedState } from "@empowered/ngxs-store";
import { mockMatDialog, mockRouter } from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { of } from "rxjs";
import { AddAdminViaCensusComponent } from "./add-admin-via-census.component";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[configEnabled]",
})
class MockConfigEnableDirective {
    @Input("configEnabled") configKey: string;
}

describe("AddAdminViaCensusComponent", () => {
    let component: AddAdminViaCensusComponent;
    let fixture: ComponentFixture<AddAdminViaCensusComponent>;
    let store: Store;
    let adminService: AdminService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddAdminViaCensusComponent, MockConfigEnableDirective],
            providers: [
                FormBuilder,
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                Configuration,
                AdminService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([SharedState]), MatTableModule],
        }).compileComponents();
    });

    beforeEach(() => {
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            core: {
                regex: { EMAIL: "SAMPLE_REGEX" },
            },
        });
        adminService = TestBed.inject(AdminService);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddAdminViaCensusComponent);
        component = fixture.componentInstance;
    });

    describe("AddAdminViaCensusComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });
    });
    describe("closeForm", () => {
        it("should close the form", () => {
            const spy = jest.spyOn(component["dialogRef"], "close");
            component.closeForm();
            expect(spy).toBeCalled();
        });
    });

    describe("onBack", () => {
        it("should go back on previous form", () => {
            const spy = jest.spyOn(component["dialogRef"], "close");
            component.onBack();
            expect(spy).toBeCalled();
        });
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
});
