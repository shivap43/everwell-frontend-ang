import { LanguageModel } from "@empowered/api";
import { LabelFilterPipe } from "./label-filter.pipe";

describe("MaskPaymentPipe", () => {
    let pipe: LabelFilterPipe;
    let items: LanguageModel[];

    beforeEach(() => {
        pipe = new LabelFilterPipe();
        items = [
            {
                tagName: "primary.portal.common.close",
                value: "Close",
            },
            {
                tagName: "primary.portal.common.save",
                value: "Save",
            },
            {
                tagName: "primary.portal.common.submit",
                value: "Submit",
            },
        ] as LanguageModel[];
    });

    it("create an instance of the pipe", () => {
        expect(pipe).toBeTruthy();
    });

    it("should return '' if items is falsy", () => {
        expect(pipe.transform(null, "test")).toEqual("");
    });

    it("should return '' if searchText is falsy", () => {
        expect(pipe.transform([], "")).toEqual("");
    });

    it("should return tagName of a matching element", () => {
        expect(pipe.transform(items, "primary.portal.common.submit")).toEqual("Submit");
    });

    it("should return '' if items is empty", () => {
        expect(pipe.transform([], "primary.portal.common.submit")).toEqual("");
    });
});
