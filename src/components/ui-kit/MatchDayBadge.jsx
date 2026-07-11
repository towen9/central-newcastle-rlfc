import React from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { useClub } from '@/contexts/ClubContext';

/**
 * Compact calendar-day badge: Today / Tomorrow / N days.
 * Uses differenceInCalendarDays so labels match the calendar date,
 * not an elapsed 24-hour ticker.
 */
export default function MatchDayBadge({ date, className = '' }) {
  const { club } = useClub();
  const t = club.theme;
  if (!date) return null;
  const target = new Date(date);
  const days = differenceInCalendarDays(target, new Date());

  let label, bg, color;
  if (days < 0) {
    label = 'Completed';
    bg = 'rgba(255,255,255,0.06)';
    color = 'rgba(255,255,255,0.4)';
  } else if (days === 0) {
    label = 'Today!';
    bg = `${t.gold}22`;
    color = t.goldHi;
  } else if (days === 1) {
    label = 'Tomorrow';
    bg = `${t.royal}33`;
    color = t.cyan;
  } else {
    label = `${days} days`;
    bg = `${t.royal}33`;
    color = t.cyan;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${className}`}
      style={{ fontSize: 10, letterSpacing: '0.05em', background: bg, color }}
    >
      {label}
    </span>
  );
}