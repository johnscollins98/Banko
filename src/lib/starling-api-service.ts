import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import rateLimit from "axios-rate-limit";
import {
  Accounts,
  Balance,
  SpendingCategory,
  Transactions,
} from "./starling-types";

export class Starling {
  private static rateLimitedClient: AxiosInstance | null = null;

  constructor(private readonly apiKey: string) {
    // Initialize shared rate-limited client on first instance
    if (!Starling.rateLimitedClient) {
      const axiosInstance = axios.create({
        baseURL: "https://api.starlingbank.com/api/v2",
      });

      // Apply rate limiting: 5 requests per 1000ms (1 second)
      Starling.rateLimitedClient = rateLimit(axiosInstance, {
        limits: [
          { maxRequests: 5, duration: "1s" }, // 5 requets per second
          { maxRequests: 1000, duration: "24h" }, // 1000 requests per day
        ],
      });
    }
  }

  async getAccounts(): Promise<Accounts> {
    return await this.fetch("accounts");
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

    return await this.fetch(
      `feed/account/${accountId}/category/${defaultCategory}/transactions-between`,
      {
        params: {
          minTransactionTimestamp: start.toISOString(),
          maxTransactionTimestamp: endOfDay.toISOString(),
        },
      },
    );
  }

  async getBalance(accountId: string): Promise<Balance> {
    return await this.fetch(`accounts/${accountId}/balance`);
  }

  async getSettleUpProfile(): Promise<{
    settleUpLink: string;
    status: string;
  }> {
    return await this.fetch(`settle-up/profile`);
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
        data: {
          spendingCategory: category,
          permanentSpendingCategoryUpdate: false,
          previousSpendingCategoryReferencesUpdate: false,
        },
        method: "PUT",
      },
    );
  }

  private async fetch<TOut>(
    endpoint: string,
    config?: AxiosRequestConfig,
  ): Promise<TOut> {
    try {
      return (
        await Starling.rateLimitedClient!(endpoint, {
          ...config,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            ...(config?.headers as Record<string, string>),
          },
        })
      ).data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Request failed with status ${error.response?.status}: ${error.message}`,
        );
      }
      throw error;
    }
  }
}
