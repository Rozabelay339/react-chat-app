import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import SideNav from "./components/SideNav";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user } = useAuth();

  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" replace />;
    return (
      <div className="flex">
        <SideNav />
        <div className="flex-1 p-4">{children}</div>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        {/* Only allow access to Register & Login if not logged in */}
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/chat" replace />}
        />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/chat" replace />}
        />
        {/* Protected routes */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        {/* Redirect any unknown route */}
        <Route
          path="*"
          element={<Navigate to={user ? "/chat" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
