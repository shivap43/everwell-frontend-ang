import { TestBed } from "@angular/core/testing";
import { ModalModeGuard } from "./modal-mode.guard";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TpiServices } from "@empowered/common-services";
import { mockTpiService } from "@empowered/testing";

describe("ModalModeGuard", () => {
    let service: ModalModeGuard;
    let tpiService: TpiServices;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            providers: [{ provide: TpiServices, useValue: mockTpiService }],
        });
        service = TestBed.inject(ModalModeGuard);
        tpiService = TestBed.inject(TpiServices);
    });

    describe("ModalModeGuard", () => {
        it("should be defined", () => {
            expect(service).toBeTruthy();
        });

        describe("canActivate()", () => {
            it("should return false and stop traversing to the route if it's LnL mode", () => {
                jest.spyOn(tpiService, "isLinkAndLaunchMode").mockReturnValue(true);
                expect(service.canActivate()).toBe(false);
            });

            it("should return true and allow traversing to the route if it's not LnL mode", () => {
                jest.spyOn(tpiService, "isLinkAndLaunchMode").mockReturnValue(false);
                expect(service.canActivate()).toBe(true);
            });
        });
    });
});
