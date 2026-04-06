"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { updateTodoItem, deleteTodoItem } from "@/lib/todo-api";
import type { TodoItem } from "@/types/todo";
import styles from "./DetailTodo.module.css";

type DetailTodoProps = {
  initialItem: TodoItem;
  tenantId: string;
};

function sanitizeImageUrl(url?: string | null): string {
  if (!url || url.startsWith("blob:")) {
    return "";
  }
  return url;
}

function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.floor((base64.length * 3) / 4);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("file-read-failed"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image-load-failed"));
    img.src = src;
  });
}

async function compressImageForPatch(file: File): Promise<string | null> {
  const sourceDataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(sourceDataUrl);

  const MAX_DIMENSION = 1280;
  const MAX_PATCH_BYTES = 900 * 1024;

  const ratio = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const targetWidth = Math.max(1, Math.round(img.width * ratio));
  const targetHeight = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.drawImage(img, 0, 0, targetWidth, targetHeight);

  let quality = 0.82;
  let output = canvas.toDataURL("image/jpeg", quality);

  while (estimateDataUrlBytes(output) > MAX_PATCH_BYTES && quality > 0.35) {
    quality -= 0.1;
    output = canvas.toDataURL("image/jpeg", quality);
  }

  if (estimateDataUrlBytes(output) > MAX_PATCH_BYTES) {
    return null;
  }

  return output;
}

export default function DetailTodo({ initialItem, tenantId }: DetailTodoProps) {
  const router = useRouter();
  const [item, setItem] = useState<TodoItem>(initialItem);
  const [title, setTitle] = useState(initialItem.name);
  const [memo, setMemo] = useState(initialItem.memo || "");
  const [isCompleted, setIsCompleted] = useState(initialItem.isCompleted);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(
    sanitizeImageUrl(initialItem.imageUrl),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleToggle = () => {
    setIsCompleted(!isCompleted);
  };

  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMemo(e.target.value);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일명 검증 (영어, 숫자, -, _, . 만 허용)
    const lastDotIndex = file.name.lastIndexOf(".");
    if (lastDotIndex === -1) {
      toast.error("파일명에 확장자가 없습니다.");
      return;
    }

    const fileNameWithoutExt = file.name.substring(0, lastDotIndex);
    const fileExt = file.name.substring(lastDotIndex + 1).toLowerCase();
    const englishFileNameRegex = /^[a-zA-Z0-9_\-]+$/;

    if (!englishFileNameRegex.test(fileNameWithoutExt)) {
      toast.error(
        "파일명은 영어, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능합니다.",
      );
      return;
    }

    // 이미지 확장자 검증
    const validImageExts = ["jpg", "jpeg", "png", "gif", "webp"];
    if (!validImageExts.includes(fileExt)) {
      toast.error("지원하는 이미지 형식: JPG, PNG, GIF, WEBP");
      return;
    }

    // 파일 크기 검증 (5MB 제한)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error("이미지는 5MB 이하여야 합니다.");
      return;
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    toast.success("이미지가 선택되었습니다. 수정완료를 눌러주세요.");
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("할 일 제목을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      let uploadedImageUrl: string | null = null;
      if (imageFile) {
        const newImageUrl = await compressImageForPatch(imageFile);
        if (!newImageUrl || !newImageUrl.startsWith("data:image/")) {
          toast.error(
            "이미지 용량이 커서 저장할 수 없습니다. 더 작은 이미지를 선택해주세요.",
          );
          return;
        }

        uploadedImageUrl = newImageUrl;
        setImageUrl(newImageUrl);
      }

      const updateData: Partial<TodoItem> = {
        name: trimmedTitle,
        isCompleted,
        memo: memo || undefined,
        ...(uploadedImageUrl && { imageUrl: uploadedImageUrl }),
      };

      const updated = await updateTodoItem(tenantId, item.id, updateData);

      if (updated) {
        setItem(updated);
        toast.success("수정 완료되었습니다!");
        router.replace(`/?refresh=${Date.now()}`);
        router.refresh();
      } else {
        toast.error("수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말로 삭제하시겠습니까?")) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await deleteTodoItem(tenantId, item.id);

      if (success) {
        toast.success("삭제되었습니다!");
        router.replace(`/?refresh=${Date.now()}`);
        router.refresh();
      } else {
        toast.error("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* 상단 제목 아이템 */}
        <div
          className={`${styles.titleItem} ${
            isCompleted ? styles.titleItemCompleted : ""
          }`}
        >
          <div className={styles.titleContent}>
            <button
              className={styles.checkboxButton}
              onClick={handleToggle}
              disabled={isLoading}
            >
              <Image
                src={
                  isCompleted
                    ? "/checkbox-checked.png"
                    : "/checkbox-unchecked.png"
                }
                alt={isCompleted ? "완료" : "미완료"}
                width={32}
                height={32}
                priority
              />
            </button>
            <input
              type="text"
              className={styles.titleInput}
              value={title}
              onChange={handleTitleChange}
              disabled={isLoading}
              maxLength={100}
              aria-label="할 일 제목"
            />
          </div>
        </div>

        {/* 이미지 + 메모 영역 */}
        <div className={styles.contentArea}>
          {/* 이미지 섹션 */}
          <div className={styles.imageSection}>
            <div
              className={`${styles.imageWrapper} ${
                !imageUrl ? styles.imageWrapperEmpty : ""
              }`}
            >
              <Image
                src={imageUrl || "/fallback.png"}
                alt="할 일 이미지"
                width={300}
                height={300}
                className={styles.image}
              />
              <label className={styles.imageButton}>
                <Image
                  src={
                    imageUrl ? "/detail-edit-btn.png" : "/detail-add-btn.png"
                  }
                  alt={imageUrl ? "수정" : "추가"}
                  width={48}
                  height={48}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  hidden
                />
              </label>
            </div>
          </div>

          {/* 메모 섹션 */}
          <div className={styles.memoSection}>
            <textarea
              className={styles.memoInput}
              value={memo}
              onChange={handleMemoChange}
              placeholder="메모를 입력해주세요"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className={styles.buttonGroup}>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isLoading}
          >
            <Image
              src="/edit-complete-btn.png"
              alt="완료"
              width={120}
              height={48}
            />
          </button>
          <button
            className={styles.deleteButton}
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Image src="/delete-btn.png" alt="삭제" width={120} height={48} />
          </button>
        </div>
      </div>
    </div>
  );
}
