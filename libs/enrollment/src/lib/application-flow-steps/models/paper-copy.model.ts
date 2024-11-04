import { Observable } from "rxjs";

export interface PaperCopyModel {
    preliminaryFormPaths: string[];
    memberId$: Observable<number>;
    mpGroupId: number;
    cartIds: number[];
}
