(tg = (e) => e.replace(/-keyed|-non-keyed$/, "")),
  (j2 = v8.map((e) => ({
    name: e.name,
    dir: e.dir,
    displayname: tg(e.name),
    issues: e.issues ?? [],
    type: e.keyed ? Se.KEYED : Se.NON_KEYED,
    frameworkHomeURL: e.frameworkHomeURL,
  }))),
  (ng = new Set(cn)),
  (rg = new Set(j2)),
  (Rs = []);
for (let e of eg)
  for (let t of e.b) {
    const n = {};
    for (const r of Object.keys(t.v)) {
      const i = t.v[r],
        o = {
          mean: i ? Po.jStat.mean(i) : Number.NaN,
          median: i ? Po.jStat.median(i) : Number.NaN,
          standardDeviation: i ? Po.jStat.stdev(i, !0) : Number.NaN,
          values: i,
        };
      n[r] = o;
    }
    Rs.push({ framework: v8[e.f].name, benchmark: cn[t.b].id, results: n });
  }
console.log(Rs);
const Ac = Lm(Rs);
function n3({
  frameworks: e,
  benchmarks: t,
  selectedFrameworks: n,
  selectedBenchmarks: r,
  sortKey: i,
  displayMode: o,
  compareWith: l,
  categories: u,
  cpuDurationMode: f,
}) {
  return {
    [Se.KEYED]: new Cc(e, t, Ac, n, r, Se.KEYED, i, o, l[Se.KEYED], u, f),
    [Se.NON_KEYED]: new Cc(
      e,
      t,
      Ac,
      n,
      r,
      Se.NON_KEYED,
      i,
      o,
      l[Se.NON_KEYED],
      u,
      f
    ),
  };
}
function ig(e) {
  const t = {};
  if (e.benchmarks) {
    const n = new Set();
    for (const r of e.benchmarks) for (const i of cn) r === i.id && n.add(i);
    t.selectedBenchmarks = n;
  }
  if (e.frameworks) {
    const n = new Set();
    for (const r of e.frameworks) for (const i of j2) r === i.dir && n.add(i);
    t.selectedFrameworks = n;
  }
  return e.displayMode && (t.displayMode = e.displayMode), t;
}
const Dc = {
    benchmarks: cn,
    benchmarkLists: {
      [at.CPU]: cn.filter((e) => e.type === at.CPU),
      [at.MEM]: cn.filter((e) => e.type === at.MEM),
      [at.STARTUP]: cn.filter((e) => e.type === at.STARTUP),
    },
    frameworks: j2,
    frameworkLists: {
      [Se.KEYED]: j2.filter((e) => e.type === Se.KEYED),
      [Se.NON_KEYED]: j2.filter((e) => e.type === Se.NON_KEYED),
    },
    selectedBenchmarks: ng,
    selectedFrameworks: rg,
    sortKey: Os,
    displayMode: Vr.DISPLAY_MEDIAN,
    resultTables: { [Se.KEYED]: void 0, [Se.NON_KEYED]: void 0 },
    compareWith: { [Se.KEYED]: void 0, [Se.NON_KEYED]: void 0 },
    categories: new Set($s.map((e) => e.number)),
    cpuDurationMode: Gn.TOTAL,
  },
  og = { ...Dc, resultTables: n3(Dc) },
  De = Jm((e, t) => ({
    ...og,
    areAllBenchmarksSelected: (n) =>
      t().benchmarkLists[n].every((r) => t().selectedBenchmarks.has(r)),
    isNoneBenchmarkSelected: (n) =>
      t().benchmarkLists[n].every((r) => !t().selectedBenchmarks.has(r)),
    areAllFrameworksSelected: (n) =>
      t().frameworkLists[n].every((r) => t().selectedFrameworks.has(r)),
    isNoneFrameworkSelected: (n) =>
      t().frameworkLists[n].every((r) => !t().selectedFrameworks.has(r)),
    selectFramework: (n, r) => {
      const i = new Set(t().selectedFrameworks);
      r ? i.add(n) : i.delete(n);
      const o = { ...t(), selectedFrameworks: i };
      return e(() => ({ ...o, resultTables: n3(o) }));
    },
    selectAllFrameworks: (n, r) => {
      const i = new Set(t().selectedFrameworks),
        o =
          n === Se.KEYED
            ? t().frameworkLists[Se.KEYED]
            : t().frameworkLists[Se.NON_KEYED];
      for (const u of o) r ? i.add(u) : i.delete(u);
      const l = { ...t(), selectedFrameworks: i };
      return e(() => ({ ...l, resultTables: n3(l) }));
    },
    selectCategory: (n, r) => {
      const i = new Set(t().categories);
      r ? i.add(n) : i.delete(n);
      const o = { ...t(), categories: i };
      return e(() => ({ ...o, resultTables: n3(o) }));
    },
    selectBenchmark: (n, r) => {
      const i = new Set(t().selectedBenchmarks);
      r ? i.add(n) : i.delete(n);
      const o = { ...t(), selectedBenchmarks: i };
      return e(() => ({ ...o, resultTables: n3(o) }));
    },
    selectAllBenchmarks: (n, r) => {
      const i = new Set(t().selectedBenchmarks),
        o = t().benchmarkLists[n];
      for (const u of o) r ? i.add(u) : i.delete(u);
      const l = { ...t(), selectedBenchmarks: i };
      return e(() => ({ ...l, resultTables: n3(l) }));
    },
    selectDisplayMode: (n) => {
      const r = { ...t(), displayMode: n };
      return e(() => ({ ...r, resultTables: n3(r) }));
    },
    selectCpuDurationMode: (n) => {
      const r = { ...t(), cpuDurationMode: n };
      return e(() => ({ ...r, resultTables: n3(r) }));
    },
    compare: (n) => {
      const r = { ...t().compareWith };
      r[n.type] = n;
      const i = { ...t(), compareWith: r };
      return e(() => ({ ...i, resultTables: n3(i) }));
    },
    stopCompare: (n) => {
      const r = { ...t().compareWith };
      r[n.type] = void 0;
      const i = { ...t(), compareWith: r };
      return e(() => ({ ...i, resultTables: n3(i) }));
    },
    sort: (n) => {
      const r = { ...t(), sortKey: n };
      return e(() => ({ ...r, resultTables: n3(r) }));
    },
  }));
