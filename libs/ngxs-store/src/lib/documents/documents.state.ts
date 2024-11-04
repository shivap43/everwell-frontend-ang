import { DocumentsStateModel, RequestStatusType } from "./documents.model";
import { State, Action, StateContext, Store, Selector } from "@ngxs/store";
import { DocumentApiService } from "@empowered/api";
import { Document } from "@empowered/constants";
import { GetDocuments } from "./documents.action";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { ResetRequestStatus } from "../shared/shared.actions";
import { Injectable } from "@angular/core";
import { ResetState } from "@empowered/user/state/actions";

const defaultState: DocumentsStateModel = {
    documents: [],
    requestStatus: RequestStatusType.ZERO_STATE,
};

@State<DocumentsStateModel>({
    name: "documents",
    defaults: defaultState,
})
@Injectable()
export class DocumentsState {
    constructor(private documentApiService: DocumentApiService, private store: Store) {}

    @Selector()
    static documents(state: DocumentsStateModel): Document[] {
        return state.documents;
    }

    @Selector()
    static requestStatus(state: DocumentsStateModel): RequestStatusType {
        return state.requestStatus;
    }

    @Action(ResetState)
    resetState(context: StateContext<DocumentsStateModel>): void {
        context.setState(defaultState);
    }

    /**
     * Method to reset the requestStatus state
     * @param context document state object
     */
    @Action(ResetRequestStatus)
    ResetRequestStatus(context: StateContext<DocumentsStateModel>): void {
        context.patchState({
            requestStatus: defaultState.requestStatus,
        });
    }

    /**
     * get documents
     * @param ctx document state model context
     * @param1 isDirect indicates whether this is for direct group or not
     * @returns observable of a list of documents
     */
    @Action(GetDocuments)
    getDocuments(ctx: StateContext<DocumentsStateModel>, { isDirect }: GetDocuments): Observable<Document[]> | undefined {
        const currentStatus = ctx.getState().requestStatus;
        if (currentStatus !== RequestStatusType.REQUESTING) {
            ctx.setState({ documents: ctx.getState().documents, requestStatus: RequestStatusType.REQUESTING });
            return this.documentApiService.getDocuments(isDirect ? undefined : "uploadAdminId").pipe(
                tap(
                    (documents) => {
                        ctx.setState({ documents: documents, requestStatus: RequestStatusType.COMPLETED });
                    },
                    () => {
                        ctx.setState({ documents: ctx.getState().documents, requestStatus: RequestStatusType.ERROR });
                    },
                ),
            );
        }
        return undefined;
    }
}
