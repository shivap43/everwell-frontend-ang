export interface CategoryAdminAssignment {
  categoryId: number;
  assignment: AdminAssignment;
}

export interface AdminAssignment {
  [adminID: string]: CategoryAdminType;
}

export type CategoryAdminType = "PRIMARY" | "STANDARD";
