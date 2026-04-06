import { getTodoItemById } from "@/lib/todo-api";
import DetailTodo from "@/components/todo/detail/DetailTodo";

const TENANT_ID = process.env.TENANT_ID;

export default async function DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 서버에서 tenant 환경값을 강제해 배포 환경 누락을 조기에 감지한다.
  if (!TENANT_ID) {
    throw new Error(
      "TENANT_ID is not set. Check deployment environment variables.",
    );
  }

  const { id } = await params;
  const itemId = parseInt(id, 10);

  if (Number.isNaN(itemId)) {
    return <div>잘못된 ID입니다.</div>;
  }

  // optimistic create로 생기는 임시(음수) ID는 상세 조회 대상이 아니다.
  if (itemId <= 0) {
    return <div>아직 저장 중인 항목입니다. 잠시 후 다시 시도해주세요.</div>;
  }

  const item = await getTodoItemById(TENANT_ID, itemId);

  if (!item) {
    return <div>할 일을 찾을 수 없습니다.</div>;
  }

  return <DetailTodo initialItem={item} tenantId={TENANT_ID} />;
}
