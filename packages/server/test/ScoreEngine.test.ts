import { describe, it, expect } from "vitest";
import { ScoreEngine } from "../src/game/ScoreEngine.js";

describe("ScoreEngine", () => {
  it("returns default point values", () => {
    const engine = new ScoreEngine();
    expect(engine.pointsForCrystal("crystal_normal")).toBe(10);
    expect(engine.pointsForCrystal("crystal_special")).toBe(50);
    expect(engine.pointsForMonsterDefeated()).toBe(100);
    expect(engine.pointsForLevelCompletion()).toBe(500);
  });

  it("applies admin-configured overrides", () => {
    const engine = new ScoreEngine();
    engine.updateConfig({ normalCrystal: 25 });
    expect(engine.pointsForCrystal("crystal_normal")).toBe(25);
    // Untouched values stay at their defaults.
    expect(engine.pointsForCrystal("crystal_special")).toBe(50);
  });

  it("getConfig returns a copy, not a live reference", () => {
    const engine = new ScoreEngine();
    const cfg = engine.getConfig();
    cfg.normalCrystal = 999;
    expect(engine.pointsForCrystal("crystal_normal")).toBe(10);
  });
});
