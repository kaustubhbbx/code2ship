'use client';

import { RiskScore, Task } from '@/types';

interface RiskOverviewProps {
  tasks: Task[];
  riskScores: Record<string, RiskScore>;
}

export function RiskOverview({ tasks, riskScores }: RiskOverviewProps) {
  const highRiskTasks = tasks.filter((t) => riskScores[t.id]?.risk_level === 'high');
  const mediumRiskTasks = tasks.filter((t) => riskScores[t.id]?.risk_level === 'medium');
  const lowRiskTasks = tasks.filter((t) => riskScores[t.id]?.risk_level === 'low');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* High Risk */}
      <div className="card border-l-4 border-l-danger">
        <h3 className="text-lg font-semibold text-danger mb-4">High Risk</h3>
        <div className="space-y-3">
          {highRiskTasks.length === 0 ? (
            <p className="text-muted text-sm">No high-risk tasks</p>
          ) : (
            highRiskTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="p-3 bg-danger/5 rounded-lg">
                <p className="font-medium text-text text-sm truncate">{task.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted">
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-semibold text-danger">
                    {riskScores[task.id]?.score}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-surface">
          <span className="text-sm font-semibold text-danger">{highRiskTasks.length} tasks</span>
        </div>
      </div>

      {/* Medium Risk */}
      <div className="card border-l-4 border-l-warning">
        <h3 className="text-lg font-semibold text-warning mb-4">Medium Risk</h3>
        <div className="space-y-3">
          {mediumRiskTasks.length === 0 ? (
            <p className="text-muted text-sm">No medium-risk tasks</p>
          ) : (
            mediumRiskTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="p-3 bg-warning/5 rounded-lg">
                <p className="font-medium text-text text-sm truncate">{task.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted">
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-semibold text-warning">
                    {riskScores[task.id]?.score}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-surface">
          <span className="text-sm font-semibold text-warning">{mediumRiskTasks.length} tasks</span>
        </div>
      </div>

      {/* Low Risk */}
      <div className="card border-l-4 border-l-success">
        <h3 className="text-lg font-semibold text-success mb-4">Low Risk</h3>
        <div className="space-y-3">
          {lowRiskTasks.length === 0 ? (
            <p className="text-muted text-sm">No low-risk tasks</p>
          ) : (
            lowRiskTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="p-3 bg-success/5 rounded-lg">
                <p className="font-medium text-text text-sm truncate">{task.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted">
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-semibold text-success">
                    {riskScores[task.id]?.score}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-surface">
          <span className="text-sm font-semibold text-success">{lowRiskTasks.length} tasks</span>
        </div>
      </div>
    </div>
  );
}
