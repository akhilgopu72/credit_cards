import { NextResponse } from "next/server";
import type { ApiResponse } from "@cardmax/shared";
import { db, type Database } from "@/server/db";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

type TransactionHandler = (
  tx: Transaction,
  request: Request
) => Promise<NextResponse>;

export function withTransaction(handler: TransactionHandler) {
  return async (request: Request) => {
    try {
      let response: NextResponse;
      await db.transaction(async (tx) => {
        response = await handler(tx, request);
        // If handler returned an error status, throw to trigger rollback
        if (response.status >= 400) {
          throw { __handled: true, response };
        }
      });
      return response!;
    } catch (error: any) {
      if (error?.__handled) return error.response;
      console.error("Transaction failed:", error);
      return NextResponse.json(
        { data: null, error: "Internal server error" } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }
  };
}

export type { Transaction };
