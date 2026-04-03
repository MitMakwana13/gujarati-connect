export type UserProfile = {
  id: string;
  name: string;
  profession: string;
  native_city: string;
  photo_url: string;
};

export type MessageType = {
  id: number;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};
