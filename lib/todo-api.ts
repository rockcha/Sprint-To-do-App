import type { TodoItem, TodoListPageResult } from "@/types/todo";

const API_BASE_URL = "https://assignment-todolist-api.vercel.app/api";

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

export async function getTodoItemsPage(
  tenantId: string,
  page: number,
  pageSize: number,
): Promise<TodoListPageResult> {
  const [items, nextPageItems] = await Promise.all([
    fetchItems(tenantId, page, pageSize),
    fetchItems(tenantId, page + 1, pageSize),
  ]);

  return {
    items,
    page,
    pageSize,
    hasNext: nextPageItems.length > 0,
  };
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

export async function uploadTodoImage(
  tenantId: string,
  id: number,
  file: File,
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("image", file);

    console.log(`이미지 업로드 시작: ${file.name} (${file.size} bytes)`);

    const response = await fetch(
      `${API_BASE_URL}/${tenantId}/items/${id}/image`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`이미지 업로드 실패 (${response.status}):`, errorText);
      return null;
    }

    const result = (await response.json()) as unknown;
    console.log("이미지 업로드 응답:", result);

    // 다양한 응답 형식 처리
    if (typeof result === "string") {
      console.log("반환된 이미지 URL (문자열):", result);
      return result; // 직접 URL 문자열인 경우
    }

    if (typeof result === "object" && result !== null) {
      // imageUrl 필드 확인
      if (
        "imageUrl" in result &&
        typeof (result as { imageUrl: unknown }).imageUrl === "string"
      ) {
        const imageUrl = (result as { imageUrl: string }).imageUrl;
        console.log("반환된 이미지 URL (imageUrl 필드):", imageUrl);
        return imageUrl;
      }

      // image 필드 확인
      if (
        "image" in result &&
        typeof (result as { image: unknown }).image === "string"
      ) {
        const image = (result as { image: string }).image;
        console.log("반환된 이미지 URL (image 필드):", image);
        return image;
      }

      // url 필드 확인
      if (
        "url" in result &&
        typeof (result as { url: unknown }).url === "string"
      ) {
        const url = (result as { url: string }).url;
        console.log("반환된 이미지 URL (url 필드):", url);
        return url;
      }

      // data.imageUrl 확인
      if (
        "data" in result &&
        typeof (result as { data: unknown }).data === "object" &&
        (result as { data: unknown }).data !== null &&
        "imageUrl" in ((result as { data: unknown }).data as object)
      ) {
        const imageUrl = (result as { data: { imageUrl: string } }).data
          .imageUrl as string;
        console.log("반환된 이미지 URL (data.imageUrl):", imageUrl);
        return imageUrl;
      }

      // item.imageUrl 확인
      if (
        "item" in result &&
        typeof (result as { item: unknown }).item === "object" &&
        (result as { item: unknown }).item !== null &&
        "imageUrl" in ((result as { item: unknown }).item as object)
      ) {
        const imageUrl = (result as { item: { imageUrl: string } }).item
          .imageUrl as string;
        console.log("반환된 이미지 URL (item.imageUrl):", imageUrl);
        return imageUrl;
      }
    }

    console.error("예기치 않은 응답 형식:", result);
    return null;
  } catch (error) {
    console.error("이미지 업로드 중 예외 발생:", error);
    return null;
  }
}
