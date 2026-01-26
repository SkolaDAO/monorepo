import { Routes, Route } from "react-router-dom";
import { Toaster } from "@skola/ui";
import { Layout } from "./components/Layout";
import { ExplorePage } from "./pages/Explore";
import { DashboardPage } from "./pages/Dashboard";
import { CreateCoursePage } from "./pages/CreateCourse";
import { CourseEditorPage } from "./pages/CourseEditor";
import { CoursePage } from "./pages/Course";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import { CourseLearnPage } from "./pages/CourseLearn";
import { MyCoursesPage } from "./pages/MyCourses";
import { ChatPage } from "./pages/Chat";
import { ReferralsPage } from "./pages/Referrals";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { CategoryPage } from "./pages/CategoryPage";
import { AdminPage } from "./pages/AdminPage";
import { SettingsPage } from "./pages/SettingsPage";
import { CreatorAnalyticsPage } from "./pages/CreatorAnalytics";

function App() {
  return (
    <>
      <Toaster />
      <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ExplorePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create" element={<CreateCoursePage />} />
        <Route path="/course/:id/edit" element={<CourseEditorPage />} />
        <Route path="/course/:id" element={<CourseDetailPage />} />
        <Route path="/course/:id/buy" element={<CoursePage />} />
        <Route path="/course/:id/learn" element={<CourseLearnPage />} />
        <Route path="/my-courses" element={<MyCoursesPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/referrals" element={<ReferralsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/analytics" element={<CreatorAnalyticsPage />} />
      </Route>
    </Routes>
    </>
  );
}

export default App;
