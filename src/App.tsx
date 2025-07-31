
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { DireksiProvider } from './contexts/DireksiContext';
import { ChecklistProvider } from './contexts/ChecklistContext';
import { FileUploadProvider } from './contexts/FileUploadContext';
import { DocumentMetadataProvider } from './contexts/DocumentMetadataContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { YearProvider } from './contexts/YearContext';
import { KlasifikasiProvider } from './contexts/KlasifikasiContext';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/Register';
import Dashboard from './pages/dashboard/Dashboard';
import ListGCG from './pages/ListGCG';
import DocumentManagement from './pages/DocumentManagement';
import PenilaianGCG from './pages/PenilaianGCG';
import AdminDocumentManagement from './pages/admin/DocumentManagement';
import StrukturPerusahaan from './pages/admin/StrukturPerusahaan';
import ChecklistGCG from './pages/admin/ChecklistGCG';
import KelolaAkun from './pages/admin/KelolaAkun';
import MetaData from './pages/admin/MetaData';
import NotFound from './pages/NotFound';
import { useUser } from './contexts/UserContext';

// Super Admin Route Component
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useUser();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/documents" 
        element={
          <ProtectedRoute>
            <DocumentManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/list-gcg" 
        element={
          <ProtectedRoute>
            <ListGCG />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/penilaian-gcg" 
        element={
          <ProtectedRoute>
            <PenilaianGCG />
          </ProtectedRoute>
        } 
      />
      
      {/* Super Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <SuperAdminRoute>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Panel</h1>
                <p className="text-gray-600">Pilih menu di sidebar untuk mengakses fitur admin</p>
              </div>
            </div>
          </SuperAdminRoute>
        } 
      />
      <Route 
        path="/admin/checklist-gcg" 
        element={
          <SuperAdminRoute>
            <ChecklistGCG />
          </SuperAdminRoute>
        } 
      />
      <Route 
        path="/admin/kelola-akun" 
        element={
          <SuperAdminRoute>
            <KelolaAkun />
          </SuperAdminRoute>
        } 
      />
      <Route 
        path="/admin/document-management" 
        element={
          <SuperAdminRoute>
            <AdminDocumentManagement />
          </SuperAdminRoute>
        } 
      />
      <Route 
        path="/admin/struktur-perusahaan" 
        element={
          <SuperAdminRoute>
            <StrukturPerusahaan />
          </SuperAdminRoute>
        } 
      />
      <Route 
        path="/admin/meta-data" 
        element={
          <SuperAdminRoute>
            <MetaData />
          </SuperAdminRoute>
        } 
      />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/register" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <UserProvider>
      <DireksiProvider>
        <ChecklistProvider>
          <FileUploadProvider>
            <DocumentMetadataProvider>
              <YearProvider>
                <KlasifikasiProvider>
                  <Router>
                    <SidebarProvider>
                      <AppRoutes />
                      <Toaster />
                    </SidebarProvider>
                  </Router>
                </KlasifikasiProvider>
              </YearProvider>
            </DocumentMetadataProvider>
          </FileUploadProvider>
        </ChecklistProvider>
      </DireksiProvider>
    </UserProvider>
  );
};

export default App;
