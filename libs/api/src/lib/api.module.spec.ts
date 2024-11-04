import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ApiModule } from "./api.module";

describe("ApiModule", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ApiModule, HttpClientTestingModule],
        });
    });

    it("should create the module", () => {
        const module = TestBed.inject(ApiModule);
        expect(module).toBeTruthy();
    });
});
