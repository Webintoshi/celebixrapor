import { NextResponse } from "next/server";
import type { ZodIssue } from "zod";

import type { ApiFieldError } from "@/lib/pdf-contract";

export class HttpError extends Error {
  status: number;
  code: string;
  details?: ApiFieldError[];
  responseHeaders?: HeadersInit;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ApiFieldError[],
    responseHeaders?: HeadersInit,
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.responseHeaders = responseHeaders;
  }
}

export function zodIssuesToDetails(issues: ZodIssue[]): ApiFieldError[] {
  return issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : "body",
    message: issue.message,
    code: issue.code,
  }));
}

export function toErrorResponse(
  error: unknown,
  baseHeaders?: HeadersInit,
  requestId?: string,
): Response {
  const headers = new Headers(baseHeaders);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");

  if (requestId) {
    headers.set("X-Request-Id", requestId);
  }

  if (error instanceof HttpError) {
    if (error.responseHeaders) {
      new Headers(error.responseHeaders).forEach((value, key) =>
        headers.set(key, value),
      );
    }

    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      {
        status: error.status,
        headers,
      },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "internal_error",
        message: "Beklenmeyen bir hata olustu.",
      },
    },
    {
      status: 500,
      headers,
    },
  );
}
