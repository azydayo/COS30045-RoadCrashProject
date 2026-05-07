const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");
const routeViews = document.querySelectorAll(".route-view");
const dashboardTabs = document.querySelectorAll(".dashboard-tabs a");
const routeEyebrow = document.querySelector("#route-eyebrow");
const routeTitle = document.querySelector("#route-title");
const routeDescription = document.querySelector("#route-description");
const kpiRow = document.querySelector("#kpi-row");
const chartTitle = document.querySelector("#chart-title");
const chartNote = document.querySelector("#chart-note");
const chartControls = document.querySelector("#chart-controls");
const chart = document.querySelector("#chart");
const insights = document.querySelector("#insights");

const csvBase = "knime-output/";
const fmt = d3.format(",");
const pct = d3.format(".1%");
const signedPct = d3.format("+.1%");
const palette = {
  primary: "#B9FF66",
  secondary: "#191A23",
  white: "#FFFFFF",
  muted: "#66676E",
  blue: "#4A78FF",
  pink: "#FF6B8A",
  orange: "#FFB000"
};

const pages = {
  national: {
    eyebrow: "Healthcare impact",
    title: "National road crash injury overview",
    description: "Annual hospitalisations are read from the road user dataset and compared with the national bed-days trend.",
    chartTitle: "Hospitalisations and bed-days trend",
    chartNote: "The line tracks total hospitalised road crash cases. Bars show the available national bed-days indicator."
  },
  "road-users": {
    eyebrow: "Vulnerability profiling",
    title: "Road user risk profile",
    description: "A ranked view of who accounts for the largest share of road crash hospitalisations in the latest available year.",
    chartTitle: "Road user share in 2021",
    chartNote: "Horizontal bars rank each road user category by percentage share of annual hospitalisations."
  },
  "age-patterns": {
    eyebrow: "Vulnerability profiling",
    title: "Age pattern heatmap",
    description: "Age shares reveal which life stages dominate hospitalised injury patterns across the decade.",
    chartTitle: "Hospitalisation share by age group and year",
    chartNote: "Darker cells indicate a larger percentage share within that year."
  },
  states: {
    eyebrow: "Regional performance",
    title: "State and territory comparison",
    description: "Compare how hospitalised road crash injury counts changed from 2011 to 2021 across jurisdictions.",
    chartTitle: "Percentage change from 2011 to 2021",
    chartNote: "Rows duplicated in the source file are aggregated before calculating change."
  },
  "first-nations": {
    eyebrow: "Equity and disparity",
    title: "First Nations comparison",
    description: "Indexed growth highlights whether the road safety burden changed differently for First Nations and Non-Indigenous Australians.",
    chartTitle: "Indexed hospitalisation growth from 2011",
    chartNote: "Each group starts at 100 in 2011, making relative growth comparable."
  },
  equity: {
    eyebrow: "Equity and disparity",
    title: "Remoteness equity",
    description: "Grouped bars compare hospitalisation shares across Major Cities, Regional areas, and Remote areas by population group.",
    chartTitle: "Hospitalisation share by remoteness in 2021",
    chartNote: "Shares are percentages of annual hospitalisations in the remoteness comparison dataset."
  }
};

let dataCache;
let activeRoute = "home";

menuToggle.addEventListener("click", () => {
  navMenu.classList.toggle("active");
});

document.querySelectorAll(".nav-menu a").forEach((link) => {
  link.addEventListener("click", () => navMenu.classList.remove("active"));
});

function bindAccordion() {
  document.querySelectorAll(".process-item").forEach((item) => {
    const button = item.querySelector(".process-question");
    const icon = item.querySelector(".toggle-icon");

    button.addEventListener("click", () => {
      const isOpen = item.classList.contains("active");

      document.querySelectorAll(".process-item").forEach((otherItem) => {
        otherItem.classList.remove("active");
        otherItem.querySelector(".process-question").setAttribute("aria-expanded", "false");
        otherItem.querySelector(".toggle-icon").textContent = "+";
      });

      if (!isOpen) {
        item.classList.add("active");
        button.setAttribute("aria-expanded", "true");
        icon.textContent = "−";
      }
    });
  });
}

function num(value) {
  return Number(value) || 0;
}

function latestYear(rows, field = "year") {
  return d3.max(rows, (d) => d[field]);
}

function aggregate(rows, keys, valueField) {
  return Array.from(
    d3.rollup(
      rows,
      (values) => d3.sum(values, (d) => d[valueField]),
      ...keys.map((key) => (d) => d[key])
    ),
    ([key, value]) => ({ key, value })
  );
}

function flatRollup(rows, groupFields, valueField) {
  const nested = aggregate(rows, groupFields, valueField);
  const flatten = (entry, depth, keys) => {
    if (depth === groupFields.length - 1) {
      return [{ ...Object.fromEntries(keys.map((k, i) => [groupFields[i], k])), [valueField]: entry.value }];
    }
    return Array.from(entry.value, ([key, value]) => flatten({ key, value }, depth + 1, [...keys, key])).flat();
  };
  return nested.flatMap((entry) => flatten(entry, 0, [entry.key]));
}

async function loadData() {
  if (dataCache) return dataCache;

  const [
    bedDays,
    roadUsers,
    ageGroups,
    states,
    firstNations,
    remoteness
  ] = await Promise.all([
    d3.csv(`${csvBase}Bed-days-National-trend.csv`, (d) => ({
      year: num(d["Calendar year"]),
      bedDays: num(d["Mean(Bed days)"])
    })),
    d3.csv(`${csvBase}hospitalization_road_user_percentage.csv`, (d) => ({
      year: num(d["Calendar year"]),
      roadUser: d["Road user"],
      cases: num(d["cata_total_per_year"]),
      total: num(d["total_in_a_year"]),
      share: num(d["percentage_cata_in_a_year"])
    })),
    d3.csv(`${csvBase}hospitalization_age_group_percentage.csv`, (d) => ({
      year: num(d["Calendar year"]),
      ageGroup: d["Age group"],
      total: num(d["age_grp_total_per_year"]),
      share: num(d["percentage_in_a_year"])
    })),
    d3.csv(`${csvBase}hospitalization_state_terr_percentage.csv`, (d) => ({
      year: num(d["calendar year"]),
      state: d["state or territory"],
      cases: num(d["count of cases excluding died in hospitals within 30 days"]),
      share: num(d["percentage_in_a_year"])
    })),
    d3.csv(`${csvBase}hospitalisations_for_First_Nat_and_Nons.csv`, (d) => ({
      year: num(d["Calendar year (#3)"]),
      status: d["First Nations status (#3)"],
      cases: num(d["Hospitalisations (#3)"]),
      bedDays: num(d["Bed days excluding died in hospitals within 30 days (#3)"])
    })).then((rows) => rows.filter((d) => d.year && d.status)),
    d3.csv(`${csvBase}hospitalisations_for_remoteness_comp.csv`, (d) => ({
      year: num(d["Calendar year (#3)"]),
      area: d["ABS remoteness area"],
      status: d["First Nations status (#3)"],
      cases: num(d["Hospitalisations (#3)"]),
      bedDays: num(d["Bed days excluding died in hospitals within 30 days (#3)"]),
      share: num(d["Hos_percentage"]),
      bedShare: num(d["Bed_percentage"])
    }))
  ]);

  const national = Array.from(
    d3.rollup(roadUsers, (values) => d3.max(values, (d) => d.total), (d) => d.year),
    ([year, total]) => ({ year, total })
  ).sort((a, b) => a.year - b.year);

  const stateAgg = flatRollup(states, ["year", "state"], "cases");
  const fnAgg = flatRollup(firstNations, ["year", "status"], "cases");

  dataCache = { bedDays, roadUsers, ageGroups, states: stateAgg, firstNations: fnAgg, remoteness, national };
  return dataCache;
}

function setRouteView(name) {
  routeViews.forEach((view) => view.classList.toggle("active", view.dataset.route === name));
}

function currentPath() {
  return (window.location.hash.replace(/^#\/?/, "") || "home").split("?")[0];
}

async function route() {
  const path = currentPath();
  activeRoute = path === "home" ? "home" : path;

  if (path === "home") {
    setRouteView("home");
    return;
  }

  if (path === "process") {
    setRouteView("process");
    return;
  }

  if (!pages[path]) {
    window.location.hash = "#/";
    return;
  }

  setRouteView("dashboard");
  dashboardTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === path));
  renderShell(pages[path]);
  showLoading();

  try {
    const data = await loadData();
    if (activeRoute !== path) return;
    renderPage(path, data);
  } catch (error) {
    showError(error);
  }
}

function renderShell(page) {
  routeEyebrow.textContent = page.eyebrow;
  routeTitle.textContent = page.title;
  routeDescription.textContent = page.description;
  chartTitle.textContent = page.chartTitle;
  chartNote.textContent = page.chartNote;
  chartControls.innerHTML = "";
  kpiRow.innerHTML = "";
  insights.innerHTML = "";
}

function showLoading() {
  chart.innerHTML = `<div class="loading-state">Loading CSV data with D3...</div>`;
}

function showError(error) {
  chart.innerHTML = `<div class="error-state">Unable to load the CSV files. Run this project through a local web server, then refresh.<br>${error.message}</div>`;
}

function renderPage(path, data) {
  chart.innerHTML = "";
  if (path === "national") renderNational(data);
  if (path === "road-users") renderRoadUsers(data);
  if (path === "age-patterns") renderAgeHeatmap(data);
  if (path === "states") renderStates(data);
  if (path === "first-nations") renderFirstNations(data);
  if (path === "equity") renderRemoteness(data);
}

function setKpis(items) {
  kpiRow.innerHTML = items.map((item) => `
    <article class="kpi-card">
      <span>${item.label}</span>
      <strong>${item.value}</strong>
      <p>${item.note}</p>
    </article>
  `).join("");
}

function setInsights(items) {
  insights.innerHTML = items.map((item) => `
    <article class="insight-card">
      <h3>${item.title}</h3>
      <p>${item.body}</p>
    </article>
  `).join("");
}

function chartSize(height = 430) {
  const width = Math.max(chart.clientWidth || 760, 760);
  return { width, height };
}

function svgRoot(height = 430) {
  const { width } = chartSize(height);
  return d3.select(chart).append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("height", height);
}

function tooltip() {
  let tip = d3.select(".tooltip");
  if (tip.empty()) tip = d3.select("body").append("div").attr("class", "tooltip");
  return tip;
}

function showTip(event, title, body) {
  tooltip()
    .style("opacity", 1)
    .style("left", `${event.clientX}px`)
    .style("top", `${event.clientY}px`)
    .html(`<strong>${title}</strong>${body}`);
}

function hideTip() {
  tooltip().style("opacity", 0);
}

function renderNational(data) {
  const latest = data.national.at(-1);
  const first = data.national[0];
  const latestBed = data.bedDays.find((d) => d.year === latest.year);
  const topUser = d3.greatest(data.roadUsers.filter((d) => d.year === latest.year), (d) => d.cases);

  setKpis([
    { label: "2021 hospitalisations", value: fmt(latest.total), note: `${signedPct((latest.total - first.total) / first.total)} from 2011` },
    { label: "Bed-days indicator", value: fmt(Math.round(latestBed.bedDays)), note: "Latest national trend value in the processed CSV" },
    { label: "Largest road user group", value: topUser.roadUser, note: `${pct(topUser.share)} of 2021 hospitalisations` }
  ]);

  const svg = svgRoot(460);
  const margin = { top: 24, right: 70, bottom: 50, left: 70 };
  const width = chartSize().width - margin.left - margin.right;
  const height = 460 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(data.national.map((d) => d.year)).range([0, width]).padding(0.34);
  const yCases = d3.scaleLinear().domain([0, d3.max(data.national, (d) => d.total)]).nice().range([height, 0]);
  const yBed = d3.scaleLinear().domain([0, d3.max(data.bedDays, (d) => d.bedDays)]).nice().range([height, 0]);
  const lineX = (d) => x(d.year) + x.bandwidth() / 2;

  g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
  g.append("g").attr("class", "axis").call(d3.axisLeft(yCases).ticks(5).tickFormat(d3.format("~s")));
  g.append("g").attr("class", "axis").attr("transform", `translate(${width},0)`).call(d3.axisRight(yBed).ticks(5).tickFormat(d3.format("~s")));

  g.selectAll(".bed-bar")
    .data(data.bedDays)
    .join("rect")
    .attr("class", "bed-bar")
    .attr("x", (d) => x(d.year))
    .attr("y", (d) => yBed(d.bedDays))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - yBed(d.bedDays))
    .attr("fill", palette.primary)
    .attr("stroke", palette.secondary)
    .attr("stroke-width", 2)
    .on("mousemove", (event, d) => showTip(event, d.year, `Bed-days indicator: ${fmt(Math.round(d.bedDays))}`))
    .on("mouseleave", hideTip);

  g.append("path")
    .datum(data.national)
    .attr("fill", "none")
    .attr("stroke", palette.secondary)
    .attr("stroke-width", 4)
    .attr("d", d3.line().x(lineX).y((d) => yCases(d.total)));

  g.selectAll(".case-dot")
    .data(data.national)
    .join("circle")
    .attr("class", "case-dot")
    .attr("cx", lineX)
    .attr("cy", (d) => yCases(d.total))
    .attr("r", 6)
    .attr("fill", palette.white)
    .attr("stroke", palette.secondary)
    .attr("stroke-width", 3)
    .on("mousemove", (event, d) => showTip(event, d.year, `Hospitalisations: ${fmt(d.total)}`))
    .on("mouseleave", hideTip);

  addLegend([{ label: "Hospitalisations", color: palette.secondary }, { label: "Bed-days trend", color: palette.primary }]);
  setInsights([
    { title: "Healthcare load rose", body: `Hospitalisations increased from ${fmt(first.total)} in 2011 to ${fmt(latest.total)} in 2021.` },
    { title: "Severity pressure persists", body: `The latest bed-days indicator is ${fmt(Math.round(latestBed.bedDays))}, the highest value in this processed series.` },
    { title: "Exposure is concentrated", body: `${topUser.roadUser} remains the largest road user group in the 2021 data.` }
  ]);
}

function renderRoadUsers(data) {
  const year = latestYear(data.roadUsers);
  const rows = data.roadUsers.filter((d) => d.year === year).sort((a, b) => b.share - a.share);
  const focus = new Set(["Car driver", "Motorcyclist", "Pedal cyclist"]);

  setKpis([
    { label: "Latest year", value: year, note: "Road user distribution" },
    { label: "Top category", value: rows[0].roadUser, note: `${pct(rows[0].share)} of hospitalisations` },
    { label: "Cyclist share", value: pct(rows.find((d) => d.roadUser === "Pedal cyclist").share), note: "Pedal cyclist percentage in 2021" }
  ]);

  const svg = svgRoot(520);
  const margin = { top: 10, right: 90, bottom: 35, left: 210 };
  const width = chartSize().width - margin.left - margin.right;
  const height = 520 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleLinear().domain([0, d3.max(rows, (d) => d.share)]).nice().range([0, width]);
  const y = d3.scaleBand().domain(rows.map((d) => d.roadUser)).range([0, height]).padding(0.18);

  g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(5).tickFormat(pct));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y));

  g.selectAll("rect")
    .data(rows)
    .join("rect")
    .attr("x", 0)
    .attr("y", (d) => y(d.roadUser))
    .attr("width", (d) => x(d.share))
    .attr("height", y.bandwidth())
    .attr("rx", 8)
    .attr("fill", (d) => focus.has(d.roadUser) ? palette.primary : palette.white)
    .attr("stroke", palette.secondary)
    .attr("stroke-width", 2)
    .on("mousemove", (event, d) => showTip(event, d.roadUser, `${fmt(d.cases)} cases<br>${pct(d.share)} of ${year}`))
    .on("mouseleave", hideTip);

  g.selectAll(".value-label")
    .data(rows)
    .join("text")
    .attr("class", "chart-label")
    .attr("x", (d) => x(d.share) + 8)
    .attr("y", (d) => y(d.roadUser) + y.bandwidth() / 2 + 4)
    .text((d) => pct(d.share));

  addLegend([{ label: "Policy focus groups", color: palette.primary }, { label: "Other road users", color: palette.white }]);
  setInsights([
    { title: "Car drivers lead the profile", body: `Car drivers account for ${pct(rows.find((d) => d.roadUser === "Car driver").share)} of hospitalisations in ${year}.` },
    { title: "Two-wheeled exposure is visible", body: `Motorcyclists and pedal cyclists together account for ${pct(d3.sum(rows.filter((d) => ["Motorcyclist", "Pedal cyclist"].includes(d.roadUser)), (d) => d.share))}.` },
    { title: "Small categories still matter", body: "The long tail includes pedestrians, passengers, heavy transport users, and unknown categories." }
  ]);
}

function renderAgeHeatmap(data) {
  const order = ["0-7", "8-16", "17-25", "26-39", "40-64", "65-74", "75+", "Missing"];
  const rows = data.ageGroups.filter((d) => d.ageGroup !== "Missing");
  const years = Array.from(new Set(rows.map((d) => d.year))).sort((a, b) => a - b);
  const ages = order.filter((age) => rows.some((d) => d.ageGroup === age));
  const peak = d3.greatest(rows, (d) => d.share);

  setKpis([
    { label: "Peak cell", value: peak.ageGroup, note: `${pct(peak.share)} in ${peak.year}` },
    { label: "Years covered", value: `${years[0]}-${years.at(-1)}`, note: "Processed age-group data" },
    { label: "Age groups", value: ages.length, note: "Missing values excluded from the heatmap" }
  ]);

  const svg = svgRoot(470);
  const margin = { top: 35, right: 40, bottom: 50, left: 90 };
  const width = chartSize().width - margin.left - margin.right;
  const height = 470 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleBand().domain(years).range([0, width]).padding(0.06);
  const y = d3.scaleBand().domain(ages).range([0, height]).padding(0.08);
  const color = d3.scaleLinear().domain([0, d3.max(rows, (d) => d.share)]).range(["#FFFFFF", palette.primary]);

  g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y));

  g.selectAll("rect")
    .data(rows)
    .join("rect")
    .attr("x", (d) => x(d.year))
    .attr("y", (d) => y(d.ageGroup))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("rx", 5)
    .attr("fill", (d) => color(d.share))
    .attr("stroke", palette.secondary)
    .attr("stroke-width", 1.5)
    .on("mousemove", (event, d) => showTip(event, `${d.ageGroup}, ${d.year}`, `${pct(d.share)} of annual age-group distribution`))
    .on("mouseleave", hideTip);

  g.selectAll(".heat-label")
    .data(rows)
    .join("text")
    .attr("class", "chart-label")
    .attr("x", (d) => x(d.year) + x.bandwidth() / 2)
    .attr("y", (d) => y(d.ageGroup) + y.bandwidth() / 2 + 4)
    .attr("text-anchor", "middle")
    .text((d) => d.share > 0.06 ? d3.format(".0%")(d.share) : "");

  addLegend([{ label: "Lower share", color: palette.white }, { label: "Higher share", color: palette.primary }]);
  setInsights([
    { title: "Older adults dominate the share", body: `${peak.ageGroup} has the highest single heatmap cell at ${pct(peak.share)}.` },
    { title: "Young adults remain visible", body: "The 17-25 group is smaller than older adult groups but remains policy-relevant for driver risk." },
    { title: "Pattern is stable", body: "The strongest cells stay in the older age bands across the 2011-2021 period." }
  ]);
}

function renderStates(data) {
  const states = Array.from(d3.group(data.states, (d) => d.state), ([state, values]) => {
    const byYear = new Map(values.map((d) => [d.year, d.cases]));
    const start = byYear.get(2011);
    const end = byYear.get(2021);
    return { state, start, end, change: (end - start) / start };
  }).sort((a, b) => b.change - a.change);

  setKpis([
    { label: "Largest increase", value: states[0].state, note: signedPct(states[0].change) },
    { label: "Largest decrease", value: states.at(-1).state, note: signedPct(states.at(-1).change) },
    { label: "Jurisdictions", value: states.length, note: "States and territories compared" }
  ]);

  const svg = svgRoot(450);
  const margin = { top: 15, right: 80, bottom: 40, left: 80 };
  const width = chartSize().width - margin.left - margin.right;
  const height = 450 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const extent = d3.extent(states, (d) => d.change);
  const x = d3.scaleLinear().domain([Math.min(0, extent[0]), Math.max(0, extent[1])]).nice().range([0, width]);
  const y = d3.scaleBand().domain(states.map((d) => d.state)).range([0, height]).padding(0.22);
  const zero = x(0);

  g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(6).tickFormat(signedPct));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y));
  g.append("line").attr("x1", zero).attr("x2", zero).attr("y1", 0).attr("y2", height).attr("stroke", palette.secondary).attr("stroke-width", 2);

  g.selectAll("rect")
    .data(states)
    .join("rect")
    .attr("x", (d) => Math.min(zero, x(d.change)))
    .attr("y", (d) => y(d.state))
    .attr("width", (d) => Math.abs(x(d.change) - zero))
    .attr("height", y.bandwidth())
    .attr("rx", 8)
    .attr("fill", (d) => d.change >= 0 ? palette.primary : palette.white)
    .attr("stroke", palette.secondary)
    .attr("stroke-width", 2)
    .on("mousemove", (event, d) => showTip(event, d.state, `${fmt(d.start)} in 2011<br>${fmt(d.end)} in 2021<br>${signedPct(d.change)} change`))
    .on("mouseleave", hideTip);

  g.selectAll(".value-label")
    .data(states)
    .join("text")
    .attr("class", "chart-label")
    .attr("x", (d) => d.change >= 0 ? x(d.change) + 8 : x(d.change) - 8)
    .attr("y", (d) => y(d.state) + y.bandwidth() / 2 + 4)
    .attr("text-anchor", (d) => d.change >= 0 ? "start" : "end")
    .text((d) => signedPct(d.change));

  addLegend([{ label: "Increase", color: palette.primary }, { label: "Decrease", color: palette.white }]);
  setInsights([
    { title: "Performance differs by region", body: `${states[0].state} has the strongest increase in this processed comparison.` },
    { title: "Declines are policy signals", body: `${states.at(-1).state} shows the largest reduction from 2011 to 2021.` },
    { title: "Absolute scale still matters", body: "Use the tooltip to compare start and end counts behind each percentage change." }
  ]);
}

function renderFirstNations(data) {
  const rows = data.firstNations.sort((a, b) => a.year - b.year);
  const byStatus = Array.from(d3.group(rows, (d) => d.status), ([status, values]) => {
    const base = values.find((d) => d.year === 2011)?.cases || values[0].cases;
    return { status, values: values.map((d) => ({ ...d, index: d.cases / base * 100 })) };
  });
  const latest = byStatus.map((group) => group.values.at(-1));
  const fnLatest = latest.find((d) => d.status === "First Nations people");
  const nonLatest = latest.find((d) => d.status === "Non-Indigenous");

  setKpis([
    { label: "First Nations index", value: d3.format(".0f")(fnLatest.index), note: "2011 = 100" },
    { label: "Non-Indigenous index", value: d3.format(".0f")(nonLatest.index), note: "2011 = 100" },
    { label: "Index gap", value: d3.format("+.0f")(fnLatest.index - nonLatest.index), note: "Latest relative difference" }
  ]);

  const svg = svgRoot(460);
  const margin = { top: 20, right: 140, bottom: 50, left: 70 };
  const width = chartSize().width - margin.left - margin.right;
  const height = 460 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const years = Array.from(new Set(rows.map((d) => d.year))).sort((a, b) => a - b);
  const x = d3.scalePoint().domain(years).range([0, width]).padding(0.3);
  const y = d3.scaleLinear().domain([80, d3.max(byStatus, (group) => d3.max(group.values, (d) => d.index))]).nice().range([height, 0]);
  const color = d3.scaleOrdinal().domain(byStatus.map((d) => d.status)).range([palette.primary, palette.secondary]);

  g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6));
  g.append("line").attr("x1", 0).attr("x2", width).attr("y1", y(100)).attr("y2", y(100)).attr("stroke", palette.muted).attr("stroke-dasharray", "6 6");

  byStatus.forEach((group) => {
    g.append("path")
      .datum(group.values)
      .attr("fill", "none")
      .attr("stroke", color(group.status))
      .attr("stroke-width", 4)
      .attr("d", d3.line().x((d) => x(d.year)).y((d) => y(d.index)));

    g.selectAll(`.dot-${group.status.replace(/\W/g, "")}`)
      .data(group.values)
      .join("circle")
      .attr("cx", (d) => x(d.year))
      .attr("cy", (d) => y(d.index))
      .attr("r", 6)
      .attr("fill", group.status === "First Nations people" ? palette.primary : palette.white)
      .attr("stroke", palette.secondary)
      .attr("stroke-width", 3)
      .on("mousemove", (event, d) => showTip(event, `${d.status}, ${d.year}`, `${fmt(d.cases)} cases<br>Index ${d3.format(".1f")(d.index)}`))
      .on("mouseleave", hideTip);
  });

  addLegend(byStatus.map((group) => ({ label: group.status, color: color(group.status) })));
  setInsights([
    { title: "Relative growth can reveal disparity", body: `First Nations index reaches ${d3.format(".1f")(fnLatest.index)} by 2021.` },
    { title: "The comparator is anchored", body: `Non-Indigenous index reaches ${d3.format(".1f")(nonLatest.index)} by 2021.` },
    { title: "Read as relative, not population rate", body: "The indexed chart compares growth from each group's own 2011 baseline." }
  ]);
}

function renderRemoteness(data) {
  const year = latestYear(data.remoteness);
  const rows = data.remoteness.filter((d) => d.year === year);
  const areas = ["Major Cities", "Regional", "Remote"];
  const statuses = ["First Nations people", "Non-Indigenous"];

  setKpis([
    { label: "Latest year", value: year, note: "Remoteness comparison" },
    { label: "First Nations remote share", value: pct(rows.find((d) => d.area === "Remote" && d.status === "First Nations people").share), note: "Hospitalisation share" },
    { label: "Non-Indigenous remote share", value: pct(rows.find((d) => d.area === "Remote" && d.status === "Non-Indigenous").share), note: "Hospitalisation share" }
  ]);

  const svg = svgRoot(450);
  const margin = { top: 25, right: 40, bottom: 60, left: 70 };
  const width = chartSize().width - margin.left - margin.right;
  const height = 450 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x0 = d3.scaleBand().domain(areas).range([0, width]).padding(0.24);
  const x1 = d3.scaleBand().domain(statuses).range([0, x0.bandwidth()]).padding(0.12);
  const y = d3.scaleLinear().domain([0, d3.max(rows, (d) => d.share)]).nice().range([height, 0]);
  const color = d3.scaleOrdinal().domain(statuses).range([palette.primary, palette.white]);

  g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x0));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6).tickFormat(pct));

  g.selectAll(".area-group")
    .data(areas)
    .join("g")
    .attr("transform", (area) => `translate(${x0(area)},0)`)
    .selectAll("rect")
    .data((area) => rows.filter((d) => d.area === area))
    .join("rect")
    .attr("x", (d) => x1(d.status))
    .attr("y", (d) => y(d.share))
    .attr("width", x1.bandwidth())
    .attr("height", (d) => height - y(d.share))
    .attr("rx", 8)
    .attr("fill", (d) => color(d.status))
    .attr("stroke", palette.secondary)
    .attr("stroke-width", 2)
    .on("mousemove", (event, d) => showTip(event, `${d.area}: ${d.status}`, `${fmt(d.cases)} cases<br>${pct(d.share)} of annual hospitalisations`))
    .on("mouseleave", hideTip);

  addLegend(statuses.map((status) => ({ label: status, color: color(status) })));
  const remoteFn = rows.find((d) => d.area === "Remote" && d.status === "First Nations people");
  const remoteNon = rows.find((d) => d.area === "Remote" && d.status === "Non-Indigenous");
  setInsights([
    { title: "Remote disparity is visible", body: `Remote shares are ${pct(remoteFn.share)} for First Nations people and ${pct(remoteNon.share)} for Non-Indigenous Australians.` },
    { title: "Major Cities dominate volume", body: "Major Cities hold the largest share for Non-Indigenous hospitalisations in the latest year." },
    { title: "Regional areas remain central", body: "Regional shares help show where service access and post-crash care pressure may differ." }
  ]);
}

function addLegend(items) {
  const legend = document.createElement("div");
  legend.className = "legend";
  legend.innerHTML = items.map((item) => `
    <span class="legend-item">
      <span class="legend-swatch" style="background:${item.color}"></span>
      ${item.label}
    </span>
  `).join("");
  chart.appendChild(legend);
}

window.addEventListener("hashchange", route);
window.addEventListener("resize", () => {
  if (pages[activeRoute] && dataCache) renderPage(activeRoute, dataCache);
});

bindAccordion();
route();
