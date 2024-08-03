export class GameSession {
  private credits: number;
  private static readonly SYMBOLS = [
    "Cherry",
    "Lemon",
    "Orange",
    "Watermelon",
  ] as const;
  private static readonly REWARDS: Record<
    (typeof GameSession.SYMBOLS)[number],
    number
  > = {
    Cherry: 10,
    Lemon: 20,
    Orange: 30,
    Watermelon: 40,
  };

  constructor(private sessionId: string) {
    this.credits = 10;
  }

  roll():
    | {
        symbols: (typeof GameSession.SYMBOLS)[number][];
        winAmount: number;
        credits: number;
      }
    | { error: string } {
    if (this.credits <= 0) {
      return { error: "Insufficient credits to roll" };
    }

    this.credits -= 1;
    let symbols = this.generateSymbols();
    let winAmount = this.calculateWinAmount(symbols);

    // Apply house advantage
    if (winAmount > 0) {
      if (this.credits >= 60 && Math.random() < 0.6) {
        ({ symbols, winAmount } = this.reRoll());
      } else if (this.credits >= 40 && Math.random() < 0.3) {
        ({ symbols, winAmount } = this.reRoll());
      }
    }

    this.credits += winAmount;
    return { symbols, winAmount, credits: this.credits };
  }
  private reRoll(): {
    symbols: (typeof GameSession.SYMBOLS)[number][];
    winAmount: number;
  } {
    const symbols = this.generateSymbols();
    const winAmount = this.calculateWinAmount(symbols);
    return { symbols, winAmount };
  }

  private generateSymbols(): (typeof GameSession.SYMBOLS)[number][] {
    return Array(3)
      .fill(null)
      .map(
        () =>
          GameSession.SYMBOLS[
            Math.floor(Math.random() * GameSession.SYMBOLS.length)
          ]
      );
  }

  private calculateWinAmount(
    symbols: (typeof GameSession.SYMBOLS)[number][]
  ): number {
    if (new Set(symbols).size === 1) {
      return GameSession.REWARDS[symbols[0]];
    }
    return 0;
  }

  getCredits(): number {
    return this.credits;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  cashOut(): number {
    const finalCredits = this.credits;
    this.credits = 0;
    return finalCredits;
  }
}
