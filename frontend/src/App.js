import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import BillingSettings from "@/pages/BillingSettings";
import TeamSettings from "@/pages/TeamSettings";
import AcceptInvite from "@/pages/AcceptInvite";
import Quote from "@/pages/Quote";
import PendingQuotes from "@/pages/PendingQuotes";
import LostQuotes from "@/pages/LostQuotes";
import Clients from "@/pages/Clients";
import Billing from "@/pages/Billing";
import BillingSuccess from "@/pages/BillingSuccess";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import SubscriptionGuard from "@/components/SubscriptionGuard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const helloWorldApi = async () => {
    try {
      const response = await axios.get(`${API}/`);
      console.log(response.data.message);
    } catch (e) {
      console.error(e, `errored out requesting / api`);
    }
  };

  useEffect(() => {
    helloWorldApi();
  }, []);

  return (
    <div>
      <header className="App-header">
        <a
          className="App-link"
          href="https://emergent.sh"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="https://avatars.githubusercontent.com/in/1201222?s=120&u=2686cf91179bbafbc7a71bfbc43004cf9ae1acea&v=4" alt="Emergent" />
        </a>
        <p className="mt-5">Building something incredible ~!</p>
      </header>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Public routes - redirect to dashboard if already logged in */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          
          {/* Billing pages - require auth but NOT subscription */}
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/success"
            element={
              <ProtectedRoute>
                <BillingSuccess />
              </ProtectedRoute>
            }
          />
          
          {/* Protected routes - require authentication AND subscription */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Dashboard />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Settings />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/billing"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <BillingSettings />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          
          {/* Quote page - Pro quote flow (requires subscription) */}
          <Route
            path="/quote"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Quote />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          
          {/* Quote Pipeline pages */}
          <Route
            path="/quotes/pending"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <PendingQuotes />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotes/lost"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <LostQuotes />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          
          {/* Clients page */}
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Clients />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />

          {/* Legacy home route for reference */}
          <Route path="/home" element={<Home />} />
          
          {/* Catch-all redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
