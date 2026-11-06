

export interface Profile {
  username: string;
  displayName: string;
  bio: string;
  email: string;
  photoUrl: string | null;
  acceptsComforts: boolean; // the person's "receive supportive messages" choice
}