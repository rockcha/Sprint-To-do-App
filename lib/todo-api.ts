import type { TodoItem } from "@/types/todo";

const API_BASE_URL = "https://assignment-todolist-api.vercel.app/api";

// API 응답이 배열 또는 { items } 형태 모두 올 수 있어 공통 normalize를 사용한다.
function normalizeItems(data: unknown): TodoItem[] {
  if (Array.isArray(data)) {
    return data as TodoItem[];
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: TodoItem[] }).items;
  }

  return [];
}

async function fetchItems(
  tenantId: string,
  page: number,
  pageSize: number,
): Promise<TodoItem[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/${tenantId}/items?page=${page}&pageSize=${pageSize}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as unknown;
    return normalizeItems(data);
  } catch {
    return [];
  }
}

export async function getTodoItems(
  tenantId: string,
  page: number,
  pageSize: number,
): Promise<TodoItem[]> {
  return fetchItems(tenantId, page, pageSize);
}

export async function getTodoItemById(
  tenantId: string,
  id: number,
): Promise<TodoItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/${tenantId}/items/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as TodoItem;
    return data;
  } catch {
    return null;
  }
}

export async function createTodoItem(
  tenantId: string,
  name: string,
): Promise<TodoItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/${tenantId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as unknown;

    if (
      typeof payload === "object" &&
      payload !== null &&
      "id" in payload &&
      "name" in payload &&
      "isCompleted" in payload
    ) {
      return payload as TodoItem;
    }

    if (typeof payload === "object" && payload !== null && "item" in payload) {
      const nested = (payload as { item: unknown }).item;
      if (
        typeof nested === "object" &&
        nested !== null &&
        "id" in nested &&
        "name" in nested &&
        "isCompleted" in nested
      ) {
        return nested as TodoItem;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function updateTodoItem(
  tenantId: string,
  id: number,
  data: Partial<TodoItem>,
): Promise<TodoItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/${tenantId}/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as TodoItem;
    return result;
  } catch {
    return null;
  }
}

export async function deleteTodoItem(
  tenantId: string,
  id: number,
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/${tenantId}/items/${id}`, {
      method: "DELETE",
    });

    return response.ok;
  } catch {
    return false;
  }
}
