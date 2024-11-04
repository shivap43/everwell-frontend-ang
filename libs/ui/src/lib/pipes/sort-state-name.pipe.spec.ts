import { SortStatesNamePipe } from "./sort-state-name.pipe";

describe("SortStatesNamePipe", () => {
    let pipe: SortStatesNamePipe;

    beforeEach(() => {
        pipe = new SortStatesNamePipe();
    });

    it("create an instance of the pipe", () => {
        expect(pipe).toBeTruthy();
    });

    it("should return empty array after sorting an empty array", () => {
        const result = pipe.transform([]);
        expect(result).toEqual([]);
    });

    it("should sort states based on name", () => {
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
            { abbreviation: "MD", name: "Maryland" },
            { abbreviation: "MA", name: "Massachusetts" },
            { abbreviation: "TX", name: "Texas" },
        ]);
    });
});
