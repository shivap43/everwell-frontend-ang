import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTableModule } from "@angular/material/table";
import {
    AccountProfileService,
    BenefitsOfferingService,
    CensusMapping,
    CensusService,
    CensusTemplate,
    ClassType,
    DocumentApiService,
    MemberService,
} from "@empowered/api";
import { Documents, PlanYear } from "@empowered/constants";
import { DateService } from "@empowered/date";
import { LanguageService } from "@empowered/language";
import { UtilService } from "@empowered/ngxs-store";
import {
    mockAccountProfileService,
    mockBenefitsOfferingService,
    mockCensusService,
    mockDateService,
    mockDocumentApiService,
    mockLanguageService,
    mockMatDialog,
    mockMatDialogData,
    mockMemberService,
    MockReplaceTagPipe,
    mockStore,
    mockUtilService,
} from "@empowered/testing";
import { Store } from "@ngxs/store";
import { of } from "rxjs";
import { UploadCensusComponent } from "./upload-census.component";
describe("UploadCensusComponent", () => {
    let component: UploadCensusComponent;
    let fixture: ComponentFixture<UploadCensusComponent>;
    let benefitOfferingService: BenefitsOfferingService;
    let memberService: MemberService;
    let documentApiService: DocumentApiService;
    let censusService: CensusService;
    let accountProfileService: AccountProfileService;
    let matDialogRef: MatDialogRef<UploadCensusComponent>;
    let fb: FormBuilder;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, ReactiveFormsModule, MatTableModule],
            declarations: [UploadCensusComponent, MockReplaceTagPipe],
            providers: [
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: Store, useValue: mockStore },
                { provide: MemberService, useValue: mockMemberService },
                { provide: BenefitsOfferingService, useValue: mockBenefitsOfferingService },
                { provide: UtilService, useValue: mockUtilService },
                { provide: DateService, useValue: mockDateService },
                { provide: MatDialogRef, useValue: mockMatDialog },
                { provide: MAT_DIALOG_DATA, useValue: mockMatDialogData },
                { provide: DocumentApiService, useValue: mockDocumentApiService },
                { provide: CensusService, useValue: mockCensusService },
                { provide: AccountProfileService, useValue: mockAccountProfileService },
                FormBuilder,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(UploadCensusComponent);
        component = fixture.componentInstance;
        benefitOfferingService = TestBed.inject(BenefitsOfferingService);
        memberService = TestBed.inject(MemberService);
        documentApiService = TestBed.inject(DocumentApiService);
        censusService = TestBed.inject(CensusService);
        matDialogRef = TestBed.inject(MatDialogRef);
        component.mpGroupId = 12345;
        accountProfileService = TestBed.inject(AccountProfileService);
        fb = TestBed.inject(FormBuilder);
        component.censusForm = fb.group({
            censusMapping: [""],
            isContainsHeader: [false],
            pageNumberControl: [1],
        });
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("getLanguageStrings()", () => {
        it("should fetch language strings", () => {
            component.getLanguageStrings();
            expect(component.langStrings).toBeDefined();
        });
    });
    describe("getEnrollmentStartDate()", () => {
        it("should call getPlanYears and set onlyUpdate,changeFile", () => {
            const spy = jest.spyOn(benefitOfferingService, "getPlanYears");
            component.getEnrollmentStartDate();
            expect(component.onlyUpdate).toBe(false);
            jest.spyOn(benefitOfferingService, "getPlanYears").mockReturnValue(
                of([
                    {
                        enrollmentPeriod: {
                            effectiveStarting: "20-08-2023",
                        },
                    },
                ] as PlanYear[]),
            );
            component.getEnrollmentStartDate();
            expect(component.onlyUpdate).toBe(true);
            expect(component.changeFile).toBe(true);
            expect(spy).toBeCalledTimes(2);
        });
    });
    describe("replaceOrUpdate()", () => {
        it("should set changeFile", () => {
            component.replaceOrUpdate("update");
            expect(component.changeFile).toBe(true);
            component.replaceOrUpdate("replace");
            expect(component.changeFile).toBe(false);
        });
    });
    describe("getCurrentEmployeeList()", () => {
        it("should call downloadActiveMemberCensus", () => {
            component.lastUploadedFileID = 111;
            component.lastUploadFileName = "test.xlsm";
            const spy = jest.spyOn(memberService, "downloadActiveMemberCensus");
            component.getCurrentEmployeeList();
            expect(spy).toBeCalledTimes(1);
        });
    });
    describe("sortData()", () => {
        it("should set activeCol", () => {
            component.sortData({ active: "data" });
            expect(component.activeCol).toStrictEqual("data");
        });
    });
    describe("getExistingDocument()", () => {
        it("should call searchDocuments", () => {
            const spy = jest.spyOn(documentApiService, "searchDocuments").mockReturnValue(
                of({
                    content: [
                        {
                            fileName: "document1",
                            id: 1,
                            status: "COMPLETE",
                            uploadDate: "09/07/2023",
                            uploadAdmin: {
                                name: {
                                    firstName: "chris",
                                    lastName: "evans",
                                },
                            },
                        },
                    ],
                } as Documents),
            );
            component.getExistingDocument();
            expect(spy).toBeCalledWith(12345, { property: "type", value: "CENSUS" }, "uploadAdminId");
            expect(component.uploadedAdminName).toStrictEqual("chris evans");
        });
        describe("saveCustomClassTypes()", () => {
            it("should map censusMap fields", () => {
                component.censusMap = {
                    fields: [
                        {
                            value: "element1",
                        },
                        {
                            value: "element2",
                        },
                    ],
                } as CensusMapping;
                component.classTypes = [
                    { name: "element1", id: 1 },
                    { name: "element2", id: 2 },
                ];
                component.saveCustomClassTypes();
                expect(component.censusMap).toStrictEqual({
                    fields: [
                        { value: "element1", name: "customClassType-1" },
                        { value: "element2", name: "customClassType-2" },
                    ],
                });
            });
        });
        describe("getCensusTemplate()", () => {
            it("should call getCensusTemplate and set censusMappingFields", () => {
                component.mappingLanguage = "customClassType";
                const spy = jest.spyOn(censusService, "getCensusTemplate").mockReturnValue(
                    of({
                        censusMappingResource: {
                            fields: [
                                {
                                    value: "value1",
                                    name: "element1",
                                },
                                {
                                    value: "value2",
                                    name: "element2",
                                },
                            ],
                        },
                    } as CensusTemplate),
                );
                component.getCensusTemplate();
                expect(spy).toBeCalledWith(12345);
                expect(component.censusMappingFields).toStrictEqual([{ value: "customClassTypeelement1", name: "element1" }]);
            });
        });
        describe("getClassTypes()", () => {
            it("should call getClassTypes and set classTypes", () => {
                const spy = jest.spyOn(accountProfileService, "getClassTypes").mockReturnValue(of([{ name: "type1" }] as ClassType[]));
                component.getClassTypes();
                expect(spy).toBeCalledWith("12345");
                expect(component.classTypes).toStrictEqual([{ name: "type1" }]);
            });
        });
        describe("setDataForError()", () => {
            it("should set date for error", () => {
                component.setDataForError(true);
                expect(component.isFileUploaded).toBe(false);
                expect(component.isProgressBarEnabled).toBe(false);
                expect(component.hasError).toStrictEqual([true]);
            });
        });
    });

    describe("setDataForError()", () => {
        it("should set progress bar enabled to false incase of any API error", () => {
            component.setDataForError(true);
            expect(component.isUploadingStarted).toBeFalsy();
            expect(component.isProgressBarEnabled).toBeFalsy();
            expect(component.hasError).toStrictEqual([true]);
            expect(component.isSucess).toStrictEqual([false]);
        });

        it("should set progress bar enabled to true incase of no API error", () => {
            component.setDataForError(false);
            expect(component.isFileSelected).toBeTruthy();
            expect(component.isProgressBarEnabled).toBeTruthy();
            expect(component.hasError).toStrictEqual([true]);
            expect(component.isSucess).toStrictEqual([false]);
        });
    });

    describe("ConvertToCSV()", () => {
        it("should set the error message as 2,3,Invalid Characters", () => {
            const obj = [
                {
                    errorRow: "2",
                    errorColumn: "3",
                    errorMessage: "Invalid Characters",
                },
            ];
            const errorMessage = component.ConvertToCSV(obj);
            expect(errorMessage).toContain("2,3,Invalid Characters");
        });
    });

    describe("onSave()", () => {
        it("should file length is zero", () => {
            component.files.length = 0;
            component.onSave();
            expect(component.files).toStrictEqual([]);
            expect(component.selectForUpload).toBeTruthy();
            expect(component.isFileSelected).toBeFalsy();
        });

        it("should file uploaded - close the dialog", () => {
            component.files.length = 200;
            component.isFileUploaded = true;
            const spy = jest.spyOn(matDialogRef, "close");
            component.onSave();
            expect(spy).toBeCalledTimes(1);
        });

        it("should set error if mapping required true", () => {
            component.files.length = 200;
            component.isFileUploaded = false;
            component.isMappingRequired = true;
            component.onSave();
            expect(component.validationError).toEqual("secondary.portal.shared.mapping.mapNameRequired");
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
