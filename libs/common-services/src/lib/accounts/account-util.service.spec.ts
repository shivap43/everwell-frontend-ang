import { TestBed } from "@angular/core/testing";
import { CrossBorderRule } from "@empowered/api";
import { AccountUtilService } from "./account-util.service";

describe("AccountUtilService", () => {
    let service: AccountUtilService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [],
        });

        service = TestBed.inject(AccountUtilService);
    });

    describe("AccountUtilService", () => {
        it("should be truthy", () => {
            expect(service).toBeTruthy();
        });
    });
    describe("checkCrossBorderRules()", () => {
        const rules = [
            {
                residentState: "GA",
                enrollmentStateRelation: "DIFFERENT_FROM_RESIDENT",
                allowEnrollment: false,
                releaseBusiness: true,
            } as CrossBorderRule,
        ];
        it("should return isMissingEAAError as true and isMissingEAAWarning as false if allowEnrollment flag is false and resident state is different from enrollment state", () => {
            const response = service.checkCrossBorderRules("CA", rules);
            expect(response.isMissingEAAError).toBe(true);
            expect(response.isMissingEAAWarning).toBe(false);
        });

        it("should return isMissingEAAError as false and isMissingEAAWarning as true if allowEnrollment flag is true and resident state is different from enrollment state", () => {
            rules[0].allowEnrollment = true;
            rules[0].releaseBusiness = false;
            const response = service.checkCrossBorderRules("CA", rules);
            expect(response.isMissingEAAWarning).toBe(true);
            expect(response.isMissingEAAError).toBe(false);
        });

        it("should return isMissingEAAError as false and isMissingEAAWarning as false if allowEnrollment and releaseBusiness flags are true and resident state is different from enrollment state", () => {
            rules[0].allowEnrollment = true;
            rules[0].releaseBusiness = true;
            const response = service.checkCrossBorderRules("CA", rules);
            expect(response.isMissingEAAWarning).toBe(false);
            expect(response.isMissingEAAError).toBe(false);
        });
    });
});
