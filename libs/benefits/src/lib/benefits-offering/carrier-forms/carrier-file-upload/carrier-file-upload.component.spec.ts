import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CarrierFileUploadComponent } from "./carrier-file-upload.component";
import { DocumentApiService } from "@empowered/api";
import { NgxsModule, Store } from "@ngxs/store";
import { of } from "rxjs";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { HttpClientTestingModule } from "@angular/common/http/testing";

class MockDocumentApiService {
    deleteDocument = () => of({});
}

class MockStore {
    dispatch = () => of({});
    selectSnapshot = () => of({});
    select = () => of({});
}

describe("CarrierFileUploadComponent", () => {
    let component: CarrierFileUploadComponent;
    let fixture: ComponentFixture<CarrierFileUploadComponent>;
    let documentsService: DocumentApiService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CarrierFileUploadComponent],
            providers: [
                { provide: DocumentApiService, useClass: MockDocumentApiService },
                { provide: Store, useClass: MockStore },
            ],
            imports: [NgxsModule.forRoot([]), HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CarrierFileUploadComponent);
        component = fixture.componentInstance;

        documentsService = TestBed.inject(DocumentApiService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("validateFileAndUpload()", () => {
        it("should upload file", () => {
            const event = {
                name: "dummy",
            } as File;
            component.validateFileAndUpload(event);
            expect(component.files.length).toBe(1);
            expect(component.fileUploadPercentage).toBe(0);
            expect(component.isProgressBarEnabled).toBe(false);
            expect(component.isUploadingStarted).toBe(true);
        });
    });

    describe("cancelUpload()", () => {
        it("should delete document", () => {
            component.documentId = 123;
            const deleteDocumentSpy = jest.spyOn(documentsService, "deleteDocument");
            component.cancelUpload();
            expect(deleteDocumentSpy).toHaveBeenCalledTimes(1);
        });

        it("should reset all variables", () => {
            component.documentId = 0;
            component.cancelUpload();
            expect(component.files.length).toBe(0);
            expect(component.hasError.length).toBe(0);
            expect(component.isSucess.length).toBe(0);
            expect(component.documentIds.length).toBe(0);
            expect(component.uploadSuccessStatus.length).toBe(0);
            expect(component.isFileSelected).toBe(false);
            expect(component.isUploadingStarted).toBe(false);
        });
    });
});
