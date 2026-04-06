"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./TodoBoard.module.css";
import type { TodoItem } from "@/types/todo";

type TodoSectionProps = {
  items: TodoItem[];
  pagedItems: TodoItem[];
  currentPage: number;
  totalPages: number;
  updatingIds: number[];
  onToggle: (item: TodoItem) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export default function TodoSection({
  items,
  pagedItems,
  currentPage,
  totalPages,
  updatingIds,
  onToggle,
  onPrevPage,
  onNextPage,
}: TodoSectionProps) {
  const router = useRouter();

  const handleGoDetail = (item: TodoItem) => {
    if (item.id <= 0 || updatingIds.includes(item.id)) {
      return;
    }
    router.push(`/todos/${item.id}`);
  };

  return (
    <section className={styles.sectionCard}>
      <header className={styles.sectionHeader}>
        <Image
          src="/todo.png"
          alt="Todo"
          width={95}
          height={36}
          className={styles.sectionTitleImage}
          priority
        />
      </header>

      <div className={styles.sectionContent}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyWrap}>
              <Image
                src="/todo-empty.png"
                alt="할 일 없음"
                width={228}
                height={180}
                className={styles.emptyDesktop}
              />
              <Image
                src="/todo-empty-small.png"
                alt="할 일 없음"
                width={180}
                height={140}
                className={styles.emptyMobile}
              />
            </div>
            <p className={styles.emptyText}>
              할 일이 없어요.. <br />
              TODO를 새롭게 추가해주세요!
            </p>
          </div>
        ) : (
          <ul className={styles.list}>
            {pagedItems.map((item) => (
              <li key={item.id} className={styles.listItem}>
                <div
                  className={styles.itemRow}
                  onClick={() => handleGoDetail(item)}
                  onMouseEnter={() => {
                    if (item.id > 0) {
                      router.prefetch(`/todos/${item.id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleGoDetail(item);
                    }
                  }}
                >
                  <button
                    type="button"
                    className={styles.checkboxButton}
                    aria-label={`${item.name} 완료 상태 변경`}
                    aria-pressed={item.isCompleted}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(item);
                    }}
                    disabled={updatingIds.includes(item.id)}
                  >
                    <Image
                      src={
                        item.isCompleted
                          ? "/checkbox-checked.png"
                          : "/checkbox-unchecked.png"
                      }
                      alt=""
                      width={30}
                      height={30}
                      className={styles.checkboxImage}
                    />
                  </button>
                  <span className={styles.itemName}>{item.name}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <nav
          className={styles.sectionPagination}
          aria-label="Todo 페이지네이션"
        >
          <button
            type="button"
            className={styles.pageButton}
            onClick={onPrevPage}
            disabled={currentPage === 1}
          >
            이전
          </button>

          <span className={styles.pageIndicator}>
            페이지 {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            className={styles.pageButton}
            onClick={onNextPage}
            disabled={currentPage === totalPages}
          >
            다음
          </button>
        </nav>
      )}
    </section>
  );
}
