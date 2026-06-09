import { backendEnv } from "@/backend/src/config/env";

type QueryResult<T = any> = {
  data: T | null;
  error: { message: string; status?: number } | null;
  count?: number | null;
};

type QueryOptions = {
  count?: "exact";
  head?: boolean;
};

function parseCount(contentRange: string | null) {
  if (!contentRange) return null;
  const [, total] = contentRange.split("/");
  if (!total || total === "*") return null;
  const parsed = Number(total);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBody<T>(data: T[] | T | null, mode: "many" | "single" | "maybeSingle") {
  if (mode === "many") return { data, error: null };
  const rows = Array.isArray(data) ? data : data ? [data] : [];

  if (mode === "single" && rows.length !== 1) {
    return { data: null, error: { message: rows.length === 0 ? "No rows returned." : "Multiple rows returned." } };
  }

  if (mode === "maybeSingle" && rows.length > 1) {
    return { data: null, error: { message: "Multiple rows returned." } };
  }

  return { data: rows[0] ?? null, error: null };
}

class InsForgeQueryBuilder {
  private readonly params = new URLSearchParams();
  private readonly filters: string[] = [];
  private method: "GET" | "POST" | "PATCH" | "DELETE" | "HEAD" = "GET";
  private payload: unknown;
  private resultMode: "many" | "single" | "maybeSingle" = "many";
  private preferHeaders: string[] = [];

  constructor(private readonly table: string) {}

  select(columns = "*", options: QueryOptions = {}) {
    this.params.set("select", columns);
    if (options.count === "exact") {
      this.preferHeaders.push("count=exact");
    }
    if (options.head) {
      this.method = "HEAD";
    }
    return this;
  }

  insert(payload: unknown) {
    this.method = "POST";
    this.payload = payload;
    this.preferHeaders.push("return=representation");
    return this;
  }

  update(payload: unknown) {
    this.method = "PATCH";
    this.payload = payload;
    this.preferHeaders.push("return=representation");
    return this;
  }

  delete() {
    this.method = "DELETE";
    return this;
  }

  eq(column: string, value: unknown) {
    this.params.append(column, `eq.${String(value)}`);
    return this;
  }

  gte(column: string, value: unknown) {
    this.params.append(column, `gte.${String(value)}`);
    return this;
  }

  is(column: string, value: unknown) {
    this.params.append(column, `is.${value === null ? "null" : String(value)}`);
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    const current = this.params.get("order");
    const next = `${column}.${options.ascending === false ? "desc" : "asc"}`;
    this.params.set("order", current ? `${current},${next}` : next);
    return this;
  }

  limit(value: number) {
    this.params.set("limit", String(value));
    return this;
  }

  single() {
    this.resultMode = "single";
    return this;
  }

  maybeSingle() {
    this.resultMode = "maybeSingle";
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<QueryResult> {
    const query = this.params.toString();
    const url = `${backendEnv.INSFORGE_BASE_URL.replace(/\/$/, "")}/api/database/records/${this.table}${query ? `?${query}` : ""}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), backendEnv.INSFORGE_REQUEST_TIMEOUT_MS);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${backendEnv.INSFORGE_ANON_KEY}`,
      "Content-Type": "application/json"
    };

    if (this.preferHeaders.length) {
      headers.Prefer = [...new Set(this.preferHeaders)].join(",");
    }

    try {
      const response = await fetch(url, {
        method: this.method,
        headers,
        body: this.payload === undefined || this.method === "GET" || this.method === "HEAD" ? undefined : JSON.stringify(this.payload),
        cache: "no-store",
        signal: controller.signal
      });

      if (!response.ok) {
        const text = await response.text();
        let message = text || response.statusText;
        try {
          const parsed = JSON.parse(text);
          message = parsed.message || parsed.error || message;
        } catch {
          // Keep raw text when response is not JSON.
        }
        return { data: null, error: { message, status: response.status }, count: parseCount(response.headers.get("content-range")) };
      }

      if (this.method === "HEAD") {
        return { data: null, error: null, count: parseCount(response.headers.get("content-range")) };
      }

      const text = await response.text();
      const body = text ? JSON.parse(text) : null;
      const normalized = normalizeBody(body, this.resultMode);
      return {
        data: normalized.data,
        error: normalized.error,
        count: parseCount(response.headers.get("content-range"))
      };
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === "AbortError";
      return {
        data: null,
        error: { message: isTimeout ? `InsForge request timed out after ${backendEnv.INSFORGE_REQUEST_TIMEOUT_MS}ms.` : error instanceof Error ? error.message : "InsForge request failed." },
        count: null
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const insforge = {
  database: {
    from(table: string) {
      return new InsForgeQueryBuilder(table);
    }
  }
};
