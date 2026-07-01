'use client';

import { useTranslation } from '@/lib/i18n';

export interface TimelineEvent {
  type: 'created' | 'sent' | 'chef_modified' | 'client_modified'
      | 'client_responded' | 'claimed' | 'accepted' | 'rejected' | 'expired';
  timestamp: string;
  label: string;
  description?: string;
}

interface ProposalTimelineProps {
  events: TimelineEvent[];
}

const EVENT_COLORS: Record<string, { dot: string; line: string; bg: string }> = {
  created: { dot: 'bg-blue-400', line: 'bg-blue-400/30', bg: 'bg-blue-500/10' },
  sent: { dot: 'bg-green-500', line: 'bg-green-500/30', bg: 'bg-green-500/10' },
  chef_modified: { dot: 'bg-purple-400', line: 'bg-purple-400/30', bg: 'bg-purple-500/10' },
  client_modified: { dot: 'bg-yellow-400', line: 'bg-yellow-400/30', bg: 'bg-yellow-500/10' },
  client_responded: { dot: 'bg-amber-400', line: 'bg-amber-400/30', bg: 'bg-amber-500/10' },
  claimed: { dot: 'bg-cyan-400', line: 'bg-cyan-400/30', bg: 'bg-cyan-500/10' },
  accepted: { dot: 'bg-green-500', line: 'bg-green-500/30', bg: 'bg-green-500/10' },
  rejected: { dot: 'bg-red-400', line: 'bg-red-400/30', bg: 'bg-red-500/10' },
  expired: { dot: 'bg-gray-400', line: 'bg-gray-400/30', bg: 'bg-gray-500/10' },
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ProposalTimeline({ events }: ProposalTimelineProps) {
  const { t } = useTranslation();

  if (events.length === 0) return null;

  return (
    <div className="rounded-lg bg-white/5 px-4 py-4 ring-1 ring-white/10 backdrop-blur-sm">
      <h3 className="mb-4 text-sm font-semibold text-white/70">{t('timeline.title')}</h3>
      <div className="relative">
        {events.map((event, index) => {
          const colors = EVENT_COLORS[event.type]!;
          const isLast = index === events.length - 1;

          return (
            <div key={`${event.type}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Vertical line connecting dots */}
              {!isLast && (
                <div className={`absolute left-[11px] top-[26px] h-full w-px ${colors.line}`} />
              )}

              {/* Dot */}
              <div className={`relative z-10 mt-1.5 h-5 w-5 shrink-0 rounded-full ${colors.dot} ring-2 ring-gray-900`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-white/80">
                    {t(`timeline.${event.type}`)}
                  </span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {formatDateTime(event.timestamp)}
                  </span>
                </div>
                {event.description && (
                  <p className="mt-0.5 text-xs text-gray-500">{event.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
