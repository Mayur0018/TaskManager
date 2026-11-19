import { Navigate, Route, Routes } from "react-router-dom";
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

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  const token = localStorage.getItem("token");

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/*"
        element={
          token ? (
            <NotificationProvider>
              <Routes>
                <Route path="/dashboard"       element={<Dashboard />} />
                <Route path="/kanban"          element={<KanbanBoard />} />
                <Route path="/teams"           element={<TeamsPage />} />
                <Route path="/team-tasks"      element={<TeamTasksPage />} />
                <Route path="/team-analytics"  element={<TeamDashboardPage />} />
                <Route path="/team-calendar"   element={<TeamCalendarPage />} />
                <Route path="/team-chat"       element={<TeamChatPage />} />
                <Route path="/team-documents"  element={<TeamDocumentsPage />} />
                <Route path="/notifications"   element={<NotificationsPage />} />
                <Route path="*"                element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </NotificationProvider>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
