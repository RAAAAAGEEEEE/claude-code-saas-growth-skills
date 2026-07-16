/**
 * Calcule les taux de passage et d'abandon entre étapes d'un funnel.
 * Fonction pure, aucune dépendance réseau. Les comptages doivent être fournis
 * par l'appelant (export PostHog, requête HogQL, etc.) — rien n'est inventé ici.
 */

export interface FunnelStep {
  name: string;
  count: number;
}

export interface FunnelStepResult extends FunnelStep {
  conversionFromPrevious: number | null;
  dropoffFromPrevious: number | null;
}

export function computeFunnelDropoff(steps: FunnelStep[]): FunnelStepResult[] {
  if (steps.length === 0) {
    return [];
  }

  return steps.map((step, index) => {
    if (index === 0) {
      return { ...step, conversionFromPrevious: null, dropoffFromPrevious: null };
    }

    const previous = steps[index - 1];
    const conversionFromPrevious = previous.count === 0 ? 0 : step.count / previous.count;

    return {
      ...step,
      conversionFromPrevious,
      dropoffFromPrevious: 1 - conversionFromPrevious,
    };
  });
}

export function findWorstDropoffStep(results: FunnelStepResult[]): FunnelStepResult | null {
  const withDropoff = results.filter(
    (result): result is FunnelStepResult & { dropoffFromPrevious: number } =>
      result.dropoffFromPrevious !== null,
  );

  if (withDropoff.length === 0) {
    return null;
  }

  return withDropoff.reduce((worst, current) =>
    current.dropoffFromPrevious > worst.dropoffFromPrevious ? current : worst,
  );
}
