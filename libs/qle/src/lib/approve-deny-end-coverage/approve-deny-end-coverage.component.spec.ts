import { RouterTestingModule } from "@angular/router/testing";
import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MemberQualifyingEventApprove, FileDetails } from "@empowered/constants";
import { mockDatePipe, mockMatDialog } from "@empowered/testing";
import { NgxsModule } from "@ngxs/store";
import { ApproveDenyEndCoverageComponent } from "./approve-deny-end-coverage.component";

describe("ApproveDenyEndCoverageComponent", () => {
    let component: ApproveDenyEndCoverageComponent;
    let fixture: ComponentFixture<ApproveDenyEndCoverageComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ApproveDenyEndCoverageComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule],
            providers: [
                FormBuilder,
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        selectedVal: {
                            requestedCoverageEndDate: "12-12-1990",
                        },
                    },
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ApproveDenyEndCoverageComponent);
        component = fixture.componentInstance;
        component.selectedQLE = {
            requestedCoverageEndDate: "12-12-2000",
        } as MemberQualifyingEventApprove;
        component.files = [
            {
                documentId: 7,
            } as FileDetails,
        ];
    });

    describe("ApproveDenyEndCoverageComponent", () => {
        it("should create component", () => {
            expect(component).toBeTruthy();
        });
    });

    describe("initializeForm()", () => {
        it("should initialize form and update the selected QLE object", () => {
            component.initializeForm();
            expect(component.selectedQLE.requestedCoverageEndDate).toBe("12-12-2000");
        });
    });
    describe("fileUploadedSuccess", () => {
        it("should fail the upload as it ended with virus scan failure", () => {
            component.fileUploadedSuccess("VIRUS_SCAN_FAILED", null);
            expect(component.isSuccess[0]).toBeFalsy();
        });
        it("should successfully upload the files", () => {
            component.fileUploadedSuccess("COMPLETE", { documentId: 7 } as FileDetails);
            expect(component.isSuccess[0]).toBeTruthy();
        });
    });

    describe("fileUploadError()", () => {
        it("should populate the error object", () => {
            component.fileUploadError("error in uploading");
            expect(component.hasError[0]).toBeTruthy();
        });
    });
});
