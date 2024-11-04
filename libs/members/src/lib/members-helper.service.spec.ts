import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";
import { MembersHelperService } from "./members-helper.service";

describe("MembersHelperService", () => {
    let service: MembersHelperService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [],
        });

        service = TestBed.inject(MembersHelperService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("employeeStatus", () => {
        it("should set employee status", () => {
            const isEmployeeActive$ = new BehaviorSubject<string>("");
            expect(service.employeeStatus$).toStrictEqual(isEmployeeActive$.asObservable());
        });
    });

    describe("tpiAccountStatus", () => {
        it("should set tpi account status to false", () => {
            const isTpiAccount$ = new BehaviorSubject<boolean>(false);
            expect(service.isTpiAccountStatus$).toStrictEqual(isTpiAccount$.asObservable());
        });
    });

    describe("updateEmployeeStatus()", () => {
        it("should set isEmployeeActive subject", () => {
            const spy = jest.spyOn(service["isEmployeeActive$"], "next");
            service.updateEmployeeStatus("hello");
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("getEmployeeStatus()", () => {
        it("should get employeeStatus subject", () => {
            expect(service.getEmployeeStatus()).toStrictEqual(service.employeeStatus$);
        });
    });
});
