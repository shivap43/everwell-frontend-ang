import { TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { from } from "rxjs";

import { ConfirmSsnService } from "./confirm-ssn.service";

describe("ConfirmSsnService", () => {
    let service: ConfirmSsnService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ConfirmSsnService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
    describe("disableControl()", () => {
        it("should disable control if observable emits true", (done) => {
            expect.assertions(4);

            const control = new FormControl();
            const formSubmitted$ = from([false, true, false, true]);
            const disableSpy = jest.spyOn(control, "disable");
            const disableControl$ = service.disableControl(control, formSubmitted$);

            disableControl$.subscribe((disable) => {
                expect(disable).toBeTruthy();
                expect(disableSpy).toBeCalledTimes(1);
                done();
            });
        });
    });

    describe("updateControl()", () => {
        it("should enable/disable control depending on original SSN control's value", (done) => {
            expect.assertions(2);

            const confirmSSN = new FormControl({ value: "", disabled: true });
            const latestValidSSN$ = from(["111-22-9929"]);
            const ssnInputChanges$ = from(["111", "111-2", ""]);
            const enableSpy = jest.spyOn(confirmSSN, "enable");
            const resetSpy = jest.spyOn(confirmSSN, "reset");
            const updateControl$ = service.updateControl(confirmSSN, latestValidSSN$, ssnInputChanges$);

            updateControl$.subscribe({
                next: () => {},
                complete: () => {
                    expect(enableSpy).toHaveBeenCalledTimes(1);
                    expect(resetSpy).toHaveBeenCalledTimes(2);
                    done();
                },
            });
        });
    });
    describe("updateValidators()", () => {
        it("should update validators on confirm SSN control as the original SSN control's value is changed", (done) => {
            expect.assertions(3);

            const confirmSSN = new FormControl("111-22-9929");
            const latestValidSSN$ = from(["111-22-9929"]);
            const setValidatorsSpy = jest.spyOn(confirmSSN, "setValidators");
            const updateValueSpy = jest.spyOn(confirmSSN, "updateValueAndValidity");
            const updateValidators$ = service.updateValidators(confirmSSN, latestValidSSN$, from(["VALID"]));

            updateValidators$.subscribe({
                next: () => {},
                complete: () => {
                    expect(confirmSSN.valid).toBeTruthy();
                    expect(setValidatorsSpy).toHaveBeenCalled();
                    expect(updateValueSpy).toHaveBeenCalled();
                    done();
                },
            });
        });
    });
});
