export type PanelColumn = {
  name: string;
  type: string;
  nullable: boolean;
  readonly: boolean;
};

export type RelationOption = {
  id: string;
  label: string;
  parentId: string | null;
};

export type PanelList = {
  columns: PanelColumn[];
  pk: string;
  data: Record<string, unknown>[];
  meta: { total: number; page: number; limit: number; total_pages: number };
  readonly: boolean;
  filters: Record<string, RelationOption[]>;
  relations?: Record<string, RelationOption[]>;
};

export type PanelRecord = {
  columns: PanelColumn[];
  pk: string;
  row: Record<string, unknown> | null;
  readonly: boolean;
  relations: Record<string, RelationOption[]>;
};
