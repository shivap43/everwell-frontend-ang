import { HttpResponse } from "@angular/common/http";
import { EnrollmentMethodDetail } from "@empowered/api";
import { AsyncData, EnrollmentRider, EnrollmentDependent, EnrollmentBeneficiary, Enrollments } from "@empowered/constants";
import { createEntityAdapter, EntityAdapter, EntityState } from "@ngrx/entity";

import { getEntityId } from "../../ngrx.store.helpers";
import {
    EnrollmentBeneficiariesEntity,
    EnrollmentBeneficiariesIdentifiers,
    EnrolledDependentEntity,
    EnrollmentDependentIdentifiers,
    EnrollmentMethodDetailsEntity,
    EnrollmentMethodDetailsIdentifiers,
    EnrollmentsEntity,
    EnrollmentsIdentifiers,
    EnrollmentRidersEntity,
    EnrollmentRidersIdentifiers,
    ImportPolicyEntity,
    ImportPolicyIdentifiers,
    DownloadPreliminaryFormIdentifiers,
    DownloadPreliminaryFormEntity,
    EmailPreliminaryFormEntity,
    EmailPreliminaryFormIdentifiers,
} from "./enrollments.model";

// #region Enrollments State
export const getEnrollmentsEntityId = ({ mpGroup, memberId }: EnrollmentsIdentifiers) => getEntityId(mpGroup, memberId);

export const enrollmentsEntityAdapter: EntityAdapter<EnrollmentsEntity<AsyncData<Enrollments[]>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getEnrollmentsEntityId(identifiers),
});

export type EnrollmentsEntities = EntityState<EnrollmentsEntity<AsyncData<Enrollments[]>>>;
// #endregion

// #region Enrollment Riders State
export const getEnrollmentRidersEntityId = ({ mpGroup, memberId, enrollmentId }: EnrollmentRidersIdentifiers) =>
    getEntityId(mpGroup, memberId, enrollmentId);

export const enrollmentRidersEntityAdapter: EntityAdapter<EnrollmentRidersEntity<AsyncData<EnrollmentRider[]>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getEnrollmentRidersEntityId(identifiers),
});

export type EnrollmentRidersEntities = EntityState<EnrollmentRidersEntity<AsyncData<EnrollmentRider[]>>>;
// #endregion

// #region EnrollmentMethodDetails State
export const getEnrollmentMethodDetailsEntityId = ({ mpGroup }: EnrollmentMethodDetailsIdentifiers) => mpGroup;

export const enrollmentMethodDetailsEntityAdapter: EntityAdapter<EnrollmentMethodDetailsEntity<AsyncData<EnrollmentMethodDetail[]>>> =
    createEntityAdapter({
        selectId: ({ identifiers }) => getEnrollmentMethodDetailsEntityId(identifiers),
    });

export type EnrollmentMethodDetailsEntities = EntityState<EnrollmentMethodDetailsEntity<AsyncData<EnrollmentMethodDetail[]>>>;

// For Beneficiary data of Existing Coverage
export const getEnrollmentBeneficiariesEntityId = ({ memberId, enrollmentId, mpGroup }: EnrollmentBeneficiariesIdentifiers) =>
    getEntityId(memberId, enrollmentId, mpGroup);

export const enrollmentBeneficiariesEntityAdapter = createEntityAdapter<EnrollmentBeneficiariesEntity<AsyncData<EnrollmentBeneficiary[]>>>({
    selectId: ({ identifiers }) => getEnrollmentBeneficiariesEntityId(identifiers),
});

export type EnrollmentBeneficiariesState = EntityState<EnrollmentBeneficiariesEntity<AsyncData<EnrollmentBeneficiary[]>>>;

// For Dependent data of Existing Coverage
export const getEnrollmentDependentsEntityId = ({ memberId, enrollmentId, mpGroup }: EnrollmentDependentIdentifiers) =>
    getEntityId(memberId, enrollmentId, mpGroup);

export const enrollmentDependentsEntityAdapter = createEntityAdapter<EnrolledDependentEntity<AsyncData<EnrollmentDependent[]>>>({
    selectId: ({ identifiers }) => getEnrollmentDependentsEntityId(identifiers),
});
export type EnrollmentDependentsEntities = EntityState<EnrolledDependentEntity<AsyncData<EnrollmentDependent[]>>>;
// #endregion

// #region For import aflac policies
export const getImportPolicyEntityId = ({ memberId, mpGroup }: ImportPolicyIdentifiers) => getEntityId(memberId, mpGroup);

export const importPolicyEntityAdapter = createEntityAdapter<ImportPolicyEntity<AsyncData<string | null>>>({
    selectId: ({ identifiers }) => getImportPolicyEntityId(identifiers),
});

export type ImportPolicyEntities = EntityState<ImportPolicyEntity<AsyncData<string | null>>>;
// #endregion

// #region for download preliminary form
export const getDownloadPreliminaryFormEntityId = ({
    memberId,
    preliminaryFormPath,
    cartItemId,
    mpGroupId,
}: DownloadPreliminaryFormIdentifiers) => getEntityId(memberId, preliminaryFormPath, cartItemId, mpGroupId);

export const downloadPreliminaryFormEntityAdapter: EntityAdapter<DownloadPreliminaryFormEntity<AsyncData<string>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getDownloadPreliminaryFormEntityId(identifiers),
});

export type DownloadPreliminaryFormEntities = EntityState<DownloadPreliminaryFormEntity<AsyncData<string>>>;
// #endregion

// #region for email preliminary form
export const getEmailPreliminaryFormEntityId = ({ memberId, email, mpGroupId }: EmailPreliminaryFormIdentifiers) =>
    getEntityId(memberId, email, mpGroupId);

export const emailPreliminaryFormEntityAdapter: EntityAdapter<EmailPreliminaryFormEntity<AsyncData<HttpResponse<unknown>>>> =
    createEntityAdapter({
        selectId: ({ identifiers }) => getEmailPreliminaryFormEntityId(identifiers),
    });

export type EmailPreliminaryFormEntities = EntityState<EmailPreliminaryFormEntity<AsyncData<HttpResponse<unknown>>>>;
// #endregion

export interface State {
    // selected Enrollment id
    selectedEnrollmentId?: number | null;
    enrollmentsEntities: EnrollmentsEntities;
    enrollmentRidersEntities: EnrollmentRidersEntities;
    enrollmentMethodDetailsEntities: EnrollmentMethodDetailsEntities;
    enrollmentBeneficiariesEntities: EnrollmentBeneficiariesState;
    enrollmentDependentsEntities: EnrollmentDependentsEntities;
    importPolicyEntities: ImportPolicyEntities;
    downloadPreliminaryFormEntities: DownloadPreliminaryFormEntities;
    emailPreliminaryFormEntities: EmailPreliminaryFormEntities;
}

export const initialState: State = {
    enrollmentsEntities: enrollmentsEntityAdapter.getInitialState({}),
    enrollmentRidersEntities: enrollmentRidersEntityAdapter.getInitialState({}),
    enrollmentMethodDetailsEntities: enrollmentMethodDetailsEntityAdapter.getInitialState({}),
    enrollmentBeneficiariesEntities: enrollmentBeneficiariesEntityAdapter.getInitialState({}),
    enrollmentDependentsEntities: enrollmentDependentsEntityAdapter.getInitialState({}),
    importPolicyEntities: importPolicyEntityAdapter.getInitialState({}),
    downloadPreliminaryFormEntities: downloadPreliminaryFormEntityAdapter.getInitialState({}),
    emailPreliminaryFormEntities: emailPreliminaryFormEntityAdapter.getInitialState({}),
};
