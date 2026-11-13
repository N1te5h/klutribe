import {
  ACADEMIC_YEARS,
  ARCHETYPES,
  BRANCHES,
  type CampusEvent,
  type ProjectTeam,
  type StartupIdea,
  type StudentPublic,
} from '../types/klu';

interface LeaderboardViewProps {
  students: StudentPublic[];
  ideas: StartupIdea[];
  projects: ProjectTeam[];
  events: CampusEvent[];
}

export function LeaderboardView({
  students,
  ideas,
  projects,
  events,
}: LeaderboardViewProps) {
  const totalStudents = students.length;

  const branchCounts = BRANCHES.map((branch) => ({
    label: branch,
    count: students.filter((s) => s.branch === branch).length,
  })).sort((a, b) => b.count - a.count);

  const yearCounts = ACADEMIC_YEARS.map((yr) => ({
    label: yr,
    count: students.filter((s) => s.year === yr).length,
  }));

  const categoryCounts = ARCHETYPES.map((arch) => ({
    label: arch.name,
    subtitle: arch.subtitle,
    color: arch.accentHex,
    count: students.filter((s) => s.primaryCategory === arch.id).length,
  })).sort((a, b) => b.count - a.count);

  const skillMap = new Map<string, number>();
  students.forEach((s) => {
    s.skills.forEach((sk) => {
      skillMap.set(sk, (skillMap.get(sk) || 0) + 1);
    });
  });
  const topSkills = Array.from(skillMap.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const totalParticipations = events.reduce((acc, ev) => acc + ev.attendeeUids.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Leaderboard & Aggregate Statistics
        </h1>
        <p className="text-sm text-zinc-400">
          Live aggregate distribution across KL University branches, years, archetypes, and active builds. Personal and gender data are never compared publicly.
        </p>
      </div>

      {/* Top Real Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-5">
          <p className="text-xs text-zinc-500">Active Members</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{totalStudents}</p>
        </div>
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-5">
          <p className="text-xs text-zinc-500">Active Projects</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-400">
            {projects.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-5">
          <p className="text-xs text-zinc-500">Public Startup Ideas</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-blue-400">
            {ideas.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-5">
          <p className="text-xs text-zinc-500">Campus Participations</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{totalParticipations}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch-wise Breakdown */}
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-6 space-y-4">
          <h2 className="font-display text-base font-semibold">Branch-wise Students</h2>
          <div className="space-y-3">
            {branchCounts.map((row) => {
              const pct = totalStudents > 0 ? Math.round((row.count / totalStudents) * 100) : 0;
              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-200">{row.label}</span>
                    <span className="font-mono tabular-nums text-zinc-400">
                      {row.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#09090B] overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category-wise Distribution */}
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-6 space-y-4">
          <h2 className="font-display text-base font-semibold">Archetype Distribution</h2>
          <div className="space-y-3">
            {categoryCounts.map((row) => {
              const pct = totalStudents > 0 ? Math.round((row.count / totalStudents) * 100) : 0;
              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-200">
                      {row.label} <span className="text-zinc-500">· {row.subtitle}</span>
                    </span>
                    <span className="font-mono tabular-nums text-zinc-400">
                      {row.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#09090B] overflow-hidden">
                    <div
                      className="h-full"
                      style={{ width: `${pct}%`, backgroundColor: row.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Year-wise Distribution */}
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-6 space-y-4">
          <h2 className="font-display text-base font-semibold">Year-wise Cohorts</h2>
          <div className="grid grid-cols-2 gap-4">
            {yearCounts.map((yr) => (
              <div key={yr.label} className="rounded-xl border border-[#27272A] bg-[#09090B] p-4">
                <p className="text-xs text-zinc-400">{yr.label}</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#F5F5F5]">
                  {yr.count}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Most Popular Skills */}
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-6 space-y-4">
          <h2 className="font-display text-base font-semibold">Most Popular Skills</h2>
          {topSkills.length === 0 ? (
            <p className="text-xs text-zinc-400">No skills recorded yet.</p>
          ) : (
            <div className="divide-y divide-[#27272A]">
              {topSkills.map((item, idx) => (
                <div key={item.skill} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-zinc-200">
                    <span className="font-mono text-zinc-500 mr-2">0{idx + 1}.</span>
                    {item.skill}
                  </span>
                  <span className="font-mono tabular-nums text-emerald-400">
                    {item.count} members
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
