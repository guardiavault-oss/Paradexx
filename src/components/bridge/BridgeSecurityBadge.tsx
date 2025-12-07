/**
 * Bridge Security Badge Component
 * Displays security score and risk level for bridges
 */

import React from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export interface BridgeSecurityBadgeProps {
  score: number | null;
  riskLevel?: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

export const BridgeSecurityBadge: React.FC<BridgeSecurityBadgeProps> = ({
  score,
  riskLevel,
  size = 'medium',
  showLabel = true,
  className = '',
}) => {
  if (score === null) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 rounded-full bg-gray-400 animate-pulse" />
        {showLabel && <span className="text-sm text-gray-500">Analyzing...</span>}
      </div>
    );
  }

  const getRiskColor = (level?: string, score?: number) => {
    if (level === 'CRITICAL' || (score !== null && score < 4)) {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    if (level === 'HIGH' || (score !== null && score < 6)) {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    }
    if (level === 'MEDIUM' || (score !== null && score < 7)) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
    if (level === 'LOW' || (score !== null && score < 8)) {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    }
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskIcon = (level?: string, score?: number) => {
    if (level === 'CRITICAL' || (score !== null && score < 4)) {
      return <XCircle className="w-4 h-4" />;
    }
    if (level === 'HIGH' || (score !== null && score < 6)) {
      return <AlertTriangle className="w-4 h-4" />;
    }
    if (level === 'MEDIUM' || (score !== null && score < 7)) {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <CheckCircle className="w-4 h-4" />;
  };

  const getRiskLabel = (level?: string, score?: number) => {
    if (level === 'CRITICAL' || (score !== null && score < 4)) {
      return 'Critical Risk';
    }
    if (level === 'HIGH' || (score !== null && score < 6)) {
      return 'High Risk';
    }
    if (level === 'MEDIUM' || (score !== null && score < 7)) {
      return 'Medium Risk';
    }
    if (level === 'LOW' || (score !== null && score < 8)) {
      return 'Low Risk';
    }
    return 'Safe';
  };

  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    medium: 'text-sm px-3 py-1.5',
    large: 'text-base px-4 py-2',
  };

  const colorClasses = getRiskColor(riskLevel, score);
  const icon = getRiskIcon(riskLevel, score);
  const label = getRiskLabel(riskLevel, score);

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border ${colorClasses} ${sizeClasses[size]} ${className}`}>
      <Shield className="w-4 h-4" />
      <span className="font-semibold">{score.toFixed(1)}/10</span>
      {showLabel && (
        <>
          <span className="mx-1">•</span>
          <span>{label}</span>
        </>
      )}
      {icon}
    </div>
  );
};

export default BridgeSecurityBadge;

