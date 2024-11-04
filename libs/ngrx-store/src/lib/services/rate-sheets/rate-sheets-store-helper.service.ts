/* eslint-disable @typescript-eslint/indent */
import { CombinedPlanAndPlanSeries, Plan, PlanSeries, PlanSeriesCategory } from "@empowered/constants";

/**
 * Groups plan data by product and then by plan series for display on the rate sheets page.
 *
 * @param productDetails Dental(ADV) product data
 * @param currentPlan current plan from plans
 * @param allPlanSeries array of plan series
 * @returns Dental(ADV) product data
 */
function updatePlanSeriesForADV(
    productDetails: CombinedPlanAndPlanSeries,
    currentPlan: Plan,
    allPlanSeries: PlanSeries[],
): CombinedPlanAndPlanSeries {
    if (currentPlan.planSeriesCategory === PlanSeriesCategory.MAC) {
        return {
            ...productDetails,
            planSeries: productDetails.planSeries.map((planSeries) =>
                planSeries.id === currentPlan.planSeriesId ? { ...planSeries, plans: [...planSeries.plans, currentPlan] } : planSeries,
            ),
        } as CombinedPlanAndPlanSeries;
    }

    if (currentPlan.planSeriesCategory === PlanSeriesCategory.PPO) {
        if (productDetails.planSeries.find((planSeries) => planSeries.name.includes(PlanSeriesCategory.PPO))) {
            return {
                ...productDetails,
                planSeries: productDetails.planSeries.map((planSeries) =>
                    planSeries.name.includes(PlanSeriesCategory.PPO)
                        ? { ...planSeries, plans: [...planSeries.plans, currentPlan] }
                        : planSeries,
                ),
            } as CombinedPlanAndPlanSeries;
        }
        return {
            ...productDetails,
            planSeries: [
                ...productDetails.planSeries,
                {
                    ...allPlanSeries.find((planSeries) => planSeries.id === currentPlan.planSeriesId),
                    name: "Aflac Dental Insurance (Group) - PPO",
                    categories: currentPlan.planSeriesCategory,
                    plans: [currentPlan],
                },
            ],
        } as CombinedPlanAndPlanSeries;
    }
    return {
        ...productDetails,
        planSeries: productDetails.planSeries.map((planSeries) =>
            planSeries.id === currentPlan.planSeriesId ? { ...planSeries, plans: [...planSeries.plans, currentPlan] } : planSeries,
        ),
    } as CombinedPlanAndPlanSeries;
}

/**
 * Groups plan data by product and then by plan series for display on the rate sheets page.
 *
 * @param allPlanSeries array of plan series
 * @param quickQuotePlans array of available quick quote plans
 * @returns grouped product data
 */
export function getCombinedPlanSeriesDetails(allPlanSeries: PlanSeries[], quickQuotePlans: Plan[]): CombinedPlanAndPlanSeries[] {
    return quickQuotePlans.reduce<CombinedPlanAndPlanSeries[]>((accumulator, currentPlan) => {
        const product = accumulator.find((e) => e.product?.id === currentPlan.product?.id);

        // product does not exist
        if (!product) {
            return [
                ...accumulator,
                {
                    product: { id: currentPlan.product?.id, name: currentPlan.product?.name },
                    planSeries: [
                        { ...allPlanSeries.find((planSeries) => planSeries.id === currentPlan.planSeriesId), plans: [currentPlan] },
                    ],
                } as CombinedPlanAndPlanSeries,
            ];
        }

        // product exists
        const foundPlanSeries = product.planSeries.find((planSeries) => planSeries.id === currentPlan.planSeriesId);

        // no plan series
        if (!foundPlanSeries) {
            return accumulator.map((ac) => {
                if (currentPlan.product?.id === 13 && ac.product?.id === 13 && currentPlan.planSeriesCategory === PlanSeriesCategory.MAC) {
                    return {
                        ...ac,
                        planSeries: [
                            ...ac.planSeries,
                            {
                                ...allPlanSeries.find((planSeries) => planSeries.id === currentPlan.planSeriesId),
                                // TODO: Use language for below
                                name: "Aflac Dental Insurance (Group) - MAC",
                                categories: currentPlan.planSeriesCategory,
                                plans: [currentPlan],
                            },
                        ],
                    } as CombinedPlanAndPlanSeries;
                }
                return ac.product.id === currentPlan.product?.id
                    ? ({
                          ...ac,
                          planSeries: [
                              ...ac.planSeries,
                              { ...allPlanSeries.find((planSeries) => planSeries.id === currentPlan.planSeriesId), plans: [currentPlan] },
                          ],
                      } as CombinedPlanAndPlanSeries)
                    : ac;
            });
        }

        // plan series exists
        return accumulator.map((productDetails) => {
            if (
                productDetails.product.id === currentPlan.product?.id &&
                currentPlan.product?.id === 13 &&
                currentPlan.planSeriesCategory &&
                productDetails.product?.id === 13
            ) {
                return updatePlanSeriesForADV(productDetails, currentPlan, allPlanSeries);
            }
            return productDetails.product.id === currentPlan.product?.id
                ? ({
                      ...productDetails,
                      planSeries: productDetails.planSeries.map((planSeries) =>
                          planSeries.id === currentPlan.planSeriesId
                              ? { ...planSeries, plans: [...planSeries.plans, currentPlan] }
                              : planSeries,
                      ),
                  } as CombinedPlanAndPlanSeries)
                : productDetails;
        });
    }, []);
}
