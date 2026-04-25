import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import SetupPage from "./pages/SetupPage";
import StudyPage from "./pages/StudyPage";
import LearnSetupPage from "./pages/LearnSetupPage";
import LearnPage from "./pages/LearnPage";
import SettingsPage from "./pages/SettingsPage";
import AboutPage from "./pages/AboutPage";
import DatasetCreatePage from "./pages/DatasetCreatePage";
import DatasetEditPage from "./pages/DatasetEditPage";
import ItemEditPage from "./pages/ItemEditPage";
import DialogueListPage from "./pages/DialogueListPage";
import DialoguePage from "./pages/DialoguePage";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/study/:datasetId" element={<SetupPage />} />
          <Route path="/study/:datasetId/session" element={<StudyPage />} />
          <Route path="/learn/:datasetId" element={<LearnSetupPage />} />
          <Route path="/learn/:datasetId/session" element={<LearnPage />} />
          <Route path="/manage/new" element={<DatasetCreatePage />} />
          <Route path="/manage/:datasetId" element={<DatasetEditPage />} />
          <Route path="/manage/:datasetId/item" element={<ItemEditPage />} />
          <Route path="/manage/:datasetId/item/:itemId" element={<ItemEditPage />} />
          <Route path="/dialogue/:level" element={<DialogueListPage />} />
          <Route path="/dialogue/:level/:dialogueId" element={<DialoguePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
