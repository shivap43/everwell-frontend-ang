/**
 * Structure for instances to be stored in NGRX EntityState.
 * Used for manage identifiers used to generate NGRX Entity id. Commonly used with EntityAdaptor.
 *
 * Identifiers is a Dictionary used to generate Entity ids.
 *
 * Data is the expected entity type. This is the type for any instance found in the EntityState.
 */
export interface Entity<Identifiers, Data> {
    identifiers: Identifiers;
    data: Data;
}
