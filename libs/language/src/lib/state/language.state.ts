import { CommonService, LanguageModel } from "@empowered/api";
import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { EMPTY, Observable, of } from "rxjs";
import { catchError, tap, retry, first } from "rxjs/operators";
import {
    LoadLandingLanguage,
    LoadLanguage,
    LoadSecondaryLandingLanguage,
    FetchLanguage,
    FetchErrorMessageLanguage,
    ResetErrorMessageLanguage,
} from "./language.actions";
import { LanguageStateModel, LanguageModelResponse, LanguageRequest, LanguageMeta, ReducedLanguage } from "./language.model";
import { Injectable } from "@angular/core";
import { ApiError, BreakpointSizes, Vocabulary } from "@empowered/constants";

const RETRY_TIMES = 5;

enum LanguageMetaIdField {
    PARTNER = "partnerId",
    CARRIER = "carrierId",
    PRODUCT = "productId",
}

export const defaultApiErrorState: ApiError = {
    status: "",
    errorKey: "",
    value: "",
};

@State<LanguageStateModel>({
    name: "language",
    defaults: {
        errorMessage: null,
        values: [],
        secondaryValues: [],
        languages: [],
        requests: [],
        apiError: defaultApiErrorState,
    },
})
@Injectable()
export class LanguageState {
    constructor(private readonly commonService: CommonService) {}

    /**
     * Accesses languages store, filters for matching tag name
     * @param tagName the tag that needs to be filtered
     * @param breakpointSize Enum "XS", "SM", "MD", "LG", or "XL";
     * @param partnerId
     * @param vocabulary Enum: "ENGLISH" "SPANISH"
     * @param carrierId
     * @param productId
     * @returns returns the filtered response as a string
     */
    static fetchValueForTagName(
        // TODO: Unused parameters need to be implemented in the selector
        tagName: string,
        breakpointSize?: BreakpointSizes,
        partnerId?: number,
        vocabulary?: Vocabulary,
        carrierId?: number,
        productId?: number,
    ): (state: LanguageStateModel) => string {
        return createSelector([LanguageState], (state: LanguageStateModel) => {
            let returnValue = "";
            const matchingTagName = state.languages.find((storeVal) => storeVal.tagName === tagName);
            if (matchingTagName) {
                const matchingLanguageMeta = matchingTagName.languageMetas.find(
                    (meta) =>
                        !(
                            (partnerId && meta.partnerId !== partnerId) ||
                            (vocabulary && meta.vocabulary !== vocabulary) ||
                            (breakpointSize && meta.breakpointSize !== breakpointSize) ||
                            (carrierId && meta.carrierId !== carrierId) ||
                            (productId && meta.productId !== productId)
                        ),
                );
                returnValue = matchingLanguageMeta ? matchingLanguageMeta.value : "";
            }
            return returnValue;
        });
    }

    static FetchPrimaryValueForTagName(tagName: string): any {
        return createSelector([LanguageState], (state: LanguageStateModel) => {
            const choice = state.values.filter((storeVal) => storeVal.tagName === tagName);
            let returnValue = "";
            if (choice.length > 0) {
                returnValue = choice.pop().value;
            }
            return returnValue;
        });
    }

    static FetchSecondaryValueForTagName(tagName: string): any {
        return createSelector([LanguageState], (state: LanguageStateModel) => {
            const choice = state.secondaryValues.filter((storeVal) => storeVal.tagName === tagName);
            let returnValue = "";
            if (choice.length > 0) {
                returnValue = choice.pop().value;
            }
            return returnValue;
        });
    }
    /**
     * Selector to get api error message language
     * @param state variable of type LanguageStateModel
     */
    @Selector()
    static getApiErrorLanguage(state: LanguageStateModel): ApiError {
        return state.apiError;
    }

    @Selector()
    static languageList(state: LanguageStateModel): LanguageModel[] {
        return state.values;
    }

    @Selector()
    static secondaryLanguageList(state: LanguageStateModel): LanguageModel[] {
        return state.secondaryValues;
    }

    @Action(LoadLandingLanguage)
    LoadLandingLanguage(ctx: StateContext<LanguageStateModel>, action: LoadLandingLanguage): void {
        const state = ctx.getState();
        ctx.setState({
            ...state,
            values: action.language,
        });
    }

    @Action(LoadLanguage)
    loadLanguage(context: StateContext<LanguageStateModel>, action: LoadLanguage): Observable<LanguageModel[] | any> {
        const state = context.getState();
        const vocabulary = Vocabulary.ENGLISH;
        return this.commonService.getLanguages(vocabulary, action.key).pipe(
            tap((result: LanguageModel[]) => {
                const values = { ...state.values };
                context.setState({
                    ...state,
                    values: values,
                });
            }),
            catchError((error) => {
                // only error is 400 member not found
                context.patchState({
                    errorMessage: error.code,
                });

                return EMPTY;
            }),
        );
    }

    /**
     * If current request is not a duplicate, language(s) are fetched. If there are matching fields
     * that exist in the store, the entries are either replaced or the containing field is appended
     * with the new language. Maps the incoming elements in the response to the LanguageStateModel.
     *
     * @param context
     * @param action
     * @returns a LanguageModelResponse array
     */
    @Action(FetchLanguage)
    FetchLanguage(context: StateContext<LanguageStateModel>, action: FetchLanguage): Observable<LanguageModelResponse[]> | void {
        const matchingRequest: (request: LanguageRequest) => boolean = (request: LanguageRequest) =>
            this.compareFetchLanguageRequests(request, action);
        if (!context.getState().requests.find(matchingRequest)) {
            // add request to store
            context.patchState({
                requests: [
                    // ensure duplicate request is not added (corner case)
                    ...context
                        .getState()
                        .requests.filter((request: LanguageRequest) => !this.compareFetchLanguageRequests(request, action)),
                    {
                        tagName: action.tagName,
                        partnerId: action.partnerId,
                        vocabulary: action.vocabulary,
                        breakpointSize: action.breakpointSize,
                    },
                ],
            });
            return this.commonService
                .getLandingLanguages(
                    action.tagName,
                    action.vocabulary,
                    // TODO: Speak with contracts about authenticated language
                    // action.date,
                    // action.partnerId ? action.partnerId.toString() : undefined,
                    // action.breakpointSize
                )
                .pipe(
                    retry(RETRY_TIMES),
                    // process response data, check for matches, and update store accordingly
                    tap((languages: LanguageModel[]) => this.processResponse(context, action, languages)),
                    // remove request on error
                    catchError((error) => {
                        context.patchState({
                            requests: [...context.getState().requests.filter((request) => !matchingRequest(request))],
                        });
                        return of([]);
                    }),
                    first(),
                );
        }
    }
    /**
     * Load the language and put it into the store
     *
     * @param context our store
     * @param action LoadLanguage action
     * @returns returning the getLandingLanguages observable or nothing
     */
    @Action(LoadSecondaryLandingLanguage)
    LoadSecondaryLandingLanguage(context: StateContext<LanguageStateModel>, action: LoadLanguage): Observable<LanguageModel[] | any> {
        const vocabulary = Vocabulary.ENGLISH;
        return this.commonService.getLandingLanguages(action.key, vocabulary).pipe(
            tap((result: LanguageModel[]) => {
                context.patchState({
                    secondaryValues: result,
                });
            }),
            catchError((error) => {
                // only error is 400 member not found
                context.patchState({
                    errorMessage: error.code,
                });

                return EMPTY;
            }),
        );
    }
    /**
     * Set the API error object
     *
     * @param context language state context
     * @param action FetchErrorMessageLanguage action
     * @returns returning the getLandingLanguages observable or nothing
     */
    @Action(FetchErrorMessageLanguage)
    FetchErrorMessageLanguage(context: StateContext<LanguageStateModel>, action: FetchErrorMessageLanguage): Observable<string | any> {
        const state = context.getState();
        if (!action.displayMessage) {
            return this.commonService.getLandingLanguages(action.key, Vocabulary.ENGLISH).pipe(
                tap((result: LanguageModel[]) => {
                    context.setState({
                        ...state,
                        apiError: {
                            errorKey: action.key,
                            value: result[0].value,
                        },
                    });
                }),
            );
        }
        context.setState({
            ...state,
            apiError: {
                errorKey: action.key,
                value: action.displayMessage,
            },
        });
        return EMPTY;
    }
    /**
     * Reset the API error object in state
     * @param context language state context
     */
    @Action(ResetErrorMessageLanguage)
    ResetErrorMessageLanguage(context: StateContext<LanguageStateModel>): void {
        context.patchState({
            apiError: defaultApiErrorState,
        });
    }
    /**
     * Iterates through each LanguageModel object, mapping each to an updated ReducedLanguage object.
     * It then checks for any duplicate tagNames in the store. If there are any, it will update that
     * ReducedLanguage object's language property (metadata) by either overwriting an existing
     * LanguageMeta object in the array upon finding an exact match or appending to the array
     * otherwise. The store's languages property is then updated through replacement or appending
     * given the same conditions as previously stated.
     *
     * @param context Language State context
     * @param action http request data
     * @param languages array from http response
     */
    processResponse(context: StateContext<LanguageStateModel>, action: FetchLanguage, languages: LanguageModel[]): void {
        languages.forEach((language) => {
            // find matching tagName
            const matchingTagName: ReducedLanguage = context
                .getState()
                .languages.find((storeLanguage) => storeLanguage.tagName === language.tagName);

            // organize data into ReducedLanguage format
            const meta: LanguageMeta = this.createReducedLanguageMeta(language, action);
            const updatedReducedLanguage: ReducedLanguage = {
                tagName: language.tagName,
                languageMetas: [meta],
            };

            // update existing metadata array (by overwriting/appending an element) upon matching tagName
            if (matchingTagName) {
                updatedReducedLanguage.languageMetas.push(
                    ...matchingTagName.languageMetas.filter((storeMeta) => !this.compareLanguageMetas(meta, storeMeta)),
                );
            }

            // update store
            context.patchState({
                languages: [
                    ...context.getState().languages.filter((storeLanguage) => storeLanguage.tagName !== language.tagName),
                    updatedReducedLanguage,
                ],
            });
        });
    }

    /**
     * Combines request and response data into LanguageMeta object and returns it.
     *
     * @param language LanguageModel object from http response
     * @param action http request data
     * @returns abstracted metadata for reduced language object (all properties except tagName)
     */
    private createReducedLanguageMeta(language: LanguageModel, action: FetchLanguage): LanguageMeta {
        const tempBreakpointSize: BreakpointSizes = action.breakpointSize ? action.breakpointSize : language.breakpointSize;
        return {
            value: language.value,
            carrierId: language.carrierId,
            productId: language.productId,
            toneOfVoice: language.toneOfVoice,
            breakpointSize: tempBreakpointSize,
            partnerId: action.partnerId,
            vocabulary: action.vocabulary,
        } as LanguageMeta;
    }

    /**
     * Compares two LanguageMeta objects.
     *
     * @param responseMeta LanguageMeta object from http request & response
     * @param storeMeta LanguageMeta object already in store
     * @returns true if equal and false otherwise.
     */
    private compareLanguageMetas(responseMeta: LanguageMeta, storeMeta: LanguageMeta): boolean {
        return (
            responseMeta.carrierId === storeMeta.carrierId &&
            responseMeta.productId === storeMeta.productId &&
            responseMeta.toneOfVoice === storeMeta.toneOfVoice &&
            responseMeta.breakpointSize === storeMeta.breakpointSize &&
            responseMeta.partnerId === storeMeta.partnerId &&
            responseMeta.vocabulary === storeMeta.vocabulary
        );
    }

    /**
     * Compares two LanguageRequest objects.
     *
     * @param currentRequest current FetchLanguage request
     * @param storeRequest FetchLanguage request already in store
     * @returns true if equal and false otherwise.
     */
    private compareFetchLanguageRequests(currentRequest: LanguageRequest, storeRequest: LanguageRequest): boolean {
        return (
            currentRequest.tagName === storeRequest.tagName &&
            currentRequest.partnerId === storeRequest.partnerId &&
            currentRequest.vocabulary === storeRequest.vocabulary &&
            currentRequest.breakpointSize === storeRequest.breakpointSize
        );
    }

    /**
     * Fetches all reduced languages that have a matching vocabulary as the target value.
     *
     * @param response
     * @param targetVocabulary
     * @returns array of ReducedLanguage objects
     */
    fetchValueForVocabulary(response: ReducedLanguage[], targetVocabulary: string): ReducedLanguage[] {
        return response.filter((x) => x.languageMetas.find((meta) => meta.vocabulary === targetVocabulary));
    }

    /**
     * Generic reduction to fetch all reduced language models that have a matching id as the
     * target value based on the target parameter (partnerId, carrierId, productId). Appends
     * each matching element once a match is found. Otherwise, it appends each element with
     * a null value for the targeted id field.
     *
     * @param response language model response array
     * @param target specifies which field to compare in language meta object
     * @param id value with which to compare
     */
    fetchValueForId(
        response: ReducedLanguage[],
        target: LanguageMetaIdField,
        id: number,
    ): { hasExactMatch: boolean; values: ReducedLanguage[] } {
        return response.reduce(
            (accumulator, currentValue) => {
                if (currentValue.languageMetas.find((meta) => meta[target] === id)) {
                    if (accumulator.hasExactMatch) {
                        // If there is an exact match, and a match has already been found (which means
                        // the null values have already been dumped), then append current element.
                        return { hasExactMatch: true, values: [...accumulator.values, currentValue] };
                    }

                    // First matching element found. Empty values array to rid of null value elements.
                    return {
                        hasExactMatch: true,
                        values: [...accumulator.values, currentValue],
                    };
                }
                if (currentValue.languageMetas.find((meta) => meta[target] === null) && !accumulator.hasExactMatch) {
                    // If targeted id value of element is null and an exact match has not been found
                    // yet, then append current element.
                    return { hasExactMatch: false, values: [...accumulator.values, currentValue] };
                }

                // If target id field is not a match nor null, return unedited.
                return accumulator;
            },
            { hasExactMatch: false, values: [] },
        );
    }
}
