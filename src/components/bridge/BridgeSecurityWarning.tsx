/**
 * Bridge Security Warning Component
 * Displays security warnings and recommendations for bridges
 */

import React, { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { BridgeSecurityBadge } from './BridgeSecurityBadge';
import { useBridgeSecurityScore } from '../../hooks/useBridgeSecurity';

export interface BridgeSecurityWarningProps {
  bridgeAddress: string;
  network: string;
  onViewDetails?: () => void;
  onDismiss?: () => void;
  showFullDetails?: boolean;
}

export const BridgeSecurityWarning: React.FC<BridgeSecurityWarningProps> = ({
  bridgeAddress,
  network,
  onViewDetails,
  onDismiss,
  showFullDetails = false,
}) => {
  const [expanded, setExpanded] = useState(showFullDetails);
  const { securityScore, loading, error, fetchComprehensiveScan } = useBridgeSecurityScore(
    bridgeAddress,
    network
  );

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-200 rounded" />
          <div className="h-4 bg-blue-200 rounded flex-1" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Unable to verify bridge security. Proceed with caution.
            </span>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-yellow-600 hover:text-yellow-800"
              aria-label="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!securityScore) {
    return null;
  }

  const shouldBlock = securityScore.overall_score < 4.0 || securityScore.risk_level === 'CRITICAL';
  const shouldWarn = securityScore.overall_score < 6.0 || securityScore.risk_level === 'HIGH';

  if (!shouldBlock && !shouldWarn) {
    return null; // No warning needed for safe bridges
  }

  const bgColor = shouldBlock
    ? 'bg-red-50 border-red-200'
    : 'bg-orange-50 border-orange-200';
  const textColor = shouldBlock
    ? 'text-red-800'
    : 'text-orange-800';
  const iconColor = shouldBlock
    ? 'text-red-600'
    : 'text-orange-600';

  return (
    <div className={`${bgColor} border rounded-lg p-4 ${textColor}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <AlertTriangle className={`w-5 h-5 ${iconColor} mt-0.5 flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold text-sm">
                {shouldBlock ? '⚠️ Critical Security Risk' : '⚠️ Security Warning'}
              </h4>
              <BridgeSecurityBadge
                score={securityScore.overall_score}
                riskLevel={securityScore.risk_level}
                size="small"
                showLabel={false}
              />
            </div>
            <p className="text-sm mb-3">
              {shouldBlock
                ? 'This bridge has critical security issues. We strongly recommend using an alternative bridge.'
                : 'This bridge has security concerns. Review the details before proceeding.'}
            </p>

            {expanded && (
              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <strong>Risk Level:</strong> {securityScore.risk_level}
                </div>
                <div>
                  <strong>Security Score:</strong> {securityScore.overall_score.toFixed(1)}/10
                </div>
                {securityScore.scores && (
                  <div className="mt-2">
                    <strong>Score Breakdown:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {Object.entries(securityScore.scores).map(([key, value]) => (
                        <li key={key}>
                          {key.replace(/_/g, ' ')}: {value.toFixed(1)}/10
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm font-medium hover:underline flex items-center gap-1"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show Details
                  </>
                )}
              </button>
              {onViewDetails && (
                <button
                  onClick={onViewDetails}
                  className="text-sm font-medium hover:underline flex items-center gap-1"
                >
                  Full Report
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${iconColor} hover:opacity-70 flex-shrink-0`}
            aria-label="Dismiss warning"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default BridgeSecurityWarning;

