import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import Overview from './pages/dashboard/Overview';

import Papers from './pages/library/Papers';
import Upload from './pages/library/Upload';
import Tags from './pages/library/Tags';

import CollectionsList from './pages/collections/CollectionsList';
import NewCollection from './pages/collections/NewCollection';

import ReviewQueue from './pages/reviews/ReviewQueue';
import Templates from './pages/reviews/Templates';
import ReviewEditor from './pages/reviews/ReviewEditor';

import Literature from './pages/reports/Literature';
import Chapters from './pages/reports/Chapters';
import ROL from './pages/reports/ROL';

import Login from './pages/Login'; // existing
import PrivateRoute from './components/PrivateRoute'; // existing
// e.g., in App.jsx or routes.jsx

import PaperForm from './pages/library/PaperForm';
// src/AppRoutes.jsx (or wherever you define routes)
import PaperView from './pages/library/PaperView';
import CollectionBoard from './pages/collections/CollectionBoard';
import CollectionManage from './pages/collections/CollectionManage';
import ReportsPage from './pages/reports/ReportsPage';
import CreateReports from './pages/reports/CreateReports';
import Register from './pages/Register';
import Researchers from './pages/researchers/Researchers';

import { ChaptersPage, ChapterEditor } from './pages/chapters'; // new import
import Supervisors from './pages/supervisors/Supervisors';

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={<PrivateRoute><AppLayout /></PrivateRoute>}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<Overview />} />

        <Route path="library/papers" element={<Papers />} />
        <Route path="library/upload" element={<Upload />} />
        <Route path="library/tags" element={<Tags />} />
        <Route path="library/papers/new" element={<PaperForm mode="create" />} />
        <Route path="library/papers/:paperId" element={<PaperForm mode="edit" />} />
        <Route path="library/papers/:paperId/view" element={<PaperView />} />


        <Route path="/chapters" element={<ChaptersPage />} />
        <Route path="/chapters/:id" element={<ChapterEditor />} />


        <Route path="collections" element={<CollectionsList />} />
        <Route path="collections/new" element={<NewCollection />} />
        <Route path="/collections/:id" element={<CollectionBoard />} />
        <Route path="/collections/:id/manage" element={<CollectionManage />} />


        <Route path="reviews/queue" element={<ReviewQueue />} />
        <Route path="reviews/templates" element={<Templates />} />
        <Route path="reviews/:paperId" element={<ReviewEditor />} />

        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/builder" element={<CreateReports />} />
        <Route path="reports/builder/:id" element={<CreateReports />} />
        <Route path="researchers" element={<Researchers />} />

        <Route path="/supervisors" element={<Supervisors />} />


      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
