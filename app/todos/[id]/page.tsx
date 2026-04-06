import { getTodoItemById } from "@/lib/todo-api";
import DetailTodo from "@/components/todo/detail/DetailTodo";

const TENANT_ID = process.env.TENANT_ID;

export default async function DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!TENANT_ID) {
    throw new Error(
      "TENANT_ID is not set. Check deployment environment variables.",
    );
  }

  const { id } = await params;
  const itemId = parseInt(id, 10);

  if (isNaN(itemId)) {
    return <div>잘못된 ID입니다.</div>;
  }

  const item = await getTodoItemById(TENANT_ID, itemId);

  if (!item) {
    return <div>할 일을 찾을 수 없습니다.</div>;
  }

  return <DetailTodo initialItem={item} tenantId={TENANT_ID} />;
}
