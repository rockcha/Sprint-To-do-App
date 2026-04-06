"use client";

import { useState } from "react";
import { toast } from "sonner";
import AddItemBar from "./AddItemBar";
import DoneSection from "./DoneSection";
import TodoSection from "./TodoSection";
import styles from "./TodoBoard.module.css";
import type { TodoItem } from "@/types/todo";

type TodoBoardProps = {
  initialItems: TodoItem[];
  tenantId: string;
  pageSize: number;
};

function isTodoItem(data: unknown): data is TodoItem {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "name" in data &&
    "isCompleted" in data
  );
}

function extractItem(data: unknown): TodoItem | null {
  if (isTodoItem(data)) {
    return data;
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "item" in data &&
    isTodoItem((data as { item: unknown }).item)
  ) {
    return (data as { item: TodoItem }).item;
  }

  return null;
}

export default function TodoBoard({
  initialItems,
  tenantId,
  pageSize,
}: TodoBoardProps) {
  const [items, setItems] = useState<TodoItem[]>(initialItems);
  const [draftName, setDraftName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<number[]>([]);
  const [todoPage, setTodoPage] = useState(1);
  const [donePage, setDonePage] = useState(1);

  const todoItems = items.filter((item) => !item.isCompleted);
  const doneItems = items.filter((item) => item.isCompleted);
  const safePageSize = Math.max(1, pageSize);

  const todoTotalPages = Math.max(
    1,
    Math.ceil(todoItems.length / safePageSize),
  );
  const doneTotalPages = Math.max(
    1,
    Math.ceil(doneItems.length / safePageSize),
  );
  const currentTodoPage = Math.min(todoPage, todoTotalPages);
  const currentDonePage = Math.min(donePage, doneTotalPages);

  const pagedTodoItems = todoItems.slice(
    (currentTodoPage - 1) * safePageSize,
    currentTodoPage * safePageSize,
  );
  const pagedDoneItems = doneItems.slice(
    (currentDonePage - 1) * safePageSize,
    currentDonePage * safePageSize,
  );

  function createOptimisticItem(name: string): TodoItem {
    return {
      id: -Date.now(),
      tenantId,
      name,
      memo: null,
      imageUrl: null,
      isCompleted: false,
    };
  }

  async function handleAdd() {
    const name = draftName.trim();

    if (!name || isAdding) {
      return;
    }

    setIsAdding(true);
    const optimisticItem = createOptimisticItem(name);

    setItems((prev) => [optimisticItem, ...prev]);
    setUpdatingIds((prev) => [...prev, optimisticItem.id]);
    setDraftName("");
    setTodoPage(1);

    try {
      const response = await fetch(
        `https://assignment-todolist-api.vercel.app/api/${tenantId}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("add-failed");
      }

      const payload = (await response.json()) as unknown;
      const createdItem = extractItem(payload);

      if (!createdItem) {
        throw new Error("invalid-create-response");
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === optimisticItem.id ? createdItem : item,
        ),
      );
      toast.success("추가되었습니다.");
    } catch {
      setItems((prev) => prev.filter((item) => item.id !== optimisticItem.id));
      setDraftName(name);
      toast.error("추가에 실패했습니다.");
    } finally {
      setUpdatingIds((prev) => prev.filter((id) => id !== optimisticItem.id));
      setIsAdding(false);
    }
  }

  async function handleToggle(item: TodoItem) {
    if (updatingIds.includes(item.id)) {
      return;
    }

    const nextCompleted = !item.isCompleted;
    setUpdatingIds((prev) => [...prev, item.id]);
    setItems((prev) =>
      prev.map((current) =>
        current.id === item.id
          ? {
              ...current,
              isCompleted: nextCompleted,
            }
          : current,
      ),
    );

    try {
      const endpoint = `https://assignment-todolist-api.vercel.app/api/${tenantId}/items/${item.id}`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isCompleted: nextCompleted }),
      });

      if (!response.ok) {
        throw new Error("update-failed");
      }

      toast.success("수정되었습니다.");
    } catch {
      setItems((prev) =>
        prev.map((current) =>
          current.id === item.id
            ? {
                ...current,
                isCompleted: item.isCompleted,
              }
            : current,
        ),
      );
      toast.error("수정에 실패했습니다.");
    } finally {
      setUpdatingIds((prev) => prev.filter((id) => id !== item.id));
    }
  }

  return (
    <>
      <div className={styles.addBarWrap}>
        <AddItemBar
          value={draftName}
          onChange={setDraftName}
          onAdd={handleAdd}
          isSubmitting={isAdding}
        />
      </div>

      <div className={styles.sections}>
        <TodoSection
          items={todoItems}
          pagedItems={pagedTodoItems}
          currentPage={currentTodoPage}
          totalPages={todoTotalPages}
          updatingIds={updatingIds}
          onToggle={(item) => void handleToggle(item)}
          onPrevPage={() => setTodoPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() =>
            setTodoPage((prev) => Math.min(todoTotalPages, prev + 1))
          }
        />

        <DoneSection
          items={doneItems}
          pagedItems={pagedDoneItems}
          currentPage={currentDonePage}
          totalPages={doneTotalPages}
          updatingIds={updatingIds}
          onToggle={(item) => void handleToggle(item)}
          onPrevPage={() => setDonePage((prev) => Math.max(1, prev - 1))}
          onNextPage={() =>
            setDonePage((prev) => Math.min(doneTotalPages, prev + 1))
          }
        />
      </div>
    </>
  );
}
