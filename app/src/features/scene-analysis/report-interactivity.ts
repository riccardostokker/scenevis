export const REPORT_INTERACTIVITY = `
(() => {
  const report = document.querySelector("[data-report]");
  if (!report) return;

  const captureRows = Array.from(report.querySelectorAll("[data-capture-row]"));
  const scenarioIds = captureRows.map((row) => row.dataset.scenario);
  const filters = Array.from(report.querySelectorAll("[data-filter]"));
  const filterValues = new Map();
  const sortValues = new Map();
  let sortKey = null;
  let direction = "ascending";

  report.querySelectorAll("[data-filter-key][data-filter-value]").forEach((cell) => {
    const row = cell.closest("[data-scenario]");
    if (row) filterValues.set(row.dataset.scenario + "|" + cell.dataset.filterKey, cell.dataset.filterValue);
  });
  report.querySelectorAll("[data-sort-key][data-sort-value]").forEach((cell) => {
    const row = cell.closest("[data-scenario]");
    if (row && cell.dataset.sortValue !== "") {
      sortValues.set(row.dataset.scenario + "|" + cell.dataset.sortKey, Number(cell.dataset.sortValue));
    }
  });

  function orderedIds() {
    if (!sortKey) return [...scenarioIds];
    return scenarioIds
      .map((id, index) => ({ id, index, value: sortValues.get(id + "|" + sortKey) }))
      .sort((left, right) => {
        if (left.value === undefined && right.value === undefined) return left.index - right.index;
        if (left.value === undefined) return 1;
        if (right.value === undefined) return -1;
        const compared = (left.value - right.value) * (direction === "ascending" ? 1 : -1);
        return compared || left.index - right.index;
      })
      .map((entry) => entry.id);
  }

  function render() {
    const activeFilters = filters.filter((select) => select.value !== "");
    const ordered = orderedIds();
    const visible = ordered.filter((id) =>
      activeFilters.every((select) => filterValues.get(id + "|" + select.dataset.filter) === select.value),
    );
    const visibleSet = new Set(visible);
    const rank = new Map(ordered.map((id, index) => [id, index]));

    report.querySelectorAll("[data-scenario-list]").forEach((container) => {
      Array.from(container.children)
        .filter((element) => element.hasAttribute("data-scenario"))
        .sort((left, right) => rank.get(left.dataset.scenario) - rank.get(right.dataset.scenario))
        .forEach((element) => container.append(element));
    });
    report.querySelectorAll("[data-scenario]").forEach((element) => {
      element.hidden = !visibleSet.has(element.dataset.scenario);
    });

    const sortedBy = sortKey
      ? report.querySelector('[data-sort-title][data-sort-key="' + sortKey + '"]').dataset.sortTitle + " " + direction
      : null;
    report.querySelector("[data-view-status]").textContent =
      "Showing " + visible.length + " of " + scenarioIds.length +
      " · " + activeFilters.length + (activeFilters.length === 1 ? " filter" : " filters") +
      (sortedBy ? " · Sorted by " + sortedBy : "");
    report.querySelector("[data-visible-count]").textContent = visible.length;
    report.querySelector("[data-empty]").hidden = visible.length !== 0;
    report.querySelector("[data-filtered-content]").hidden = visible.length === 0;

    let differences = 0;
    filters.forEach((select) => {
      const key = select.dataset.filter;
      const differs = new Set(visible.map((id) => filterValues.get(id + "|" + key))).size > 1;
      if (differs) differences += 1;
      captureRows.forEach((row) => {
        const cell = row.querySelector('[data-filter-key="' + key + '"]');
        if (cell) cell.classList.toggle("differs", differs && visibleSet.has(row.dataset.scenario));
      });
    });
    const differenceLabel = report.querySelector("[data-difference-count]");
    differenceLabel.textContent = differences + (differences === 1 ? " difference" : " differences");
    differenceLabel.classList.toggle("active", differences > 0);

    report.querySelectorAll("[data-sort-title]").forEach((button) => {
      const active = button.dataset.sortKey === sortKey;
      const heading = button.closest("th");
      if (heading) heading.setAttribute("aria-sort", active ? direction : "none");
      const indicator = button.querySelector("[data-sort-indicator]");
      if (indicator) indicator.textContent = active ? (direction === "ascending" ? "↑" : "↓") : "↕";
    });
    visible.forEach((id, index) => {
      const number = report.querySelector('[data-scenario="' + id + '"] [data-scenario-number]');
      if (number) number.textContent = String(index + 1).padStart(2, "0");
    });
  }

  report.querySelectorAll("[data-sort-title]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = button.dataset.sortKey;
      direction = next === sortKey && direction === "ascending" ? "descending" : "ascending";
      sortKey = next;
      render();
    });
  });
  filters.forEach((select) => select.addEventListener("change", render));
  report.querySelector("[data-reset]").addEventListener("click", () => {
    filters.forEach((select) => { select.value = ""; });
    sortKey = null;
    direction = "ascending";
    render();
  });
  render();
})();`;
