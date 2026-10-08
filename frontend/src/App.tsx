import { Navigate, Route, Routes } from 'react-router-dom';

import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ItemHierarchyPage } from './pages/ItemHierarchyPage';
import { ItemDetailsPage } from './pages/ItemDetailsPage';
import { ItemsPage } from './pages/ItemsPage';
import { PartsPage } from './pages/PartsPage';
import { SitesPage } from './pages/SitesPage';

export function App() {
  return (
    <div className="flex h-screen bg-white font-sans text-gray-900">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/items" replace />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/items/:id" element={<ItemDetailsPage />} />
          <Route path="/dashboards" element={<DashboardPage />} />
          <Route path="/item-hierarchy" element={<ItemHierarchyPage />} />
          <Route path="/parts" element={<PartsPage />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="*" element={<Navigate to="/items" replace />} />
        </Routes>
      </main>
    </div>
  );
}
