import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
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
import { PublicTransparencyPage } from './pages/PublicTransparencyPage';

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
      {/* Admin might not need footer and mobile tabs in the same way, but keeping it simple for demo */}
    </div>
  );
}

import { StoreProvider } from './lib/store';

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/file-grievance" element={<FileGrievancePage />} />
            <Route path="/dashboard" element={<CitizenDashboard />} />
            <Route path="/track" element={<GrievanceTrackingPage />} />
            <Route path="/transparency" element={<PublicTransparencyPage />} />
          </Route>
          
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
