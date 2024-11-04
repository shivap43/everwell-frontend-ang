import { TestBed } from "@angular/core/testing";
import { from } from "rxjs";
import * as helpers from "./rxjs.service";
import { RXJSService } from "./rxjs.service";

describe("RXJSService", () => {
    let service: RXJSService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(RXJSService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("compareId()", () => {
        it("test", () => {
            const spy = jest.spyOn(helpers, "compareId");
            service.compareId({ id: 1 }, { id: 1 });
            expect(spy).toBeCalledWith({ id: 1 }, { id: 1 });
        });

        it("should return true if instances have matching id", () => {
            const result = service.compareId({ id: 1 }, { id: 1 });
            expect(result).toBe(true);
        });

        it("should return false if instances DO NOT have matching id", () => {
            const result = service.compareId({ id: 1 }, { id: 9 });
            expect(result).toBe(false);
        });
    });

    describe("distinctArrayUntilChanged()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            jest.resetAllMocks();
            jest.restoreAllMocks();
        });

        it("should use `compareId` by default if no compare function is passed", () => {
            const previousValues = [{ id: 1 }, { id: 2 }];
            const currentValues = [{ id: 1 }, { id: 2 }];

            const spy = jest.spyOn(helpers, "compareId");

            from([previousValues, currentValues]).pipe(service.distinctArrayUntilChanged()).subscribe();

            expect(spy).toHaveBeenNthCalledWith(1, { id: 1 }, { id: 1 });
            expect(spy).toHaveBeenNthCalledWith(2, { id: 2 }, { id: 2 });
            expect(spy).toBeCalledTimes(2);
        });

        it("should use `compare function if passed", () => {
            // Custom comparison that compares object reference instead of comparing ids
            const customCompare = jest.fn((a: unknown, b: unknown) => a === b);

            const first = { id: 1 };
            const previousValues = [first, { id: 2 }, { id: 3 }];
            const currentValues = [first, { id: 2 }, { id: 3 }];

            from([previousValues, currentValues]).pipe(service.distinctArrayUntilChanged(customCompare)).subscribe();

            // Expected to "pass" the comparison: 1st objects are the same
            expect(customCompare).toHaveBeenNthCalledWith(1, { id: 1 }, { id: 1 });
            expect(customCompare).toHaveNthReturnedWith(1, true);
            // Expected to "fail" the comparison: 2nd objects are NOT the same
            expect(customCompare).toHaveBeenNthCalledWith(2, { id: 2 }, { id: 2 });
            expect(customCompare).toHaveNthReturnedWith(2, false);
            // Shouldn't make the 3rd comparison since the 2nd comparison returns false and distinctArrayUntilChanged exits early
            expect(customCompare).toBeCalledTimes(2);
        });

        it("should filtered emitted values when comparisons suggest array hasn't changed", () => {
            const previousValues = [{ id: 1 }, { id: 2 }];
            const currentValues = [{ id: 1 }, { id: 2 }];

            expect(previousValues).toStrictEqual(currentValues);

            let count = 0;

            from([previousValues, currentValues])
                .pipe(service.distinctArrayUntilChanged())
                .subscribe((x) => {
                    count += 1;
                });

            expect(count).toBe(1);
        });

        it("should emitted values when array changes length", () => {
            const previousValues = [{ id: 1 }];
            const currentValues = [{ id: 1 }, { id: 2 }];

            expect(previousValues).not.toStrictEqual(currentValues);
            expect(previousValues[0]).toStrictEqual(currentValues[0]);

            let count = 0;

            from([previousValues, currentValues])
                .pipe(service.distinctArrayUntilChanged())
                .subscribe(() => {
                    count += 1;
                });

            expect(count).toBe(2);
        });

        it("should emitted values when some comparison suggest array has changed", () => {
            const previousValues = [{ id: 1 }, { id: 2 }];
            const currentValues = [{ id: 1 }, { id: 3 }];

            expect(previousValues).not.toStrictEqual(currentValues);
            expect(previousValues[0]).toStrictEqual(currentValues[0]);
            expect(previousValues[1]).not.toStrictEqual(currentValues[1]);

            let count = 0;

            from([previousValues, currentValues])
                .pipe(service.distinctArrayUntilChanged())
                .subscribe(() => {
                    count += 1;
                });

            expect(count).toBe(2);
        });
    });
});
