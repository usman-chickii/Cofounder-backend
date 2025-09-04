export interface UserIntegration {
  id: string;
  user_id: string;
  service_name: string;
  status: string;
  auth_token: string | null;
}
