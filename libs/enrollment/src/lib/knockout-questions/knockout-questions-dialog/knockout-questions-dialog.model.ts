import { KnockoutQuestion } from "@empowered/api";
import { Salary } from "@empowered/constants";
import { Observable } from "rxjs";

export interface KnockoutDialogData {
    isProducer: boolean;
    isEdit: boolean;
    knockoutQuestions: KnockoutQuestion[];
    memberId: number;
    mpGroup: number;
    salaries$?: Observable<Salary[]>; // Used to get Member annual salary. memberService.getSalaries will be used if not provided
    response?: any[]; // TODO: type this value and/or determine if it needs to exist as part of interface
}
