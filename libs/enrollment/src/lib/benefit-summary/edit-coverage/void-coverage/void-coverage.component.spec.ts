import { Component, Pipe, PipeTransform, Input, Directive, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormBuilder, FormsModule, ReactiveFormsModule } from "@angular/forms";

import { AppFlowService, StaticUtilService } from "@empowered/ngxs-store";
import { ComponentType } from "@angular/cdk/portal";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { NgxsModule } from "@ngxs/store";
import { of } from "rxjs";
import { VoidCoverageComponent } from "./void-coverage.component";

const mockMatDialogRef = { close: () => {} };
@Component({
    selector: "empowered-modal",
    template: "",
})
class MockEmpoweredModalComponent {}
@Component({
    selector: "empowered-modal-header",
    template: "",
})
class MockEmpoweredModalHeaderComponent {}
@Component({
    selector: "empowered-modal-footer",
    template: "",
})
class MockEmpoweredModalFooterComponent {}

const mockDialogData = {
    isShop: false,
    isCoverageSummary: true,
    planName: "Accident option A",
    mpGroup: 123,
    memberId: 1,
    enrollId: 1,
};
const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as MatDialog;

const mockStaticUtilService = {
    cacheConfigEnabled: (configName: string) => of(true),
} as StaticUtilService;

const mockAppFlowService = {
    exitStatus: (exitStatus: boolean) => {},
} as AppFlowService;

@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any): string {
        return "replaced";
    }
}

@Directive({
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}

@Directive({
    selector: "[configEnabled]",
})
class MockConfigEnabledDirective {
    @Input("configEnabled") configName: string;
}

describe("VoidCoverageComponent", () => {
    let component: VoidCoverageComponent;
    let fixture: ComponentFixture<VoidCoverageComponent>;
    let matDialogRef: MatDialogRef<VoidCoverageComponent>;
    let staticUtilService: StaticUtilService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                VoidCoverageComponent,
                MockReplaceTagPipe,
                MockEmpoweredModalComponent,
                MockEmpoweredModalHeaderComponent,
                MockEmpoweredModalFooterComponent,
                MockHasPermissionDirective,
                MockConfigEnabledDirective,
            ],
            providers: [
                FormBuilder,

                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockDialogData,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                { provide: StaticUtilService, useValue: mockStaticUtilService },
                { provide: AppFlowService, useValue: mockAppFlowService },
            ],
            imports: [RouterTestingModule, HttpClientTestingModule, NgxsModule.forRoot([]), FormsModule, ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(VoidCoverageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        matDialogRef = TestBed.inject(MatDialogRef);
        staticUtilService = TestBed.inject(StaticUtilService);
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getVoidConfig()", () => {
        it("should set voidConfig value to true, when config value is true", () => {
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled");
            component.getVoidConfig();
            expect(spy1).toBeCalledTimes(2);
            expect(component["isVoidReason"]).toBe(true);
            expect(component["isVoidComment"]).toBe(true);
        });
    });

    describe("setVoidRequest()", () => {
        it("should set voidCoverageRequest value to null, when there is no reason or comments", () => {
            component["isVoidReason"] = false;
            component["isVoidComment"] = false;
            component.setVoidRequest();
            expect(component["voidCoverageRequest"]).toStrictEqual({ reason: "Select" });
        });
    });

    describe("directToShopPage()", () => {
        it("should redirect to shop page when its not producer portal", () => {
            const spy = jest.spyOn(matDialogRef, "close");
            component["isProducer"] = false;
            component.directToShopPage();
            expect(spy).toBeCalledWith(1);
        });
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
});
