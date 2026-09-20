import React from 'react';
import {
  BrainCircuit,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  BarChart2,
  Terminal,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { MLHazardEvaluation } from '../types';

interface RiskEvaluationCardProps {
  mlEvaluation: MLHazardEvaluation;
  onOpenPythonModal: () => void;
}

export const RiskEvaluationCard: React.FC<RiskEvaluationCardProps> = ({
  mlEvaluation,
  onOpenPythonModal,
}) => {
  const {
    predictedDisaster,
    riskLevel,
    confidence,
    overallRiskScore,
    probabilities,
    triggerFactors,
    recommendedAction,
    rationale,
    featureImportance,
    inferenceTimeMs,
  } = mlEvaluation;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'HIGH':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'MODERATE':
        return 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const disasterClassLabels: { key: keyof typeof probabilities; label: string; color: string }[] = [
    { key: 'flashFlood', label: 'Flash Flood / Dam Surge', color: 'bg-cyan-500' },
    { key: 'thunderLightning', label: 'Thunder & Lightning', color: 'bg-amber-400' },
    { key: 'hurricane', label: 'Hurricane / Cyclone', color: 'bg-blue-500' },
    { key: 'landslide', label: 'Landslide / Slope Failure', color: 'bg-orange-500' },
    { key: 'wildfire', label: 'Industrial Fire / Hazmat', color: 'bg-rose-500' },
    { key: 'severeStorm', label: 'Severe Squall', color: 'bg-purple-500' },
    { key: 'normal', label: 'Normal Baseline', color: 'bg-emerald-500' },
  ];

  return (
    <div className="bg-[#0C0C0E] rounded-xl border border-slate-800 p-4 sm:p-5 shadow-2xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-red-950/40 text-red-400 border border-red-900/50 shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                ML Hazard Evaluation
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                SCIKIT BASELINE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Inferencing streaming telemetry against historical disaster baselines ({inferenceTimeMs}ms)
            </p>
          </div>
        </div>

        <button
          onClick={onOpenPythonModal}
          title="Inspect Code Dev List & ML Pipeline"
          className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors shrink-0"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono text-[11px]">Code Dev List</span>
        </button>
      </div>

      {/* Primary Classification Result Banner */}
      <div className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${getRiskColor(riskLevel)}`}>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold font-mono opacity-80 mb-0.5">
            Top Predicted Threat
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2 font-mono">
            <span>{predictedDisaster.replace(/_/g, ' ')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-[#09090B] border border-current text-inherit">
              {riskLevel} Threat
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4 sm:border-l sm:border-slate-800 sm:pl-4">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Confidence</div>
            <div className="text-lg font-bold text-white font-mono">{confidence}%</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Hazard Score</div>
            <div className="text-lg font-bold text-white font-mono">{overallRiskScore} / 100</div>
          </div>
        </div>
      </div>

      {/* Rationale & Action Plan */}
      <div className="space-y-2 text-xs">
        <div className="p-3 bg-[#09090B] rounded-lg border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 font-mono">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Classification Rationale:</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans text-xs">{rationale}</p>
        </div>

        <div className="p-3 bg-red-950/20 rounded-lg border border-red-900/50 space-y-1">
          <div className="text-[11px] font-bold text-red-400 flex items-center gap-1.5 font-mono">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Recommended Tactical Action:</span>
          </div>
          <p className="text-red-200/90 font-medium text-xs">{recommendedAction}</p>
        </div>
      </div>

      {/* Multi-Class Probability Distribution & Feature Weights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Probability Bars */}
        <div className="p-3.5 bg-[#09090B] rounded-lg border border-slate-800 space-y-2.5">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
              Multi-Class Probabilities
            </span>
            <span className="text-[10px] font-mono text-slate-400">Sum = 1.00</span>
          </div>

          <div className="space-y-2">
            {disasterClassLabels.map(({ key, label, color }) => {
              const prob = probabilities[key] || 0;
              const pct = Math.round(prob * 100);
              return (
                <div key={key} className="space-y-0.5">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span className="text-[11px] text-slate-400">{label}</span>
                    <span className="font-mono text-slate-300 font-medium">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trigger Factors & Feature Importance */}
        <div className="p-3.5 bg-[#09090B] rounded-lg border border-slate-800 space-y-2.5">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono text-[11px]">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Key Anomaly Factors</span>
          </div>

          <div className="space-y-1.5">
            {triggerFactors.map((factor, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-2 text-[11px] text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span className="leading-tight">{factor}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span className="text-slate-400">Feature Weights:</span>
              <span className="text-slate-400">Rain {featureImportance.rainfall}% • River {featureImportance.riverLevel}% • Wind {featureImportance.windSpeed}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
