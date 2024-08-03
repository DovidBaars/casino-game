import { expect, test, describe, mock } from "bun:test";
import { GameSession } from "./GameSession";

describe("GameSession", () => {
  test("should initialize with 10 credits", () => {
    const session = new GameSession("test-session");
    expect(session.getCredits()).toBe(10);
  });

  test("should deduct 1 credit on roll", () => {
    const session = new GameSession("test-session");
    const initialCredits = session.getCredits();
    const result = session.roll();
    if ("error" in result) {
      throw new Error("Unexpected error in roll");
    }
    expect(result.credits).toBe(initialCredits - 1 + result.winAmount);
  });

  test("should return valid symbols on roll", () => {
    const session = new GameSession("test-session");
    const result = session.roll();
    if ("error" in result) {
      throw new Error("Unexpected error in roll");
    }
    expect(result.symbols).toHaveLength(3);
    result.symbols.forEach((symbol) => {
      expect(["Cherry", "Lemon", "Orange", "Watermelon"]).toContain(symbol);
    });
  });

  test("should award correct winnings for matching symbols", () => {
    const session = new GameSession("test-session");
    const mockGenerateSymbols = mock(
      () => ["Cherry", "Cherry", "Cherry"] as const
    );
    // @ts-ignore: Accessing private method for testing
    session.generateSymbols = mockGenerateSymbols;

    const result = session.roll();
    if ("error" in result) {
      throw new Error("Unexpected error in roll");
    }
    expect(result.winAmount).toBe(10);
  });

  test("should return 0 winnings for non-matching symbols", () => {
    const session = new GameSession("test-session");
    const mockGenerateSymbols = mock(
      () => ["Cherry", "Lemon", "Orange"] as const
    );
    // @ts-ignore: Accessing private method for testing
    session.generateSymbols = mockGenerateSymbols;

    const result = session.roll();
    if ("error" in result) {
      throw new Error("Unexpected error in roll");
    }
    expect(result.winAmount).toBe(0);
  });

  test("should return error when trying to roll with 0 credits", () => {
    const session = new GameSession("test-session");
    // Deplete credits
    while (session.getCredits() > 0) {
      session.roll();
    }
    const result = session.roll();
    expect(result).toEqual({ error: "Insufficient credits to roll" });
  });

  test("should return all credits on cash out", () => {
    const session = new GameSession("test-session");
    const initialCredits = session.getCredits();
    const cashedOut = session.cashOut();
    expect(cashedOut).toBe(initialCredits);
    expect(session.getCredits()).toBe(0);
  });

  test("should apply house advantage when credits are 40 or above", () => {
    const session = new GameSession("test-session");
    const originalRandom = Math.random;
    const originalGenerateSymbols = session["generateSymbols"];
    const originalReRoll = session["reRoll"];

    // Mock Math.random
    Math.random = () => 0.2; // This will trigger re-roll

    // Mock generateSymbols to always return winning combination
    session["generateSymbols"] = () => ["Cherry", "Cherry", "Cherry"] as const;

    // Mock reRoll and track calls
    let reRollCalled = 0;
    session["reRoll"] = () => {
      reRollCalled++;
      return { symbols: ["Lemon", "Lemon", "Lemon"] as const, winAmount: 20 };
    };

    // Set credits to 50
    session["credits"] = 50;

    // Perform roll
    const result = session.roll();

    // Check if reRoll was called
    expect(reRollCalled).toBe(1);

    // Restore original methods
    Math.random = originalRandom;
    session["generateSymbols"] = originalGenerateSymbols;
    session["reRoll"] = originalReRoll;
  });

  test("should not apply house advantage when credits are below 40", () => {
    const session = new GameSession("test-session");
    const originalRandom = Math.random;
    const originalGenerateSymbols = session["generateSymbols"];
    const originalReRoll = session["reRoll"];

    // Mock Math.random
    Math.random = () => 0.2; // This would trigger re-roll if credits were 40 or above

    // Mock generateSymbols to always return winning combination
    session["generateSymbols"] = () => ["Cherry", "Cherry", "Cherry"] as const;

    // Mock reRoll and track calls
    let reRollCalled = 0;
    session["reRoll"] = () => {
      reRollCalled++;
      return { symbols: ["Lemon", "Lemon", "Lemon"] as const, winAmount: 20 };
    };

    // Set credits to 39
    session["credits"] = 39;

    // Perform roll
    const result = session.roll();

    // Check if reRoll was not called
    expect(reRollCalled).toBe(0);

    // Restore original methods
    Math.random = originalRandom;
    session["generateSymbols"] = originalGenerateSymbols;
    session["reRoll"] = originalReRoll;
  });

  test("should increase house advantage when credits are 60 or above", () => {
    const session = new GameSession("test-session");
    const originalRandom = Math.random;
    let randomValue = 0;
    Math.random = () => randomValue;

    // Set credits to 70
    while (session.getCredits() < 70) {
      const result = session.roll();
      if ("error" in result) {
        throw new Error("Unexpected error in roll");
      }
    }

    const mockGenerateSymbols = mock(
      () => ["Cherry", "Cherry", "Cherry"] as const
    );
    // @ts-ignore: Accessing private method for testing
    session.generateSymbols = mockGenerateSymbols;

    // Should re-roll 60% of the time
    randomValue = 0.5;
    let result = session.roll();
    expect(mockGenerateSymbols.mock.calls.length).toBe(2);

    // Should not re-roll 40% of the time
    randomValue = 0.7;
    result = session.roll();
    expect(mockGenerateSymbols.mock.calls.length).toBe(3);

    // Restore original Math.random
    Math.random = originalRandom;
  });
});
