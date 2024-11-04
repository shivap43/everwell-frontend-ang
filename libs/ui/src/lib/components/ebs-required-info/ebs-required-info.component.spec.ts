import { ComponentFixture, inject, TestBed } from "@angular/core/testing";
import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { EBSRequiredInfoComponent } from "./ebs-required-info.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { LanguageService } from "@empowered/language";
import {
    mockEmpoweredModalService,
    mockLanguageService,
    mockMatDialog,
    mockMatDialogRef,
    mockStore,
    mockUtilService,
} from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { SsnFormatPipe } from "../../pipes/ssn-format.pipe";
import { Configuration } from "@empowered/api";
import { Gender } from "@empowered/constants";
import { SSNVisibility } from "../ssn-input/ssn-visibility.enum";
import { SharedState, UtilService } from "@empowered/ngxs-store";
import { DatePipe } from "@angular/common";
import { EmpoweredModalService } from "@empowered/common-services";
import { MatMenuModule } from "@angular/material/menu";

const EBSRequiredDialogData = {
    memberInfo: { ssn: "2132132112" },
    memberContacts: [],
    mpGroupId: "1234",
    memberId: 12,
    ssnConfirmationEnabled: true,
};

@Component({
    template: "",
    selector: "empowered-ssn-input",
})
class SsnInputComponent {
    @Input() ssnErrors: Array<{ key: string; value: string }>;
    @Input() visibility = SSNVisibility.PARTIALLY_MASKED;
    @Input() regex: { [key: string]: string };
    @Input() allowPaste: boolean;
    @Input() showToggle: boolean;
    @Input() showHint: boolean;
    @Input() isProducerPortal: boolean;
}
describe("EBSRequiredInfoComponent", () => {
    let component: EBSRequiredInfoComponent;
    let fixture: ComponentFixture<EBSRequiredInfoComponent>;
    let empoweredModalService: EmpoweredModalService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EBSRequiredInfoComponent, SsnInputComponent],
            providers: [
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: EBSRequiredDialogData,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                { provide: MatDialog, useValue: mockMatDialog },
                {
                    provide: empoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                FormBuilder,
                Configuration,
                SsnFormatPipe,
                DatePipe,
            ],
            imports: [NgxsModule.forRoot([SharedState]), HttpClientTestingModule, ReactiveFormsModule, MatMenuModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(inject([FormBuilder], (fb: FormBuilder) => {
        fixture = TestBed.createComponent(EBSRequiredInfoComponent);
        component = fixture.componentInstance;
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        component.memberInfo = {
            name: { firstName: "Test", lastName: "User" },
            birthDate: "",
            gender: Gender.MALE,
            ssn: "2132132112",
        };
        component.form = fb.group({
            emailAddress: [""],
            ssn: [1232144 || ""],
        });
        component.mpGroupId = "12345";
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("closeDialogAndOpenEBSInfoModal()", () => {
        it("check opening of modal on closeDialogAndOpenEBSInfoModal", () => {
            const spy1 = jest.spyOn(empoweredModalService, "openDialog");
            component.closeDialogAndOpenEBSInfoModal();
            expect(spy1).toBeCalledTimes(1);
        });
    });

    describe("closeDialogAndOpenEBSInfoModal()", () => {
        it("check opening of info modal", () => {
            const spy1 = jest.spyOn(empoweredModalService, "openDialog");
            component.closeDialogAndOpenEBSInfoModal();
            expect(spy1).toBeCalledTimes(1);
        });

        it("check closing of required info modal", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.closeDialogAndOpenEBSInfoModal();
            expect(spy1).toBeCalledTimes(1);
        });

        it("check closing of info modal", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "addPanelClass");
            component.closeDialogAndOpenEBSInfoModal();
            expect(spy1).toBeCalledTimes(1);
        });

        it("check event trigger", () => {
            const spy1 = jest.spyOn(component.isEbsRequiredFlow, "emit");
            component.closeDialogAndOpenEBSInfoModal();
            expect(spy1).toBeCalledTimes(1);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });
    });
});
