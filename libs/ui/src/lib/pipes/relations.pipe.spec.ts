import { RelationsPipe } from "./relations.pipe";

describe("RelationsPipe", () => {
    let pipe: RelationsPipe;

    beforeEach(() => {
        pipe = new RelationsPipe();
    });

    it("create an instance of the pipe", () => {
        expect(pipe).toBeTruthy();
    });

    it("should return '' if there are no dependents added", () => {
        expect(pipe.transform([])).toEqual("");
    });

    it("should return dependent's relation to member", () => {
        expect(pipe.transform([{ firstName: "Josephine", lastName: "Bucket", relation: "Spouse" }])).toEqual("Spouse");
        expect(pipe.transform([{ firstName: "Will", lastName: "Bucket", relation: "Child" }])).toEqual("Child");
        expect(pipe.transform([{ firstName: "Charles", lastName: "Bucket", relation: "Grandchild" }])).toEqual("Grandchild");
    });

    it("should specify the number of dependents with same relation to the member", () => {
        expect(
            pipe.transform([
                { firstName: "Will", lastName: "Bucket", relation: "Child" },
                { firstName: "George", lastName: "Bucket", relation: "Child" },
            ]),
        ).toEqual("Child (2)");
    });

    it("should return a +-delimited list of relations", () => {
        expect(
            pipe.transform([
                { firstName: "Josephine", lastName: "Bucket", relation: "Spouse" },
                { firstName: "George", lastName: "Bucket", relation: "Child" },
                { firstName: "Charles", lastName: "Bucket", relation: "Grandchild" },
            ]),
        ).toEqual("Spouse + Child + Grandchild");
    });

    it("should return a +-delimited list of relations with the number of dependents", () => {
        expect(
            pipe.transform([
                { firstName: "Josephine", lastName: "Bucket", relation: "Spouse" },
                { firstName: "Will", lastName: "Bucket", relation: "Child" },
                { firstName: "George", lastName: "Bucket", relation: "Child" },
                { firstName: "Charles", lastName: "Bucket", relation: "Grandchild" },
            ]),
        ).toEqual("Spouse + Child (2) + Grandchild");
    });
});
