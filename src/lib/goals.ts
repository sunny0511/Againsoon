import { daysInMonth, isInPast, startOfMonth } from '@/src/lib/dates';
import type { DateGoal, DateGoalCadence, Meet } from '@/src/types';

function latestStart(meet: Meet): string {
  return meet.revisions[meet.revisions.length - 1].startsAt;
}

export function targetForCadence(cadence: DateGoalCadence, now = new Date()): number {
  const days = daysInMonth(now);
  switch (cadence) {
    case 'weekly':
      return Math.max(4, Math.round(days / 7));
    case 'twiceWeekly':
      return Math.max(8, Math.round((days / 7) * 2));
    case 'biweekly':
      return Math.max(2, Math.round(days / 14));
    case 'monthly':
      return 1;
    default:
      return 4;
  }
}

export function cadenceLabel(cadence: DateGoalCadence): string {
  switch (cadence) {
    case 'weekly':
      return 'Once a week';
    case 'twiceWeekly':
      return 'Twice a week';
    case 'biweekly':
      return 'Every two weeks';
    case 'monthly':
      return 'Once a month';
    default:
      return 'Once a week';
  }
}

export type GoalProgress = {
  completed: number;
  upcoming: number;
  target: number;
  expected: number;
  behind: boolean;
  remaining: number;
  ratio: number;
};

export function goalProgress(meets: Meet[], goal: DateGoal, now = new Date()): GoalProgress {
  const monthStart = startOfMonth(now).getTime();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  const inMonth = meets.filter((meet) => {
    if (meet.status !== 'confirmed') return false;
    const start = new Date(latestStart(meet)).getTime();
    return start >= monthStart && start < monthEnd;
  });
  const completed = inMonth.filter((meet) => isInPast(latestStart(meet), now)).length;
  const upcoming = inMonth.filter((meet) => !isInPast(latestStart(meet), now)).length;
  const target = targetForCadence(goal.cadence, now);
  const expected = target * (now.getDate() / daysInMonth(now));
  const behind = completed < expected - 0.35;
  const remaining = Math.max(0, target - completed);
  return {
    completed,
    upcoming,
    target,
    expected,
    behind,
    remaining,
    ratio: target === 0 ? 0 : Math.min(1, completed / target),
  };
}

export function nudgeCopy(progress: GoalProgress, partnerName: string): string | null {
  if (!progress.behind) return null;
  if (progress.completed === 0) {
    return `No dates locked in yet this month. A small plan with ${partnerName} would start the rhythm.`;
  }
  return `You’re a little behind — ${progress.completed} of ${progress.target} meets so far. A free evening this week would catch you up.`;
}
