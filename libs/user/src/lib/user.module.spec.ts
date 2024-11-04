import { TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { UserModule } from "./user.module";

describe("UserModule", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                UserModule,
                NgxsModule.forRoot([]), // import real module without state
            ],
        });
    });

    it("should create the module", () => {
        const module = TestBed.inject(UserModule);
        expect(module).toBeTruthy();
    });
});
