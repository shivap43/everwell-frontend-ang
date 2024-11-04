export enum CoverageLevelNames {
    INDIVIDUAL_COVERAGE = "Individual",
    ONE_PARENT_FAMILY_COVERAGE = "One Parent Family",
    TWO_PARENT_FAMILY_COVERAGE = "Two Parent Family",
    NAME_INSURED_SPOUSE_ONLY_COVERAGE = "Named Insured / Spouse Only",
    EMPLOYEE_SPOUSE_CHILDREN_COVERAGE = "Employee + Spouse & Children",
    EMPLOYEE_SPOUSE_COVERAGE = "Employee + Spouse",
    EMPLOYEE_CHILDREN_COVERAGE = "Employee + Child(ren)",
    ENROLLED_COVERAGE = "Enrolled",
    EMPLOYEE = "Employee",
    MEMBER_ONLY = "Member only",
    MEMBER_PLUS_ONE = "Member + 1",
    FAMILY = "Family",
    DECLINED = "Declined",
    EMPLOYEE_ONLY = "Employee Only",
    EMPLOYEE_PLUS_CHILDREN = "Employee + Children",
    EMPLOYEE_PLUS_FAMILY = "Employee + Family",

    // These alt versions of the coverage level names swap out the '+' for 'and'
    // This is needed since the backend will sometimes send coverage level names with a '+' but other times it'll send 'and'
    EMPLOYEE_SPOUSE_CHILDREN_COVERAGE_ALT = "Employee and Spouse & Children",
    EMPLOYEE_SPOUSE_COVERAGE_ALT = "Employee and Spouse",
    EMPLOYEE_CHILDREN_COVERAGE_ALT = "Employee and Child(ren)",
    MEMBER_PLUS_ONE_ALT = "Member and 1",
    EMPLOYEE_PLUS_CHILDREN_ALT = "Employee and Children",
    EMPLOYEE_PLUS_FAMILY_ALT = "Employee and Family",
}
