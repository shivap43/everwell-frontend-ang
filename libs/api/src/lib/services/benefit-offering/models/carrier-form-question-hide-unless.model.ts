export interface CarrierFormQuestionHideUnless {
    questionId: number;
    response: string;
    // If any of the responses with aloneSatisfies as true are given, then the question is shown.
    // Otherwise, all of the responses must be given.
    aloneSatisfies: boolean;
}
