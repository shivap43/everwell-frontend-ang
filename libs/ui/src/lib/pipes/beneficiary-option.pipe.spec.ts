import { BeneficiaryModel } from "@empowered/constants";
import { FilterOptionPipe } from "./beneficiary-option.pipe";

describe("FilterOptionPipe", () => {
    let pipe: FilterOptionPipe;
    const options: BeneficiaryModel[] = [
        {
            id: 1,
            name: "Beneficiary 1",
            dependentId: 2,
        },
        {
            id: 2,
            name: "Beneficiary 2",
            dependentId: 3,
        },
        {
            id: 3,
            name: "Beneficiary 3",
            dependentId: 2,
        },
        {
            id: 4,
            name: "Beneficiary 4",
            dependentId: 3,
        },
    ];
    beforeEach(() => {
        pipe = new FilterOptionPipe();
    });

    it("should create an instance of the pipe", () => {
        expect(pipe).toBeTruthy();
    });

    it("should filter out selections other than the one at index", () => {
        const result = pipe.transform(
            options,
            [
                { id: 3, name: "Beneficiary 3", dependentId: 2 },
                { id: 4, name: "Beneficiary 4", dependentId: 3 },
            ],
            1,
        );
        expect(result.every((option) => [1, 2, 4].includes(option.id))).toBeTruthy();
    });

    it("should not filter out selections that are the same dependentId as the selection at index", () => {
        const result = pipe.transform(
            options.map((option) => (option.id === 3 ? { ...options, dependentId: 3 } : option)),
            [
                { id: 3, name: "Beneficiary 3", dependentId: 3 },
                { id: 4, name: "Beneficiary 4", dependentId: 3 },
            ],
            1,
        );
        expect(result.length).toEqual(4);
    });
});
