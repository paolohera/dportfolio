export interface Service {
  id: string;
  number: string;
  title: string;
  description: string;
  tags: string[];
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export type ServiceDraft = Omit<Service, "id" | "created_at" | "updated_at">;