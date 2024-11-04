import { AflacAlwaysEnrollments, AsyncData } from "@empowered/constants";
import { AflacAlwaysEnrollmentsEntity, AflacAlwaysEnrollmentsUserSelection, AflacAlwaysEnrollmentsIdentifiers } from "./aflac-always.model";
import { EntityState, createEntityAdapter } from "@ngrx/entity";

export const getAflacAlwaysEnrollmentsEntityId = ({ mpGroupId, memberId }: AflacAlwaysEnrollmentsIdentifiers) => `${memberId}-${mpGroupId}`;

export const aflacAlwaysEnrollmentsEntityAdapter = createEntityAdapter<AflacAlwaysEnrollmentsEntity<AsyncData<AflacAlwaysEnrollments[]>>>({
    selectId: ({ identifiers }) => getAflacAlwaysEnrollmentsEntityId(identifiers),
});

export type AflacAlwaysEntityState = EntityState<AflacAlwaysEnrollmentsEntity<AsyncData<AflacAlwaysEnrollments[]>>>;

export interface State {
    aflacAlwaysEnrollmentsEntities: AflacAlwaysEntityState;
    aflacAlwaysEnrollmentsUserSelection: AflacAlwaysEnrollmentsUserSelection;
    cumulativeTotalCost: number;
}

export const initialState: State = {
    aflacAlwaysEnrollmentsEntities: aflacAlwaysEnrollmentsEntityAdapter.getInitialState({}),
    aflacAlwaysEnrollmentsUserSelection: { enrollmentIds: [] },
    cumulativeTotalCost: 0,
};
