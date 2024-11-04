import { TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { WebsocketService } from "./websocket.service";

describe("WebsocketService", () => {
    let service: WebsocketService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [WebsocketService],
            imports: [RouterTestingModule],
        });

        TestBed.configureTestingModule({});
        service = TestBed.inject(WebsocketService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("WebsocketService", () => {
        it("should be defined", () => {
            expect(service).toBeTruthy();
        });
    });
});
