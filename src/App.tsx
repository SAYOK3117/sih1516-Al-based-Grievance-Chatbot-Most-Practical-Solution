import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { MobileTabNav } from './components/layout/MobileTabNav';
import { Footer } from './components/layout/Footer';
import { ChatbotWidget } from './components/layout/ChatbotWidget';
import { ScrollProgress } from './components/ui/ScrollProgress';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { FileGrievancePage } from './pages/FileGrievancePage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { GrievanceTrackingPage } from './pages/GrievanceTrackingPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { SuperAdminIndiaMap } from './pages/SuperAdminIndiaMap';
import { SuperAdminGrievances } from './pages/SuperAdminGrievances';
import { SuperAdminEscalations } from './pages/SuperAdminEscalations';
import { SuperAdminAdmins } from './pages/SuperAdminAdmins';
import { SuperAdminAnalytics } from './pages/SuperAdminAnalytics';
import { SuperAdminNotifications } from './pages/SuperAdminNotifications';
import { PublicTransparencyPage } from './pages/PublicTransparencyPage';
import { StoreProvider } from './lib/store';

function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollProgress />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileTabNav />
      <ChatbotWidget />
    </div>
  );
}

function AdminLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#0F1620]">
      <ScrollProgress />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function SuperAdminLayout() {
  return <Outlet />;
}

function ProtectedRoute({ allowedRole, children }: { allowedRole: string, children: React.ReactNode }) {
  const role = localStorage.getItem('suvas_user_role');
  if (role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/file-grievance" element={<FileGrievancePage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRole="citizen">
                <CitizenDashboard />
              </ProtectedRoute>
            } />
            <Route path="/track" element={<GrievanceTrackingPage />} />
            <Route path="/transparency" element={<PublicTransparencyPage />} />
          </Route>
          
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Route>
          
          <Route element={<SuperAdminLayout />}>
            <Route path="/super-admin" element={
              <ProtectedRoute allowedRole="super_admin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/super-admin/map" element={
              <ProtectedRoute allowedRole="super_admin">
                <SuperAdminIndiaMap />
              </ProtectedRoute>
            } />
            <Route path="/super-admin/grievances" element={
              <ProtectedRoute allowedRole="super_admin">
                <SuperAdminGrievances />
              </ProtectedRoute>
            } />
            <Route path="/super-admin/admins" element={
              <ProtectedRoute allowedRole="super_admin">
                <SuperAdminAdmins />
              </ProtectedRoute>
            } />
            <Route path="/super-admin/escalations" element={
              <ProtectedRoute allowedRole="super_admin">
                <SuperAdminEscalations />
              </ProtectedRoute>
            } />
            <Route path="/super-admin/analytics" element={
              <ProtectedRoute allowedRole="super_admin">
                <SuperAdminAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/super-admin/notifications" element={
              <ProtectedRoute allowedRole="super_admin">
                <SuperAdminNotifications />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
