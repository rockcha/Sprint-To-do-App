import { getTodoItems } from "@/lib/todo-api";
import TodoBoard from "@/components/todo/board/TodoBoard";
import styles from "./page.module.css";

// 홈은 항상 최신 목록을 보여주기 위해 동적 렌더링을 사용한다.
export const dynamic = "force-dynamic";

const TENANT_ID = process.env.TENANT_ID;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const INITIAL_FETCH_SIZE = 80;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

type HomeProps = {
  searchParams: Promise<{
    pageSize?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  if (!TENANT_ID) {
    throw new Error("TENANT_ID is not set. Check your .env.local file.");
  }

  const query = await searchParams;
  const pageSize = parsePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE);

  // 초기 진입 시 필요한 양만 먼저 가져오고, 이후 상호작용은 클라이언트 상태로 처리한다.
  const items = await getTodoItems(TENANT_ID, DEFAULT_PAGE, INITIAL_FETCH_SIZE);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <TodoBoard
          initialItems={items}
          tenantId={TENANT_ID}
          pageSize={pageSize}
        />
      </div>
    </main>
  );
}
