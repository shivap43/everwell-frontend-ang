import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { FormBuilder, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AflacService } from "@empowered/api";
import { SelfEnrollmentSitCodeComponent } from "./self-enrollment-sit-code.component";
import { CompanyCode, WritingNumber } from "@empowered/constants";
import { mockAflacService } from "@empowered/testing";

describe("SelfEnrollmentSitCodeComponent", () => {
    let component: SelfEnrollmentSitCodeComponent;
    let fixture: ComponentFixture<SelfEnrollmentSitCodeComponent>;
    const formBuilder: FormBuilder = new FormBuilder();
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, FormsModule, ReactiveFormsModule],
            declarations: [SelfEnrollmentSitCodeComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [{ provide: AflacService, useValue: mockAflacService }],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(SelfEnrollmentSitCodeComponent);
        component = fixture.componentInstance;
        component.stepControl = formBuilder.group({
            writingNumber: [""],
            sitCode: [""],
        });
        component.languageStrings = { "primary.portal.enrollmentInfoPopup.step2": "Step 2" } as Record<string, string>;
        component.companyCode = "US" as CompanyCode;
    });

    describe("onSelectOfWritingNo()", () => {
        const writingNumbers = {
            sitCodes: [
                {
                    companyCode: "US",
                    id: 1,
                },
            ],
        } as WritingNumber;
        it("should set the SIT code length if company code doesn't matches with writing number", () => {
            component.companyCode = "NY" as CompanyCode;
            component.onSelectOfWritingNo(writingNumbers);
            expect(component.sitCodes.length).toBeFalsy();
        });
        it("should set the SIT code length if company code matches with writing number", () => {
            component.companyCode = "US" as CompanyCode;
            component.onSelectOfWritingNo(writingNumbers);
            expect(component.sitCodes.length).toBeTruthy();
        });
        it("should set the control of sitCode of writing number provided corresponding to the company code", () => {
            component.companyCode = "US" as CompanyCode;
            component.onSelectOfWritingNo(writingNumbers);
            expect(component.stepControl.get("sitCode").value).toBe(1);
        });
    });

    describe("getWritingNumbers()", () => {
        it("should initialize the writing numbers", () => {
            component.getWritingNumbers();
            expect(component.writingNumbers).toEqual([
                {
                    sitCodes: [
                        {
                            companyCode: "NY",
                            id: 2,
                        },
                    ],
                },
            ]);
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
