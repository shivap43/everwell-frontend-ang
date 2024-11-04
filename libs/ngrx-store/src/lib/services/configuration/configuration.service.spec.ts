import { TestBed } from "@angular/core/testing";
import { Configuration, ConfigurationDataType } from "@empowered/constants";

import {
    ConfigurationService,
    getBooleanValue,
    getIntegerValue,
    getList,
    getListBooleanValue,
    getListIntegerValue,
    getListStringValue,
    getStringValue,
} from "./configuration.service";

describe("ConfigurationService", () => {
    let service: ConfigurationService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ConfigurationService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("getStringValue()", () => {
        it("should get value and cast as string", () => {
            expect(getStringValue("900")).toBe("900");
        });
    });

    describe("getIntegerValue()", () => {
        it("should get value and cast as number", () => {
            expect(getIntegerValue("900")).toBe(900);
        });
    });

    describe("getBooleanValue()", () => {
        it("should get value and cast as boolean", () => {
            expect(getBooleanValue("False")).toBe(false);
        });

        it("should handle multiple cases", () => {
            expect(getBooleanValue("TRUE")).toBe(true);
        });
    });

    describe("getList()", () => {
        it("should get value and list of values (of strings)", () => {
            expect(getList("first,second, third")).toStrictEqual(["first", "second", "third"]);
        });
    });

    describe("getListStringValue()", () => {
        it("should get value and list of values as strings", () => {
            expect(getListStringValue("first,second, third")).toStrictEqual(["first", "second", "third"]);
        });
    });

    describe("getListIntegerValue()", () => {
        it("should get value and list of values as numbers", () => {
            expect(getListIntegerValue("1,22, 333")).toStrictEqual([1, 22, 333]);
        });
    });

    describe("getListBooleanValue()", () => {
        it("should get value and list of values as booleans", () => {
            expect(getListBooleanValue("false, False,TRUE, tRUe")).toStrictEqual([false, false, true, true]);
        });
    });

    describe("getProcessedConfigurationValue()", () => {
        it("should process configuration value using getStringValue", () => {
            expect(service.getProcessedConfigurationValue({ dataType: ConfigurationDataType.STRING, value: "900" } as Configuration)).toBe(
                "900",
            );
        });

        it("should process configuration value using getIntegerValue", () => {
            expect(service.getProcessedConfigurationValue({ dataType: ConfigurationDataType.INTEGER, value: "900" } as Configuration)).toBe(
                900,
            );
        });

        it("should process configuration value using getBooleanValue", () => {
            expect(
                service.getProcessedConfigurationValue({ dataType: ConfigurationDataType.BOOLEAN, value: "FALsE" } as Configuration),
            ).toBe(false);
        });

        it("should process configuration value using getListStringValue", () => {
            expect(
                service.getProcessedConfigurationValue({ dataType: ConfigurationDataType.LIST_STRING, value: "900, 800" } as Configuration),
            ).toStrictEqual(["900", "800"]);
        });

        it("should process configuration value using getListIntegerValue", () => {
            expect(
                service.getProcessedConfigurationValue({
                    dataType: ConfigurationDataType.LIST_INTEGER,
                    value: "900, 800",
                } as Configuration),
            ).toStrictEqual([900, 800]);
        });

        it("should process configuration value using getListBooleanValue", () => {
            expect(
                service.getProcessedConfigurationValue({
                    dataType: ConfigurationDataType.LIST_BOOLEAN,
                    value: "true, false",
                } as Configuration),
            ).toStrictEqual([true, false]);
        });

        it("should throw error when unknown configuration DataType is used", () => {
            expect(() =>
                service.getProcessedConfigurationValue({ dataType: "Unknown" as ConfigurationDataType, value: "900" } as Configuration),
            ).toThrowError("Unexpected ConfigurationDataType");
        });
    });
});
