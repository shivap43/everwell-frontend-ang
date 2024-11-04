import { TestBed } from "@angular/core/testing";
import { AddressMatchingService } from "./address-matching.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { PersonalAddress } from "@empowered/constants";

describe("AddressMatchingService", () => {
    let service: AddressMatchingService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(AddressMatchingService);
    });

    describe("AddressMatchingService", () => {
        it("should be truthy", () => {
            expect(service).toBeTruthy();
        });
    });

    describe("hasAddressChanged()", () => {
        it("should return true if the addresses are different", () => {
            const prevAddress = {
                state: "GA",
                zip: "30001",
            };
            const newAddress = {
                zip: "3001",
                state: "GA",
                address1: "sample street",
            };
            expect(service.hasAddressChanged(prevAddress, newAddress)).toBe(true);
        });

        it("should return false if the address are same", () => {
            const prevAddress = {
                address1: "sample street",
                address2: "sample second street",
                state: "GA",
                zip: "30001",
            };
            const newAddress = {
                address1: "sample street",
                state: "GA",
                zip: "30001",
                address2: "sample second street",
            };
            expect(service.hasAddressChanged(prevAddress, newAddress)).toBe(false);
        });

        it("should return true if the addresses are different", () => {
            const prevAddress = {
                address1: "sample street",
                state: "GA",
                zip: "30001",
            };
            const newAddress = {
                zip: "3001",
                state: "GA",
            };
            expect(service.hasAddressChanged(prevAddress, newAddress)).toBe(true);
        });

        it("should return true if the addresses are different", () => {
            const prevAddress: PersonalAddress = {
                address1: "sample street",
                address2: "sample second street",
                state: "GA",
                zip: "30001",
            };

            const newAddress: PersonalAddress = {
                address1: "sample street",
                state: "GA",
                zip: "30001",
                city: "Atlanta",
            };
            expect(service.hasAddressChanged(prevAddress, newAddress)).toBe(true);
        });
    });
});
