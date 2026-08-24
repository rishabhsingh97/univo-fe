export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationUnreadCountResponse {
  count: number;
}
