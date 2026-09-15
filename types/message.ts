export interface Message {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}