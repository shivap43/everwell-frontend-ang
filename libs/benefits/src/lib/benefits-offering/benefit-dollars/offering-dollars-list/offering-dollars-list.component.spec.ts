import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { NgxsModule } from "@ngxs/store";
import { OfferingDollarsListComponent } from "./offering-dollars-list.component";
import { HasPermissionDirective } from "@empowered/ui";

describe("OfferingDollarsListComponent", () => {
    let component: OfferingDollarsListComponent;
    let fixture: ComponentFixture<OfferingDollarsListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [OfferingDollarsListComponent, HasPermissionDirective],
            imports: [HttpClientTestingModule, ReactiveFormsModule, NgxsModule.forRoot([])],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(OfferingDollarsListComponent);
        component = fixture.componentInstance;
        jest.resetAllMocks();
        jest.resetModules();
        jest.clearAllMocks();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });

    it("should emit on view offering", () => {
        jest.spyOn(component.emitViewAction, "emit");
        component.viewOffering("123");
        expect(component.emitViewAction.emit).toHaveBeenCalledWith("123");
    });

    it("should emit on edit offering", () => {
        jest.spyOn(component.emitEditAction, "emit");
        component.editOffering("123");
        expect(component.emitEditAction.emit).toHaveBeenCalledWith("123");
    });

    it("should emit on remove offering", () => {
        jest.spyOn(component.emitRemoveAction, "emit");
        component.removeOffering("123");
        expect(component.emitRemoveAction.emit).toHaveBeenCalledWith("123");
    });
});
