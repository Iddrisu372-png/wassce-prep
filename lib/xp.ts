
export type XPQuizResult = {
  score: number;
  total_questions: number;
};

export type StudentLevel = {
  level: number;
  title: string;
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
  xpToNextLevel: number;
};

export function calculateQuizXP(
  result: XPQuizResult
): number {
  const total = Number(result.total_questions);
  const score = Number(result.score);

  if (
    !Number.isFinite(total) ||
    !Number.isFinite(score) ||
    total <= 0
  ) {
    return 0;
  }

  const correct = Math.min(
    Math.floor(total),
    Math.max(0, Math.floor(score))
  );

  return (
    20 +
    correct * 5 +
    (correct === total ? 25 : 0)
  );
}

export function calculateTotalXP(
  results: XPQuizResult[]
): number {
  return results.reduce(
    (sum, result) => sum + calculateQuizXP(result),
    0
  );
}

export function xpRequiredForLevel(
  level: number
): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return 100 * (safeLevel - 1) * safeLevel;
}

export function getLevelTitle(level: number): string {
  if (level >= 20) return "NexaTech Master";
  if (level >= 15) return "Elite Scholar";
  if (level >= 10) return "Learning Expert";
  if (level >= 5) return "Rising Scholar";
  return "Beginner";
}

export function getStudentLevel(
  totalXP: number
): StudentLevel {
  const safeXP = Number.isFinite(totalXP)
    ? Math.max(0, Math.floor(totalXP))
    : 0;

  let level = 1;

  while (
    xpRequiredForLevel(level + 1) <= safeXP
  ) {
    level++;
  }

  const currentLevelXP = xpRequiredForLevel(level);
  const nextLevelXP = xpRequiredForLevel(level + 1);

  const progress = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        ((safeXP - currentLevelXP) /
          (nextLevelXP - currentLevelXP)) *
          100
      )
    )
  );

  return {
    level,
    title: getLevelTitle(level),
    totalXP: safeXP,
    currentLevelXP,
    nextLevelXP,
    progress,
    xpToNextLevel: nextLevelXP - safeXP,
  };
}
