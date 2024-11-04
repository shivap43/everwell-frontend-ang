import { CommonService } from "@empowered/api";
import { of } from "rxjs";

export const mockCommonService = {
    getLanguages: (tagName: string) => of([]),
} as CommonService;
