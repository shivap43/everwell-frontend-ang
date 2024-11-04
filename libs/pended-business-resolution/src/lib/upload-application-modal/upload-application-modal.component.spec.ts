import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { UploadApplicationModalComponent } from "./upload-application-modal.component";
import { mockMatDialogRef } from "@empowered/testing";
import { PendedBusinessService } from "@empowered/api";
import { PbrCommonService } from "../pbr-common.service";
import { Subscription } from "rxjs";

const data = {
    applicationInfo: {},
    applicationDetails: {},
    modalFrom: "default",
};

describe("UploadApplicationModalComponent", () => {
    let component: UploadApplicationModalComponent;
    let fixture: ComponentFixture<UploadApplicationModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [UploadApplicationModalComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                LanguageService,
                PendedBusinessService,
                PbrCommonService,
                Store,
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(UploadApplicationModalComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onCancelClick()", () => {
        it("should close the dialog on cancel", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onCancelClick();
            expect(spy1).toBeCalled();
        });
    });

    describe("openResolvedAppDetailModal()", () => {
        it("should close the dialog on opening resolved app detail modal", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.openResolvedAppDetailModal();
            expect(spy1).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "next");
            fixture.destroy();
            expect(spy).toBeCalledTimes(1);
        });
    });
});
