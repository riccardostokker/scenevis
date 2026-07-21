import { describe, expect, it } from "vitest";

import { createScenario, INITIAL_WORKSPACE, workspaceReducer } from "./scenarios";

describe("scenario workspace", () => {
  it("adds and renames scenarios", () => {
    const first = createScenario(new File(["one"], "atrium.jpg"), "one");
    const second = createScenario(new File(["two"], "platform.CR2"), "two");

    const added = workspaceReducer(INITIAL_WORKSPACE, {
      type: "scenariosAdded",
      scenarios: [first, second],
    });
    const renamed = workspaceReducer(added, {
      type: "scenarioRenamed",
      id: "one",
      name: "North Atrium",
    });

    expect(renamed.activeId).toBe("one");
    expect(renamed.scenarios.map((scenario) => scenario.name)).toEqual([
      "North Atrium",
      "platform",
    ]);
  });

  it("keeps each scenario analysis independent", () => {
    const first = createScenario(new File(["one"], "one.jpg"), "one");
    const second = createScenario(new File(["two"], "two.jpg"), "two");
    const added = workspaceReducer(INITIAL_WORKSPACE, {
      type: "scenariosAdded",
      scenarios: [first, second],
    });
    const selected = workspaceReducer(added, {
      type: "selectionChanged",
      id: "one",
      activeRegion: "local_background",
      selection: {
        target: { type: "rectangle", x: 0.1, y: 0.2, width: 0.2, height: 0.2 },
      },
    });

    expect(selected.scenarios[0]?.selection.target).toBeDefined();
    expect(selected.scenarios[1]?.selection).toEqual({});
    expect(selected.scenarios[0]?.activeRegion).toBe("local_background");
  });

  it("selects the nearest scenario after removal", () => {
    const scenarios = [
      createScenario(new File(["one"], "one.jpg"), "one"),
      createScenario(new File(["two"], "two.jpg"), "two"),
      createScenario(new File(["three"], "three.jpg"), "three"),
    ];
    const added = workspaceReducer(INITIAL_WORKSPACE, { type: "scenariosAdded", scenarios });
    const activated = workspaceReducer(added, { type: "scenarioActivated", id: "two" });
    const removed = workspaceReducer(activated, { type: "scenarioRemoved", id: "two" });

    expect(removed.scenarios.map((scenario) => scenario.id)).toEqual(["one", "three"]);
    expect(removed.activeId).toBe("three");
  });
});
