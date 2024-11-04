import { FilterSpousePipe } from "./dependents-spouse.pipe";

describe("FilterSpousePipe", () => {
    let pipe: FilterSpousePipe;

    beforeEach(() => {
        pipe = new FilterSpousePipe();
    });

    it("should create an instance of the pipe", () => {
        expect(pipe).toBeTruthy();
    });

    it("should return an empty array on an empty array input", () => {
        expect(pipe.transform([], [0, 1], 0)).toHaveLength(0);
    });

    it("should return items if index matches the first seletion", () => {
        expect(pipe.transform(["Spouse", "Child", "Grandchild"], [0, 1], 0)).toHaveLength(3);
    });

    it("should return items excluding spouse if index does not match the first seletion", () => {
        expect(pipe.transform(["Spouse", "Child", "Grandchild"], [0, 1], 1)).toHaveLength(2);
    });

    it("should return the input if it is falsy", () => {
        expect(pipe.transform(null, [0, 1], 1)).toBeFalsy();
    });
});
