"use client";

import Image from "next/image";
import styles from "./AddItemBar.module.css";

type AddItemBarProps = {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  isSubmitting?: boolean;
};

export default function AddItemBar({
  value,
  onChange,
  onAdd,
  isSubmitting = false,
}: AddItemBarProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inputShell}>
        <input
          type="text"
          className={styles.input}
          placeholder="할 일을 입력하세요"
          aria-label="할 일 입력"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            // 입력창에서도 Enter로 즉시 추가할 수 있도록 처리한다.
            if (event.key === "Enter") {
              event.preventDefault();
              onAdd();
            }
          }}
          disabled={isSubmitting}
        />
      </div>

      <button
        type="button"
        className={styles.addButton}
        aria-label="할 일 추가"
        onClick={onAdd}
        disabled={isSubmitting}
      >
        <Image
          src="/add-btn.png"
          alt="추가하기"
          fill
          sizes="(max-width: 1023px) 162px, 168px"
          className={styles.desktopAdd}
          priority
        />
        <Image
          src="/add-btn-small.png"
          alt="추가하기"
          fill
          sizes="56px"
          className={styles.mobileAdd}
          priority
        />
      </button>
    </div>
  );
}
