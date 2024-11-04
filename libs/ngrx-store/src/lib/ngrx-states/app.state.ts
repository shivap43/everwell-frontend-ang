import { SharedState } from "./shared";
import { SHARED_FEATURE_KEY } from "./shared/shared.reducer";
import { AuthState } from "./auth";
import { AUTH_FEATURE_KEY } from "./auth/auth.reducer";
import { AccountsState } from "./accounts";
import { ACCOUNTS_FEATURE_KEY } from "./accounts/accounts.reducer";
import { ProductsState } from "./products";
import { PRODUCTS_FEATURE_KEY } from "./products/products.reducer";
import { MembersState } from "./members";
import { MEMBERS_FEATURE_KEY } from "./members/members.reducer";
import { EnrollmentsState } from "./enrollments";
import { ENROLLMENTS_FEATURE_KEY } from "./enrollments/enrollments.reducer";
import { ProducersState } from "./producers";
import { PRODUCERS_FEATURE_KEY } from "./producers/producers.reducer";
import { PlanOfferingsState } from "./plan-offerings";
import { PLAN_OFFERINGS_FEATURE_KEY } from "./plan-offerings/plan-offerings.reducer";
import { ProductOfferingsState } from "./product-offerings";
import { PRODUCT_OFFERINGS_FEATURE_KEY } from "./product-offerings/product-offerings.reducer";
import { ShoppingCartsState } from "./shopping-carts";
import { SHOPPING_CARTS_FEATURE_KEY } from "./shopping-carts/shopping-carts.reducer";
import { RATE_SHEETS_FEATURE_KEY } from "./rate-sheets/rate-sheets.reducer";
import { RateSheetsState } from "./rate-sheets";
import { AflacAlwaysState } from "./aflac-always";
import { AFLAC_ALWAYS_FEATURE_KEY } from "./aflac-always/aflac-always.reducer";

export interface State {
    [SHARED_FEATURE_KEY]: SharedState.State;
    [AUTH_FEATURE_KEY]: AuthState.State;
    [ACCOUNTS_FEATURE_KEY]: AccountsState.State;
    [PRODUCTS_FEATURE_KEY]: ProductsState.State;
    [MEMBERS_FEATURE_KEY]: MembersState.State;
    [ENROLLMENTS_FEATURE_KEY]: EnrollmentsState.State;
    [PRODUCERS_FEATURE_KEY]: ProducersState.State;
    [PLAN_OFFERINGS_FEATURE_KEY]: PlanOfferingsState.State;
    [PRODUCT_OFFERINGS_FEATURE_KEY]: ProductOfferingsState.State;
    [SHOPPING_CARTS_FEATURE_KEY]: ShoppingCartsState.State;
    [RATE_SHEETS_FEATURE_KEY]: RateSheetsState.State;
    [AFLAC_ALWAYS_FEATURE_KEY]: AflacAlwaysState.State;
}
