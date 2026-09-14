export interface AuthorSummary {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
}

export interface PrayerRequest {
  id: string;
  content: string;
  isAnswered: boolean;
  answeredNote: string | null;
  answeredAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: AuthorSummary;
}

export interface PrayerText {
  id: string;
  title: string;
  content: string;
  meetingDate: string;
  createdAt: string;
  updatedAt: string;
  author: AuthorSummary;
}
