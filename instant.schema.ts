import { i } from "@instantdb/react";

const schema = i.schema({
  entities: {
    users: i.entity({
      email: i.string().indexed().unique(),
      name: i.string(),
      timezone: i.string(),
      profile_visibility: i.string(),
      stats_visibility: i.boolean(),
      book_titles_visibility: i.boolean(),
      taste_profile_summary: i.string().optional(),
      taste_profile_updated_at: i.date().optional(),
      onboarding_completed: i.boolean().optional(),
      created_at: i.date(),
      updated_at: i.date(),
    }),
    books: i.entity({
      google_books_id: i.string().indexed().unique(),
      title: i.string(),
      author: i.json(),
      thumbnail_url: i.string().optional(),
      published_date: i.string().optional(),
      created_at: i.date(),
    }),
    user_books: i.entity({
      status: i.string().indexed(),
      is_past_book: i.boolean().indexed(),
      user_defined_total_pages: i.number().optional(),
      rating: i.number().optional(),
      finished_at: i.date().optional(),
      created_at: i.date(),
      updated_at: i.date(),
    }),
    reading_sessions: i.entity({
      date: i.date().indexed(),
      pages_read: i.number(),
      time_minutes: i.number(),
      start_time: i.date().optional(),
      end_time: i.date().optional(),
      created_at: i.date(),
      updated_at: i.date(),
    }),
    reflections: i.entity({
      question_1: i.string().optional(),
      question_2: i.string().optional(),
      question_3: i.string().optional(),
      question_4: i.string().optional(),
      question_5: i.string().optional(),
      created_at: i.date(),
      updated_at: i.date(),
    }),
    reviews: i.entity({
      text: i.string(),
      created_at: i.date(),
      updated_at: i.date(),
    }),
    ai_recommendations: i.entity({
      generated_at: i.date().indexed(),
      created_at: i.date(),
      owner_user_id: i.string().indexed(),
      taste_profile_summary: i.string().optional(),
    }),
    ai_recommendation_items: i.entity({
      book_title: i.string(),
      book_author: i.string().optional(),
      explanation: i.string(),
      position: i.number().indexed(),
      // Recommendation enrichment for rendering covers + better matching.
      google_books_id: i.string().optional(),
      thumbnail_url: i.string().optional(),
      published_date: i.string().optional(),
      book_authors_csv: i.string().optional(),
      // Helper fields used for stable queries in dev.
      recommendation_id: i.string().indexed(),
      owner_user_id: i.string().indexed(),
    }),
  },
  links: {
    user_user_books: {
      forward: { on: "users", has: "many", label: "user_books" },
      reverse: { on: "user_books", has: "one", label: "user" },
    },
    book_user_books: {
      forward: { on: "books", has: "many", label: "user_books" },
      reverse: { on: "user_books", has: "one", label: "book" },
    },
    user_reading_sessions: {
      forward: { on: "users", has: "many", label: "reading_sessions" },
      reverse: { on: "reading_sessions", has: "one", label: "user" },
    },
    book_reading_sessions: {
      forward: { on: "books", has: "many", label: "reading_sessions" },
      reverse: { on: "reading_sessions", has: "one", label: "book" },
    },
    user_book_reading_sessions: {
      forward: { on: "user_books", has: "many", label: "reading_sessions" },
      reverse: { on: "reading_sessions", has: "one", label: "user_book" },
    },
    user_reflections: {
      forward: { on: "users", has: "many", label: "reflections" },
      reverse: { on: "reflections", has: "one", label: "user" },
    },
    session_reflection: {
      forward: { on: "reading_sessions", has: "one", label: "reflection" },
      reverse: { on: "reflections", has: "one", label: "reading_session" },
    },
    user_reviews: {
      forward: { on: "users", has: "many", label: "reviews" },
      reverse: { on: "reviews", has: "one", label: "user" },
    },
    book_reviews: {
      forward: { on: "books", has: "many", label: "reviews" },
      reverse: { on: "reviews", has: "one", label: "book" },
    },
    user_book_review: {
      forward: { on: "user_books", has: "one", label: "review" },
      reverse: { on: "reviews", has: "one", label: "user_book" },
    },
    user_recommendations: {
      forward: { on: "users", has: "many", label: "ai_recommendations" },
      reverse: { on: "ai_recommendations", has: "one", label: "user" },
    },
    recommendation_items: {
      forward: { on: "ai_recommendations", has: "many", label: "items" },
      reverse: { on: "ai_recommendation_items", has: "one", label: "recommendation" },
    },
  },
});

export default schema;
