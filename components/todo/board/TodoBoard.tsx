"use client";

import { useState } from "react";
import { toast } from "sonner";
import AddItemBar from "./AddItemBar";
import DoneSection from "./DoneSection";
import TodoSection from "./TodoSection";
import styles from "./TodoBoard.module.css";
import type { TodoItem } from "@/types/todo";
import { createTodoItem, updateTodoItem } from "@/lib/todo-api";

type TodoBoardProps = {
  initialItems: TodoItem[];
  tenantId: string;
  pageSize: number;
};

export default function TodoBoard({
  initialItems,
  tenantId,
  pageSize,
}: TodoBoardProps) {
  // 목록 데이터와 UI 상호작용(입력/페이지/요청중 상태)을 한 곳에서 관리한다.
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
    // 서버 응답 전 임시 항목은 음수 ID로 구분한다.
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

    // 생성은 optimistic update로 먼저 반영하고 실패 시 롤백한다.
    setIsAdding(true);
    const optimisticItem = createOptimisticItem(name);

    setItems((prev) => [optimisticItem, ...prev]);
    setUpdatingIds((prev) => [...prev, optimisticItem.id]);
    setDraftName("");
    setTodoPage(1);

    try {
      const createdItem = await createTodoItem(tenantId, name);

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

    // 완료 토글도 optimistic update 후 실패 시 원상복구한다.
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
      const updated = await updateTodoItem(tenantId, item.id, {
        isCompleted: nextCompleted,
      });

      if (!updated) {
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
