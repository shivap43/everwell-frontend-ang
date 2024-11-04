import { TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { WebsocketsModule } from "./websockets.module";

describe("WebsocketsModule", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                WebsocketsModule,
                NgxsModule.forRoot([]), // import real module without state
            ],
        });
    });

    it("should create the module", () => {
        const module = TestBed.inject(WebsocketsModule);
        expect(module).toBeTruthy();
    });
});
