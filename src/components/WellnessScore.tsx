type Props = {
  score: number;
};

export function WellnessScore({ score }: Props) {
  const color =
    score >= 8
      ? "bg-emerald-100 text-emerald-800"
      : score >= 5
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-800";

  return (
    <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 ${color}`}>
      <span className="text-lg">💚</span>
      <span className="text-sm font-semibold">Wellness {score}/10</span>
    </div>
  );
}

