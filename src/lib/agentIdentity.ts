import type { Agent } from '../data/agents';

const LEGACY_TO_CANONICAL_AGENT_ID: Record<string, string> = {
  ceo_jay: 'ceo-jay-command',
  xaugod: 'sales-max',
  housekeeper: 'warehouse-atlas',
  jing: 'support-luna',
  joe: 'marketing-nova',
  policy: 'logistics-orion',
  procurement_mira: 'procurement-mira',
  finance_vega: 'finance-vega',
  ecommerce_kai: 'ecommerce-kai',
  success_aria: 'success-aria',
};

export function canonicalAgentId(agentId: string): string {
  return LEGACY_TO_CANONICAL_AGENT_ID[agentId] ?? agentId;
}

export function isCeoAgent(agent: Agent): boolean {
  return agent.id === 'ceo-jay-command' || agent.sessionId === 'ceo-jay-command' || agent.authorityLevel === 'Owner';
}
