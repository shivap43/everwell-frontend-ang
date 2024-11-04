import { ContributionType, MemberFlexDollar } from "@empowered/constants";
import { FlexDollarPipe } from "./flex-dollar.pipe";

describe("FlexDollarPipe", () => {
    let pipe: FlexDollarPipe;

    beforeEach(() => {
        pipe = new FlexDollarPipe();
    });

    it("should create an instance of the pipe", () => {
        expect(pipe).toBeTruthy();
    });

    it("should return value if the enrollment state is OH", () => {
        expect(
            pipe.transform(
                100,
                [
                    {
                        contributionType: ContributionType.PERCENTAGE,
                        amount: 10,
                        currentAmount: 10,
                    } as unknown as MemberFlexDollar,
                ],
                { id: 6, frequencyType: "BIWEEKLY_28DAY", name: "28-day biweekly", payrollsPerYear: 13 },
                "OH",
            ),
        ).toEqual(100);
    });

    it("should return value if the enrollment state is NY", () => {
        expect(
            pipe.transform(
                100,
                [
                    {
                        contributionType: ContributionType.PERCENTAGE,
                        amount: 10,
                        currentAmount: 10,
                    } as unknown as MemberFlexDollar,
                ],
                { id: 6, frequencyType: "BIWEEKLY_28DAY", name: "28-day biweekly", payrollsPerYear: 13 },
                "OH",
            ),
        ).toEqual(100);
    });

    it("should return value if flexDollar is empty", () => {
        expect(
            pipe.transform(100, [], { id: 6, frequencyType: "BIWEEKLY_28DAY", name: "28-day biweekly", payrollsPerYear: 13 }, "OH"),
        ).toEqual(100);
    });

    it("should return same value if flex dollar array is empty", () => {
        expect(pipe.transform(10, [])).toBe(10);
    });

    it("should reduce the flex dollar amount if flex dollar array has FLAT_AMOUNT", () => {
        const flexDollars = [{ amount: 4, contributionType: ContributionType.FLAT_AMOUNT } as MemberFlexDollar];
        expect(pipe.transform(10, flexDollars)).toBe(6);
    });

    it("should return 0 if flex dollar array has more FLAT_AMOUNT than actual value", () => {
        const flexDollars = [{ amount: 12, contributionType: ContributionType.FLAT_AMOUNT } as MemberFlexDollar];
        expect(pipe.transform(10, flexDollars)).toBe(0);
    });

    it("should not consider flex dollars if enrollment state is NY", () => {
        const flexDollars = [{ amount: 12, contributionType: ContributionType.FLAT_AMOUNT } as MemberFlexDollar];
        expect(pipe.transform(10, flexDollars, null, "NY")).toBe(10);
    });
});
