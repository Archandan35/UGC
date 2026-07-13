import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage        from "./pages/LandingPage";
import Login              from "./pages/Login";
import Register           from "./pages/Register";
import StudentDashboard   from "./pages/StudentDashboard";
import ExamPage           from "./pages/ExamPage";        // UA router → Desktop or Phone
import ProtectedRoute     from "./routes/ProtectedRoute";
import AdminRoute         from "./routes/AdminRoute";
import AdminPage          from "./pages/AdminPage";
import Profile            from "./pages/Profile";
import ResultPage         from "./pages/ResultPage";
import Leaderboard        from "./pages/Leaderboard";
import PricingPage        from "./pages/PricingPage";
import DatabaseManagement from "./admin/DatabaseManagement";
import PremiumPage from "./pages/premium";

import { useRole, isAdminRole } from "./hooks/useRole";

/* ---- Lazy-loaded heavy pages ---- */
const Subjects          = lazy(() => import("./admin/Subjects"));
const Topics            = lazy(() => import("./admin/Topics"));
const SubTopics         = lazy(() => import("./admin/SubTopics"));
const Questions         = lazy(() => import("./admin/Questions"));
const Exams             = lazy(() => import("./admin/Exams"));
const Results           = lazy(() => import("./admin/Results"));
const BulkImport        = lazy(() => import("./admin/BulkImport"));
const MockGeneratorPage = lazy(() => import("./admin/MockGeneratorPage"));
const SmartEditPage     = lazy(() => import("./admin/Smartquestionedit"));
const UserManagement    = lazy(() => import("./admin/UserManagement"));
const UserActivity      = lazy(() => import("./admin/UserActivity"));
const AnalyticsPage     = lazy(() => import("./pages/AnalyticsPage"));
const RevisionPage      = lazy(() => import("./pages/RevisionPage"));
const StudyPlansPage    = lazy(() => import("./pages/StudyPlansPage"));
const ForumPage         = lazy(() => import("./pages/ForumPage"));
const ForumThreadPage   = lazy(() => import("./pages/ForumThreadPage"));
const AuditLogPage      = lazy(() => import("./pages/AuditLogPage"));
const SubjectTopicsPage = lazy(() => import("./pages/SubjectTopicsPage"));
const TopicDashboard    = lazy(() => import("./pages/TopicDashboard"));
const MixedExamPage     = lazy(() => import("./pages/MixedExamPage"));

function PageFallback() {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
    </div>
  );
}

function DashboardRouter() {
  const { role, loading } = useRole();
  if (loading) return <PageFallback />;
  return isAdminRole(role) ? <AdminPage /> : <StudentDashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* PUBLIC */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing"  element={<PricingPage />} />
          <Route path="/premium" element={<PremiumPage />} />

          {/* DASHBOARD (auto role routing) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          {/* STUDENT */}
          <Route path="/exams"           element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/exam/:examId"    element={<ProtectedRoute><ExamPage /></ProtectedRoute>} />
          <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/leaderboard"     element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/result"          element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
          <Route path="/revision"        element={<ProtectedRoute><RevisionPage /></ProtectedRoute>} />
          <Route path="/study-plans"     element={<ProtectedRoute><StudyPlansPage /></ProtectedRoute>} />
          <Route path="/forum"           element={<ProtectedRoute><ForumPage /></ProtectedRoute>} />
          <Route path="/forum/:threadId" element={<ProtectedRoute><ForumThreadPage /></ProtectedRoute>} />
          <Route path="/subjects/:subjectId" element={<ProtectedRoute><SubjectTopicsPage /></ProtectedRoute>} />
          <Route path="/topic/:topicId"  element={<ProtectedRoute><TopicDashboard /></ProtectedRoute>} />
          <Route path="/mixed-exam"      element={<ProtectedRoute><MixedExamPage /></ProtectedRoute>} />
          <Route path="/analytics"       element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />

          {/* ADMIN */}
          <Route path="/admin"                   element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/admin/subjects"          element={<AdminRoute><Subjects /></AdminRoute>} />
          <Route path="/admin/topics"            element={<AdminRoute><Topics /></AdminRoute>} />
          <Route path="/admin/subtopics"         element={<AdminRoute><SubTopics /></AdminRoute>} />
          <Route path="/admin/questions"         element={<AdminRoute><Questions /></AdminRoute>} />
          <Route path="/admin/bulk-import"       element={<AdminRoute><BulkImport /></AdminRoute>} />
          <Route path="/admin/mock-generator"    element={<AdminRoute><MockGeneratorPage /></AdminRoute>} />
          <Route path="/admin/exams"             element={<AdminRoute><Exams /></AdminRoute>} />
          <Route path="/admin/results"           element={<AdminRoute><Results /></AdminRoute>} />
          <Route path="/admin/smartquestionedit" element={<AdminRoute><SmartEditPage /></AdminRoute>} />
          <Route path="/admin/users"             element={<AdminRoute><UserManagement /></AdminRoute>} />
          <Route path="/admin/user-activity"     element={<AdminRoute><UserActivity /></AdminRoute>} />
          <Route path="/admin/analytics"         element={<AdminRoute><AnalyticsPage /></AdminRoute>} />
          <Route path="/admin/audit-log"         element={<AdminRoute><AuditLogPage /></AdminRoute>} />
          <Route path="/admin/database"          element={<AdminRoute><DatabaseManagement /></AdminRoute>} />
         
        

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
