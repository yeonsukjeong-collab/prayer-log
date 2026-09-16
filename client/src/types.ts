export interface AuthorSummary {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  isLeader: boolean;
  isAdmin: boolean;
}

export interface Member {
  id: string;
  name: string;
}

export interface PrayerRequest {
  id: string;
  content: string;
  requestDate: string;
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

export interface PhotoSummary {
  id: string;
  caption: string | null;
  photoDate: string;
  thumbnailData: string;
  createdAt: string;
  author: AuthorSummary;
}

export interface PhotoDetail extends PhotoSummary {
  imageData: string;
}
