import { Hono } from "hono";
import { db } from "../db";
import {
  analyticsEvents,
  courses,
  purchases,
  lessonProgress,
  chapters,
  lessons,
  chatRooms,
  messages,
  users,
} from "../db/schema";
import { eq, and, sql, desc, gte, count, countDistinct } from "drizzle-orm";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";

const app = new Hono();

// Track analytics event (public - uses session ID for anonymous users)
app.post("/track", optionalAuthMiddleware, async (c) => {
  const body = await c.req.json();
  const { eventType, courseId, chapterId, lessonId, sessionId, metadata } = body;
  const userId = c.get("userId");

  if (!eventType) {
    return c.json({ error: "eventType is required" }, 400);
  }

  const validEventTypes = ["course_view", "chapter_view", "lesson_view", "course_purchase", "chat_join"];
  if (!validEventTypes.includes(eventType)) {
    return c.json({ error: "Invalid event type" }, 400);
  }

  try {
    await db.insert(analyticsEvents).values({
      eventType,
      userId: userId || null,
      courseId: courseId || null,
      chapterId: chapterId || null,
      lessonId: lessonId || null,
      sessionId: sessionId || null,
      metadata: metadata || null,
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Error tracking analytics:", error);
    return c.json({ error: "Failed to track event" }, 500);
  }
});

// Get creator analytics dashboard (authenticated creators only)
app.get("/creator/dashboard", authMiddleware, async (c) => {
  const userId = c.get("userId");

  // Get all courses by this creator
  const creatorCourses = await db
    .select({
      id: courses.id,
      title: courses.title,
      priceUsd: courses.priceUsd,
      isFree: courses.isFree,
      isPublished: courses.isPublished,
      createdAt: courses.createdAt,
    })
    .from(courses)
    .where(eq(courses.creatorId, userId));

  if (creatorCourses.length === 0) {
    return c.json({
      courses: [],
      totalStats: {
        totalRevenue: 0,
        totalStudents: 0,
        totalCourseViews: 0,
        overallConversionRate: 0,
      },
    });
  }

  const courseIds = creatorCourses.map((course) => course.id);

  // Get aggregated stats for all courses
  const [totalPurchases] = await db
    .select({
      count: count(),
      totalRevenue: sql<string>`COALESCE(SUM(${purchases.paidAmount}), 0)`,
    })
    .from(purchases)
    .where(sql`${purchases.courseId} IN ${courseIds}`);

  // Get unique students count
  const [uniqueStudents] = await db
    .select({
      count: countDistinct(purchases.userId),
    })
    .from(purchases)
    .where(sql`${purchases.courseId} IN ${courseIds}`);

  // Get total course views
  const [totalViews] = await db
    .select({
      count: count(),
    })
    .from(analyticsEvents)
    .where(
      and(
        sql`${analyticsEvents.courseId} IN ${courseIds}`,
        eq(analyticsEvents.eventType, "course_view")
      )
    );

  // Calculate overall conversion rate
  const viewCount = totalViews?.count || 0;
  const purchaseCount = totalPurchases?.count || 0;
  const overallConversionRate = viewCount > 0 ? (purchaseCount / viewCount) * 100 : 0;

  // Get per-course stats
  const coursesWithStats = await Promise.all(
    creatorCourses.map(async (course) => {
      // Course views
      const [courseViews] = await db
        .select({ count: count() })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.courseId, course.id),
            eq(analyticsEvents.eventType, "course_view")
          )
        );

      // Purchases for this course
      const [coursePurchases] = await db
        .select({
          count: count(),
          revenue: sql<string>`COALESCE(SUM(${purchases.paidAmount}), 0)`,
        })
        .from(purchases)
        .where(eq(purchases.courseId, course.id));

      // Unique students
      const [courseStudents] = await db
        .select({ count: countDistinct(purchases.userId) })
        .from(purchases)
        .where(eq(purchases.courseId, course.id));

      // Lesson completion stats
      const [lessonCompletions] = await db
        .select({ count: count() })
        .from(lessonProgress)
        .where(eq(lessonProgress.courseId, course.id));

      // Get chapter stats
      const courseChapters = await db
        .select({
          id: chapters.id,
          title: chapters.title,
          order: chapters.order,
        })
        .from(chapters)
        .where(eq(chapters.courseId, course.id))
        .orderBy(chapters.order);

      const chaptersWithStats = await Promise.all(
        courseChapters.map(async (chapter) => {
          const [chapterViews] = await db
            .select({ count: count() })
            .from(analyticsEvents)
            .where(
              and(
                eq(analyticsEvents.chapterId, chapter.id),
                eq(analyticsEvents.eventType, "chapter_view")
              )
            );

          // Get lessons in chapter
          const chapterLessons = await db
            .select({
              id: lessons.id,
              title: lessons.title,
              order: lessons.order,
            })
            .from(lessons)
            .where(eq(lessons.chapterId, chapter.id))
            .orderBy(lessons.order);

          const lessonsWithStats = await Promise.all(
            chapterLessons.map(async (lesson) => {
              const [lessonViews] = await db
                .select({ count: count() })
                .from(analyticsEvents)
                .where(
                  and(
                    eq(analyticsEvents.lessonId, lesson.id),
                    eq(analyticsEvents.eventType, "lesson_view")
                  )
                );

              const [completions] = await db
                .select({ count: count() })
                .from(lessonProgress)
                .where(eq(lessonProgress.lessonId, lesson.id));

              return {
                ...lesson,
                views: lessonViews?.count || 0,
                completions: completions?.count || 0,
              };
            })
          );

          return {
            ...chapter,
            views: chapterViews?.count || 0,
            lessons: lessonsWithStats,
          };
        })
      );

      // Chat stats
      const [chatRoom] = await db
        .select({ id: chatRooms.id })
        .from(chatRooms)
        .where(eq(chatRooms.courseId, course.id));

      let chatStats = { messageCount: 0, activeParticipants: 0 };
      if (chatRoom) {
        const [msgStats] = await db
          .select({
            count: count(),
            participants: countDistinct(messages.senderId),
          })
          .from(messages)
          .where(eq(messages.roomId, chatRoom.id));

        chatStats = {
          messageCount: msgStats?.count || 0,
          activeParticipants: msgStats?.participants || 0,
        };
      }

      const views = courseViews?.count || 0;
      const purchasesCt = coursePurchases?.count || 0;
      const conversionRate = views > 0 ? (purchasesCt / views) * 100 : 0;

      return {
        ...course,
        stats: {
          views,
          purchases: purchasesCt,
          students: courseStudents?.count || 0,
          revenue: coursePurchases?.revenue || "0",
          conversionRate: Math.round(conversionRate * 100) / 100,
          lessonCompletions: lessonCompletions?.count || 0,
          chatStats,
        },
        chapters: chaptersWithStats,
      };
    })
  );

  return c.json({
    courses: coursesWithStats,
    totalStats: {
      totalRevenue: totalPurchases?.totalRevenue || "0",
      totalStudents: uniqueStudents?.count || 0,
      totalCourseViews: viewCount,
      totalPurchases: purchaseCount,
      overallConversionRate: Math.round(overallConversionRate * 100) / 100,
    },
  });
});

// Get time-series data for a specific course
app.get("/creator/course/:courseId/timeseries", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const courseId = c.req.param("courseId");
  const days = parseInt(c.req.query("days") || "30");

  // Verify ownership
  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.creatorId, userId)));

  if (!course) {
    return c.json({ error: "Course not found or access denied" }, 404);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get daily views
  const dailyViews = await db
    .select({
      date: sql<string>`DATE(${analyticsEvents.createdAt})`,
      count: count(),
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.courseId, courseId),
        eq(analyticsEvents.eventType, "course_view"),
        gte(analyticsEvents.createdAt, startDate)
      )
    )
    .groupBy(sql`DATE(${analyticsEvents.createdAt})`)
    .orderBy(sql`DATE(${analyticsEvents.createdAt})`);

  // Get daily purchases
  const dailyPurchases = await db
    .select({
      date: sql<string>`DATE(${purchases.purchasedAt})`,
      count: count(),
      revenue: sql<string>`COALESCE(SUM(${purchases.paidAmount}), 0)`,
    })
    .from(purchases)
    .where(
      and(eq(purchases.courseId, courseId), gte(purchases.purchasedAt, startDate))
    )
    .groupBy(sql`DATE(${purchases.purchasedAt})`)
    .orderBy(sql`DATE(${purchases.purchasedAt})`);

  // Get daily lesson completions
  const dailyCompletions = await db
    .select({
      date: sql<string>`DATE(${lessonProgress.completedAt})`,
      count: count(),
    })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.courseId, courseId),
        gte(lessonProgress.completedAt, startDate)
      )
    )
    .groupBy(sql`DATE(${lessonProgress.completedAt})`)
    .orderBy(sql`DATE(${lessonProgress.completedAt})`);

  return c.json({
    dailyViews,
    dailyPurchases,
    dailyCompletions,
  });
});

// Get student engagement details for a course
app.get("/creator/course/:courseId/engagement", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const courseId = c.req.param("courseId");

  // Verify ownership
  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.creatorId, userId)));

  if (!course) {
    return c.json({ error: "Course not found or access denied" }, 404);
  }

  // Get all students who purchased
  const students = await db
    .select({
      id: users.id,
      username: users.username,
      avatar: users.avatar,
      purchasedAt: purchases.purchasedAt,
    })
    .from(purchases)
    .innerJoin(users, eq(purchases.userId, users.id))
    .where(eq(purchases.courseId, courseId))
    .orderBy(desc(purchases.purchasedAt));

  // Get completion stats per student
  const studentsWithProgress = await Promise.all(
    students.map(async (student) => {
      const [progress] = await db
        .select({
          completedLessons: count(),
        })
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.courseId, courseId),
            eq(lessonProgress.userId, student.id)
          )
        );

      // Get total lessons count
      const [totalLessons] = await db
        .select({
          count: count(),
        })
        .from(lessons)
        .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
        .where(eq(chapters.courseId, courseId));

      const completedCount = progress?.completedLessons || 0;
      const totalCount = totalLessons?.count || 0;
      const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

      return {
        ...student,
        completedLessons: completedCount,
        totalLessons: totalCount,
        progressPercent: Math.round(progressPercent),
      };
    })
  );

  return c.json({
    students: studentsWithProgress,
  });
});

// Get funnel analysis
app.get("/creator/course/:courseId/funnel", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const courseId = c.req.param("courseId");

  // Verify ownership
  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.creatorId, userId)));

  if (!course) {
    return c.json({ error: "Course not found or access denied" }, 404);
  }

  // Get unique course page visitors
  const [courseViewers] = await db
    .select({
      total: count(),
      unique: countDistinct(
        sql`COALESCE(${analyticsEvents.userId}::text, ${analyticsEvents.sessionId})`
      ),
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.courseId, courseId),
        eq(analyticsEvents.eventType, "course_view")
      )
    );

  // Get purchasers
  const [purchasers] = await db
    .select({
      count: countDistinct(purchases.userId),
    })
    .from(purchases)
    .where(eq(purchases.courseId, courseId));

  // Get active learners (started at least one lesson)
  const [activeLearners] = await db
    .select({
      count: countDistinct(lessonProgress.userId),
    })
    .from(lessonProgress)
    .where(eq(lessonProgress.courseId, courseId));

  // Get completers (completed all lessons)
  const [totalLessons] = await db
    .select({ count: count() })
    .from(lessons)
    .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
    .where(eq(chapters.courseId, courseId));

  const lessonCount = totalLessons?.count || 0;

  // Find users who completed all lessons
  let completers = 0;
  if (lessonCount > 0) {
    const completedUsers = await db
      .select({
        userId: lessonProgress.userId,
        count: count(),
      })
      .from(lessonProgress)
      .where(eq(lessonProgress.courseId, courseId))
      .groupBy(lessonProgress.userId)
      .having(sql`COUNT(*) >= ${lessonCount}`);

    completers = completedUsers.length;
  }

  return c.json({
    funnel: {
      courseViews: courseViewers?.total || 0,
      uniqueVisitors: courseViewers?.unique || 0,
      purchases: purchasers?.count || 0,
      activeLearners: activeLearners?.count || 0,
      completers,
    },
    conversionRates: {
      viewToPurchase:
        (courseViewers?.unique || 0) > 0
          ? Math.round(((purchasers?.count || 0) / (courseViewers?.unique || 1)) * 10000) / 100
          : 0,
      purchaseToActive:
        (purchasers?.count || 0) > 0
          ? Math.round(((activeLearners?.count || 0) / (purchasers?.count || 1)) * 10000) / 100
          : 0,
      activeToComplete:
        (activeLearners?.count || 0) > 0
          ? Math.round((completers / (activeLearners?.count || 1)) * 10000) / 100
          : 0,
    },
  });
});

export default app;
