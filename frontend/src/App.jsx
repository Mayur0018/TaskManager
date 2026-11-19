import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";

import Login               from "./pages/Login";
import Register            from "./pages/Register";
import Dashboard           from "./pages/Dashboard";
import KanbanBoard         from "./pages/KanbanBoard";
import TeamsPage           from "./pages/TeamsPage";
import TeamTasksPage       from "./pages/TeamTasksPage";
import TeamDashboardPage   from "./pages/TeamDashboardPage";
import TeamCalendarPage    from "./pages/TeamCalendarPage";
import TeamChatPage        from "./pages/TeamChatPage";
import TeamDocumentsPage   from "./pages/TeamDocumentsPage";
import NotificationsPage   from "./pages/NotificationsPage";

function ProtectedLayout() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <NotificationProvider>
      <Outlet />
    </NotificationProvider>
  );
}

function PublicRoute({ children }) {
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard"      element={<Dashboard />} />
        <Route path="/kanban"         element={<KanbanBoard />} />
        <Route path="/teams"          element={<TeamsPage />} />
        <Route path="/team-tasks"     element={<TeamTasksPage />} />
        <Route path="/team-analytics" element={<TeamDashboardPage />} />
        <Route path="/team-calendar"  element={<TeamCalendarPage />} />
        <Route path="/team-chat"      element={<TeamChatPage />} />
        <Route path="/team-documents" element={<TeamDocumentsPage />} />
        <Route path="/notifications"  element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
