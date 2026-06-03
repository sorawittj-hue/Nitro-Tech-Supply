import type { AgentRunBusinessAction, AgentRunRecord } from '../context/AppContext';
import type { Agent } from '../data/agents';

interface AgentRunsViewProps {
  runs: AgentRunRecord[];
  agents: Agent[];
  onRefresh: () => void;
}

const statusLabels: Record<AgentRunRecord['status'], string> = {
  accepted: 'ACCEPTED',
  forwarded: 'FORWARDED',
  not_forwardable: 'LOCAL ONLY',
  not_configured: 'NOT CONFIGURED',
  forward_failed: 'FORWARD FAILED',
  failed: 'FAILED',
};

export function AgentRunsView({ runs, agents, onRefresh }: AgentRunsViewProps) {
  const latestRuns = [...runs].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  const agentById = new Map(agents.map(agent => [agent.id, agent]));
  const forwardedCount = runs.filter(run => run.status === 'forwarded').length;
  const failedCount = runs.filter(run => run.status === 'failed' || run.status === 'forward_failed').length;
  const pendingCount = runs.filter(run => run.status === 'accepted').length;

  return (
    <div className="agent-runs-view">
      <div className="agent-runs-summary">
        <RunMetric label="Total Runs" value={runs.length.toLocaleString('th-TH')} />
        <RunMetric label="Forwarded" value={forwardedCount.toLocaleString('th-TH')} tone="success" />
        <RunMetric label="Pending" value={pendingCount.toLocaleString('th-TH')} tone="warning" />
        <RunMetric label="Failed" value={failedCount.toLocaleString('th-TH')} tone="danger" />
        <button type="button" className="btn btn-ghost" onClick={onRefresh}>Refresh Evidence</button>
      </div>

      <div className="agent-runs-list">
        {latestRuns.length === 0 ? (
          <div className="agent-run-empty">
            No Hermes command runs have been recorded yet.
          </div>
        ) : latestRuns.map(run => {
          const agent = run.agentId ? agentById.get(run.agentId) : undefined;
          return (
            <article key={run.id} className="agent-run-card">
              <header className="agent-run-header">
                <div>
                  <div className="agent-run-title">{run.title || run.commandType}</div>
                  <div className="agent-run-meta">
                    {agent ? `${agent.avatar} ${agent.name}` : run.agentId || 'System'} / {run.commandType} / {formatDateTime(run.updatedAt)}
                  </div>
                </div>
                <span className={`agent-run-status ${statusTone(run.status)}`}>{statusLabels[run.status]}</span>
              </header>

              <div className="agent-run-detail">{run.detail || 'No command detail recorded.'}</div>

              {run.result ? (
                <section className="agent-run-block">
                  <span>Hermes Result</span>
                  <p>{run.result}</p>
                </section>
              ) : null}

              {run.errorMessage ? (
                <section className="agent-run-block error">
                  <span>Error</span>
                  <p>{run.errorMessage}</p>
                </section>
              ) : null}

              {run.businessActions && run.businessActions.length > 0 ? (
                <section className="agent-run-actions">
                  <span>Business Actions</span>
                  <div>
                    {run.businessActions.map(action => (
                      <div key={`${run.id}-${action.type}-${action.id}`} className={`agent-run-action ${action.status}`}>
                        <strong>{action.status.toUpperCase()}</strong>
                        <p>{formatActionType(action.type)}/{action.id}</p>
                        <small>{action.detail}</small>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="agent-run-evidence">
                <span>Evidence</span>
                {run.evidence && run.evidence.length > 0 ? (
                  <ul>
                    {run.evidence.map(item => <li key={`${run.id}-${item}`}>{item}</li>)}
                  </ul>
                ) : (
                  <p>No evidence captured yet.</p>
                )}
              </section>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function RunMetric({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return (
    <div className={`agent-run-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function statusTone(status: AgentRunRecord['status']): string {
  if (status === 'forwarded') return 'success';
  if (status === 'accepted') return 'warning';
  if (status === 'not_forwardable') return 'neutral';
  return 'danger';
}

function formatActionType(type: AgentRunBusinessAction['type']): string {
  if (type === 'purchase_order') return 'purchase_order';
  if (type === 'quote') return 'quote';
  return 'agent_task';
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
