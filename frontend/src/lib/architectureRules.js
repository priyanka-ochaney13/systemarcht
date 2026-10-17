const countOf = (types, service) =>
  types.filter((type) => type === service).length;

const runCheck = (check, context) => {
  switch (check.type) {
    case 'hasService':
      return check.services.every(
        (service) => countOf(context.serviceTypes, service) > 0
      );

    case 'minCount':
      return countOf(context.serviceTypes, check.service) >= check.count;

    case 'hasConnection':
      return context.connectionPairs.some(
        (pair) =>
          pair.source === check.source && pair.target === check.target
      );

    case 'maxCost':
      return (
        context.totalCost > 0 &&
        typeof context.budget === 'number' &&
        context.totalCost <= context.budget
      );

    case 'allOf':
      return check.checks.every((item) => runCheck(item, context));

    case 'anyOf':
      return check.checks.some((item) => runCheck(item, context));

    default:
      return false;
  }
};

const describeRule = (rule, context) => {
  if (rule.check.type !== 'maxCost') return null;

  if (!(context.totalCost > 0)) {
    return 'Calculate the cost of your services first';
  }

  return `$${context.totalCost.toFixed(2)} against a budget of $${context.budget}`;
};

export const evaluateRules = (rules, context) =>
  rules.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: runCheck(rule.check, context),
    detail: describeRule(rule, context),
  }));