import type { BookStatus } from "@/lib/domain/constants";

export type Visibility = "public" | "private";

export type User = {
  id: string;
  email: string;
  name: string;
  timezone: string;
  profile_visibility: Visibility;
  stats_visibility: boolean;
  book_titles_visibility: boolean;
  taste_profile_summary: string | null;
  taste_profile_updated_at: string | null;
  onboarding_completed?: boolean | null;
  created_at: string;
  updated_at: string;
};

export type Book = {
  id: string;
  google_books_id: string;
  title: string;
  author: string | string[];
  thumbnail_url: string | null;
  published_date: string | null;
  created_at: string;
};

export type UserBook = {
  id: string;
  user_id: string;
  book_id: string;
  status: BookStatus;
  is_past_book: boolean;
  user_defined_total_pages: number | null;
  rating: number | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReadingSession = {
  id: string;
  user_id: string;
  user_book_id: string;
  book_id: string;
  date: string;
  pages_read: number;
  time_minutes: number;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
};

export type Reflection = {
  id: string;
  user_id: string;
  reading_session_id: string;
  question_1: string | null;
  question_2: string | null;
  question_3: string | null;
  question_4: string | null;
  question_5: string | null;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  user_id: string;
  user_book_id: string;
  book_id: string;
  text: string;
  created_at: string;
  updated_at: string;
};

export type AIRecommendation = {
  id: string;
  user_id: string;
  generated_at: string;
  created_at: string;
};

export type AIRecommendationItem = {
  id: string;
  recommendation_id: string;
  book_title: string;
  book_author: string | null;
  explanation: string;
  position: 1 | 2 | 3;
};
