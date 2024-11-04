import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { FileUploadService } from "./file-upload.service";
import { NgxsModule } from "@ngxs/store";

describe("FileUploadService", () => {
    let service: FileUploadService;
    let httpTestingController: HttpTestingController;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, NgxsModule.forRoot()],
        });
        service = TestBed.inject(FileUploadService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("Testing Block for service methods", () => {
        afterEach(() => {
            httpTestingController.verify();
        });

        describe("getPreSignedUrl()", () => {
            it("should return the pre-signed url", (done) => {
                expect.assertions(2);
                const preSignedURL = "http://aws-pre-signed-url.com";
                service.getPreSignedUrl("sample_object_key").subscribe((url) => {
                    expect(url).toBe(preSignedURL);
                    done();
                });
                const req = httpTestingController.expectOne("/api/aws/s3/presignedURL?objectKey=sample_object_key");
                expect(req.request.method).toBe("GET");
                req.flush(preSignedURL);
            });
        });

        describe("uploadFile()", () => {
            it("should upload the file to AWS S3", (done) => {
                expect.assertions(2);
                const token = "https://token-for-upload.com";
                const file = {} as File;
                service.uploadFile(token, file).subscribe((resp) => {
                    expect(resp.body).toBeNull();
                    done();
                });
                const req = httpTestingController.expectOne(token);
                expect(req.request.method).toBe("PUT");
                req.flush(null);
            });
        });
    });
});
