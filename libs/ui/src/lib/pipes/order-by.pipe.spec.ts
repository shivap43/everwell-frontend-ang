import { SortStatesPipe } from "./order-by.pipe";

describe("SortStatesPipe", () => {
    let pipe: SortStatesPipe;

    beforeEach(() => {
        pipe = new SortStatesPipe();
    });

    it("create an instance of the pipe", () => {
        expect(pipe).toBeTruthy();
    });

    it("should return empty array after sorting an empty array", () => {
        const result = pipe.transform([]);
        expect(result).toEqual([]);
    });

    it("should sort states based on abbreviation", () => {
        const result = pipe.transform([
            { abbreviation: "GA", name: "Georgia" },
            { abbreviation: "AL", name: "Alabama" },
            { abbreviation: "TX", name: "Texas" },
            { abbreviation: "MD", name: "Maryland" },
            { abbreviation: "MA", name: "Massachusetts" },
        ]);
        expect(result).toStrictEqual([
            { abbreviation: "AL", name: "Alabama" },
            { abbreviation: "GA", name: "Georgia" },
            { abbreviation: "MA", name: "Massachusetts" },
            { abbreviation: "MD", name: "Maryland" },
            { abbreviation: "TX", name: "Texas" },
        ]);
    });
});
