import { TestBed } from "@angular/core/testing";
import { DevOnlyGuard } from "./dev-only.guard";
import { ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";

describe("DevOnlyGuard", () => {
    let service: DevOnlyGuard;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DevOnlyGuard);
    });

    describe("DevOnlyGuard", () => {
        it("should be defined", () => {
            expect(service).toBeTruthy();
        });

        describe("canActivate()", () => {
            it("should be able to navigate if it's DEV env", () => {
                expect(
                    service.canActivate({ data: { configuration: "DEV" } } as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
                ).toBe(true);
            });
        });
    });
});
