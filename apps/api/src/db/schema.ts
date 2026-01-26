import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  pgEnum,
  index,
  jsonb,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const creatorTierEnum = pgEnum("creator_tier", ["starter", "pro", "elite"]);
export const messageTypeEnum = pgEnum("message_type", ["dm", "community"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "purchase",
  "message",
  "course_update",
  "referral_earning",
  "system",
]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "reviewed", "resolved", "dismissed"]);
export const reportTypeEnum = pgEnum("report_type", ["course", "user", "message"]);
export const feedbackDifficultyEnum = pgEnum("feedback_difficulty", ["too_easy", "just_right", "too_hard"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    address: text("address").notNull().unique(),
    username: text("username"),
    avatar: text("avatar"),
    bio: text("bio"),
    socials: jsonb("socials").$type<{
      twitter?: string;
      github?: string;
      website?: string;
      linkedin?: string;
      youtube?: string;
      discord?: string;
    }>(),
    isCreator: boolean("is_creator").notNull().default(false),
    isVerified: boolean("is_verified").notNull().default(false),
    isAdmin: boolean("is_admin").notNull().default(false),
    isBanned: boolean("is_banned").notNull().default(false),
    bannedAt: timestamp("banned_at"),
    bannedReason: text("banned_reason"),
    creatorTier: creatorTierEnum("creator_tier"),
    creatorRegisteredAt: timestamp("creator_registered_at"),
    referralCode: text("referral_code").unique(),
    referredBy: uuid("referred_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("users_address_idx").on(table.address), index("users_referral_code_idx").on(table.referralCode)]
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    icon: text("icon"),
    color: text("color"),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("categories_slug_idx").on(table.slug)]
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    onChainId: integer("on_chain_id").unique(),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    thumbnail: text("thumbnail"),
    priceUsd: decimal("price_usd", { precision: 10, scale: 2 }).notNull(),
    isFree: boolean("is_free").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(false),
    isHidden: boolean("is_hidden").notNull().default(false),
    hiddenAt: timestamp("hidden_at"),
    hiddenReason: text("hidden_reason"),
    previewPercentage: integer("preview_percentage").notNull().default(5),
    metadataUri: text("metadata_uri"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("courses_creator_idx").on(table.creatorId), index("courses_on_chain_idx").on(table.onChainId)]
);

export const courseCategories = pgTable(
  "course_categories",
  {
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("course_categories_course_idx").on(table.courseId),
    index("course_categories_category_idx").on(table.categoryId),
  ]
);

export const chapters = pgTable(
  "chapters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    order: integer("order").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("chapters_course_idx").on(table.courseId),
    index("chapters_order_idx").on(table.courseId, table.order),
  ]
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content"),
    videoId: text("video_id"),
    videoDuration: integer("video_duration"),
    order: integer("order").notNull(),
    isPreview: boolean("is_preview").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("lessons_chapter_idx").on(table.chapterId),
    index("lessons_order_idx").on(table.chapterId, table.order),
  ]
);

export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id),
    txHash: text("tx_hash").notNull(),
    paidAmount: decimal("paid_amount", { precision: 20, scale: 8 }).notNull(),
    paymentToken: text("payment_token").notNull(),
    referrerId: uuid("referrer_id").references(() => users.id),
    referralEarning: decimal("referral_earning", { precision: 20, scale: 8 }),
    purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
  },
  (table) => [
    index("purchases_user_idx").on(table.userId),
    index("purchases_course_idx").on(table.courseId),
    index("purchases_referrer_idx").on(table.referrerId),
  ]
);

export const chatRooms = pgTable(
  "chat_rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id").references(() => courses.id),
    type: messageTypeEnum("type").notNull(),
    participantOne: uuid("participant_one").references(() => users.id),
    participantTwo: uuid("participant_two").references(() => users.id),
    lastMessageAt: timestamp("last_message_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("chat_rooms_course_idx").on(table.courseId),
    index("chat_rooms_participants_idx").on(table.participantOne, table.participantTwo),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => chatRooms.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("messages_room_idx").on(table.roomId), index("messages_sender_idx").on(table.senderId)]
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    data: jsonb("data"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("notifications_user_idx").on(table.userId), index("notifications_unread_idx").on(table.userId, table.isRead)]
);

export const referralStats = pgTable(
  "referral_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id)
      .unique(),
    totalReferrals: integer("total_referrals").notNull().default(0),
    totalEarningsUsd: decimal("total_earnings_usd", { precision: 20, scale: 8 }).notNull().default("0"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("referral_stats_user_idx").on(table.userId)]
);

export const creatorStats = pgTable(
  "creator_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id)
      .unique(),
    coursesCount: integer("courses_count").notNull().default(0),
    studentsCount: integer("students_count").notNull().default(0),
    totalEarningsUsd: decimal("total_earnings_usd", { precision: 20, scale: 8 }).notNull().default("0"),
    points: integer("points").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("creator_stats_user_idx").on(table.userId),
    index("creator_stats_points_idx").on(table.points),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refreshToken: text("refresh_token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("sessions_user_idx").on(table.userId), index("sessions_token_idx").on(table.refreshToken)]
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id),
    reportType: reportTypeEnum("report_type").notNull(),
    targetCourseId: uuid("target_course_id").references(() => courses.id),
    targetUserId: uuid("target_user_id").references(() => users.id),
    targetMessageId: uuid("target_message_id").references(() => messages.id),
    reason: text("reason").notNull(),
    description: text("description"),
    status: reportStatusEnum("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("reports_reporter_idx").on(table.reporterId),
    index("reports_status_idx").on(table.status),
    index("reports_type_idx").on(table.reportType),
  ]
);

export const usersRelations = relations(users, ({ many, one }) => ({
  courses: many(courses),
  purchases: many(purchases),
  notifications: many(notifications),
  sessions: many(sessions),
  referralStats: one(referralStats, {
    fields: [users.id],
    references: [referralStats.userId],
  }),
  creatorStats: one(creatorStats, {
    fields: [users.id],
    references: [creatorStats.userId],
  }),
  referrer: one(users, {
    fields: [users.referredBy],
    references: [users.id],
  }),
}));

export const creatorStatsRelations = relations(creatorStats, ({ one }) => ({
  user: one(users, {
    fields: [creatorStats.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  courseCategories: many(courseCategories),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  creator: one(users, {
    fields: [courses.creatorId],
    references: [users.id],
  }),
  chapters: many(chapters),
  purchases: many(purchases),
  chatRoom: one(chatRooms),
  courseCategories: many(courseCategories),
}));

export const courseCategoriesRelations = relations(courseCategories, ({ one }) => ({
  course: one(courses, {
    fields: [courseCategories.courseId],
    references: [courses.id],
  }),
  category: one(categories, {
    fields: [courseCategories.categoryId],
    references: [categories.id],
  }),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  course: one(courses, {
    fields: [chapters.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  chapter: one(chapters, {
    fields: [lessons.chapterId],
    references: [chapters.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [purchases.courseId],
    references: [courses.id],
  }),
  referrer: one(users, {
    fields: [purchases.referrerId],
    references: [users.id],
  }),
}));

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  course: one(courses, {
    fields: [chatRooms.courseId],
    references: [courses.id],
  }),
  messages: many(messages),
  participantOneUser: one(users, {
    fields: [chatRooms.participantOne],
    references: [users.id],
  }),
  participantTwoUser: one(users, {
    fields: [chatRooms.participantTwo],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  room: one(chatRooms, {
    fields: [messages.roomId],
    references: [chatRooms.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
  }),
  targetCourse: one(courses, {
    fields: [reports.targetCourseId],
    references: [courses.id],
  }),
  targetUser: one(users, {
    fields: [reports.targetUserId],
    references: [users.id],
  }),
  targetMessage: one(messages, {
    fields: [reports.targetMessageId],
    references: [messages.id],
  }),
  reviewer: one(users, {
    fields: [reports.reviewedBy],
    references: [users.id],
  }),
}));

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id),
    lessonId: uuid("lesson_id").references(() => lessons.id),
    clarity: integer("clarity").notNull(),
    usefulness: integer("usefulness").notNull(),
    engagement: integer("engagement").notNull(),
    difficulty: feedbackDifficultyEnum("difficulty").notNull(),
    wouldRecommend: boolean("would_recommend").notNull(),
    generalFeedback: text("general_feedback"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("feedback_user_idx").on(table.userId),
    index("feedback_course_idx").on(table.courseId),
  ]
);

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [feedback.courseId],
    references: [courses.id],
  }),
  lesson: one(lessons, {
    fields: [feedback.lessonId],
    references: [lessons.id],
  }),
}));

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at").notNull().defaultNow(),
  },
  (table) => [
    index("lesson_progress_user_idx").on(table.userId),
    index("lesson_progress_lesson_idx").on(table.lessonId),
    index("lesson_progress_course_idx").on(table.courseId),
    index("lesson_progress_user_course_idx").on(table.userId, table.courseId),
  ]
);

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  user: one(users, {
    fields: [lessonProgress.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [lessonProgress.lessonId],
    references: [lessons.id],
  }),
  course: one(courses, {
    fields: [lessonProgress.courseId],
    references: [courses.id],
  }),
}));
