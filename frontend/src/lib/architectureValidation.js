import { evaluateRules } from '@/lib/architectureRules';

const getServiceType = (node) =>
  node?.serviceType || node?.data?.serviceType || node?.type;

const normalizeServiceType = (serviceType) =>
  typeof serviceType === 'string' ? serviceType.trim().toLowerCase() : '';

export function validateModuleArchitecture(
  module,
  nodes = [],
  connections = [],
  totalCost = 0
) {
  const buildActivity = module?.buildActivity;
  if (!buildActivity) {
    return {
      valid: false,
      missingServices: [],
      missingConnections: [],
      missingCounts: [],
      ruleResults: [],
      extraServices: [],
    };
  }

  const serviceTypes = nodes
    .map((node) => normalizeServiceType(getServiceType(node)))
    .filter(Boolean);
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  const connectionPairs = connections
    .map((connection) => ({
      source: normalizeServiceType(
        getServiceType(nodesById.get(connection.source))
      ),
      target: normalizeServiceType(
        getServiceType(nodesById.get(connection.target))
      ),
    }))
    .filter((pair) => pair.source && pair.target);

  const requiredServices = (buildActivity.requiredServices || []).map(
    normalizeServiceType
  );
  const requiredConnections = buildActivity.requiredConnections || [];
  const missingServices = [
    ...new Set(requiredServices.filter((service) => !serviceTypes.includes(service))),
  ];
  const missingConnections = requiredConnections.filter((required) => {
    const source = normalizeServiceType(required.source);
    const target = normalizeServiceType(required.target);
    return !connectionPairs.some(
      (pair) => pair.source === source && pair.target === target
    );
  });
  const missingCounts = Object.entries(buildActivity.minServiceCounts || {})
    .map(([service, required]) => ({
      service,
      required,
      found: serviceTypes.filter(
        (item) => item === normalizeServiceType(service)
      ).length,
    }))
    .filter((item) => item.found < item.required);
  const ruleResults = evaluateRules(buildActivity.rules || [], {
    serviceTypes,
    connectionPairs,
    totalCost,
    budget: buildActivity.monthlyBudgetUSD,
  });
  const requiredServiceSet = new Set(requiredServices);
  const optionalServices = new Set(
    (buildActivity.optionalServices || []).map(normalizeServiceType)
  );
  const extraServices = [
    ...new Set(
      serviceTypes.filter(
        (service) =>
          !requiredServiceSet.has(service) && !optionalServices.has(service)
      )
    ),
  ];

  return {
    valid:
      missingServices.length === 0 &&
      missingConnections.length === 0 &&
      missingCounts.length === 0 &&
      ruleResults.every((rule) => rule.passed),
    missingServices,
    missingConnections,
    missingCounts,
    ruleResults,
    extraServices: requiredServices.length > 0 ? extraServices : [],
  };
}
