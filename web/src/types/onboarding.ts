export interface OnboardingData {
  displayName: string;
  username: string;
  bio: string;
  photo: File | null;
  discoverable: boolean;
  allowMessageRequests: boolean;
  receiveSupportiveMessages: boolean;
}