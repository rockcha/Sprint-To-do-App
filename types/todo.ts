export type TodoItem = {
  id: number;
  tenantId?: string;
  name: string;
  memo?: string | null;
  imageUrl?: string | null;
  isCompleted: boolean;
};

export type TodoListPageResult = {
  items: TodoItem[];
  page: number;
  pageSize: number;
  hasNext: boolean;
};
