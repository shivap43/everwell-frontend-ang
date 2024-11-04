import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { AccountService, Configuration } from "@empowered/api";
import { GroupAttribute } from "@empowered/constants";
import { of } from "rxjs";
import { AccountsBusinessService } from "./accounts-business.service";

describe("AccountsBusinessService", () => {
    let service: AccountsBusinessService;
    let accountService: AccountService;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [Configuration],
        });

        service = TestBed.inject(AccountsBusinessService);
        accountService = TestBed.inject(AccountService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("checkForCafeteriaEligibility()", () => {
        it("should return true as group is cafeteria eligible", (done) => {
            expect.assertions(1);
            jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValueOnce(
                of([
                    {
                        value: "true",
                    },
                ] as GroupAttribute[]),
            );
            service.checkForCafeteriaEligibility().subscribe((data) => {
                expect(data).toBe(true);
                done();
            });
        });
    });
});
