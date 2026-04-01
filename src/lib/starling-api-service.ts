import Limiter from "bottleneck";
import {
  Accounts,
  Balance,
  SpendingCategory,
  Transactions,
} from "./starling-types";

export class Starling {
  private static limiter: Limiter | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;

    // Initialize shared rate limiter on first instance
    if (!Starling.limiter) {
      Starling.limiter = new Limiter({
        minTime: 200, // 5 requests per second = 200ms between requests
        maxConcurrent: 5, // Allow up to 5 concurrent requests
      });
    }
  }

  async getAccounts(): Promise<Accounts> {
    const res = await this.fetch("accounts", { next: { revalidate: 3600 } });
    return res.json();
  }

  async getTransactions(
    accountId: string,
    start: Date,
    end: Date,
    defaultCategory: string,
  ): Promise<Transactions> {
    const startOfDay = new Date(start);
    startOfDay.setHours(0, 0, 0);

    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59);

    const res = await this.fetch(
      `feed/account/${accountId}/category/${defaultCategory}/transactions-between?minTransactionTimestamp=${start.toISOString()}&maxTransactionTimestamp=${endOfDay.toISOString()}`,
    );
    return res.json();
  }

  async getBalance(accountId: string): Promise<Balance> {
    const res = await this.fetch(`accounts/${accountId}/balance`);
    return res.json();
  }

  async getSettleUpProfile(): Promise<{
    settleUpLink: string;
    status: string;
  }> {
    const res = await this.fetch(`settle-up/profile`, {
      next: { revalidate: 3600 },
    });
    return res.json();
  }

  async setCategory(
    accountId: string,
    defaultCategory: string,
    transactionId: string,
    category: SpendingCategory,
  ): Promise<void> {
    await this.fetch(
      `feed/account/${accountId}/category/${defaultCategory}/${transactionId}/spending-category`,
      {
        method: "PUT",
        body: JSON.stringify({
          spendingCategory: category,
          permanentSpendingCategoryUpdate: false,
          previousSpendingCategoryReferencesUpdate: false,
        }),
      },
    );
  }

  private async fetch(
    endpoint: string,
    options?: RequestInit & { next?: { revalidate?: number | false } },
  ): Promise<Response> {
    return Starling.limiter!.schedule(async () => {
      const response = await fetch(
        `https://api.starlingbank.com/api/v2/${endpoint}`,
        {
          ...options,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            ...options?.headers,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}: ${response.statusText}`,
        );
      }

      return response;
    });
  }
}
