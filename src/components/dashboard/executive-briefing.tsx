'use client';

interface ExecutiveBriefingProps {
  highestRiskTask?: {
    title: string;
    riskScore: number;
  };
  activeCommitments: number;
  recommendedActions: string[];
}

export function ExecutiveBriefing({
  highestRiskTask,
  activeCommitments,
  recommendedActions,
}: ExecutiveBriefingProps) {
  const greeting = getGreeting();

  return (
    <div className="card mb-8 bg-gradient-to-r from-card to-surface border border-surface">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">{greeting}</h2>
          <p className="text-muted">
            You have <span className="text-primary font-semibold">{activeCommitments}</span> active
            commitments today.
          </p>
        </div>
        <div className="text-4xl">🎯</div>
      </div>

      {highestRiskTask && (
        <div className="mb-6 p-4 bg-background rounded-lg border border-danger/20">
          <p className="text-sm text-muted mb-2">Highest Risk:</p>
          <p className="text-lg font-semibold text-danger mb-2">{highestRiskTask.title}</p>
          <div className="flex items-center justify-between">
            <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-danger transition-all"
                style={{ width: `${highestRiskTask.riskScore}%` }}
              />
            </div>
            <span className="ml-4 text-sm font-semibold text-danger">
              {highestRiskTask.riskScore}%
            </span>
          </div>
        </div>
      )}

      {recommendedActions.length > 0 && (
        <div>
          <p className="text-sm text-muted mb-3">Recommended Actions:</p>
          <ul className="space-y-2">
            {recommendedActions.slice(0, 3).map((action, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <span className="text-sm text-text">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}
