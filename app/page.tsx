import { getTodoItemsPage } from "@/lib/todo-api";
import TodoBoard from "@/components/TodoBoard";
import styles from "./page.module.css";

const TENANT_ID = process.env.TENANT_ID;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

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

  const { items } = await getTodoItemsPage(TENANT_ID, DEFAULT_PAGE, 200);

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
