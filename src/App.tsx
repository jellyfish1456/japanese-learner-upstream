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
import ListeningSessionPage from "./pages/ListeningSessionPage";
import VerbConjugationPage from "./pages/VerbConjugationPage";
import PDFStudyPage from "./pages/PDFStudyPage";
import ShadowingListPage from "./pages/ShadowingListPage";
import ShadowingPage from "./pages/ShadowingPage";
import GrammarQuizPage from "./pages/GrammarQuizPage";
import JapanMapPage from "./pages/JapanMapPage";
import PrefectureDetailPage from "./pages/PrefectureDetailPage";
import SpotDetailPage from "./pages/SpotDetailPage";

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
          <Route path="/listening/:level" element={<ListeningSessionPage />} />
          <Route path="/verb-conjugation" element={<VerbConjugationPage />} />
          <Route path="/pdf-study" element={<PDFStudyPage />} />
          <Route path="/shadowing/youtube" element={<ShadowingPage />} />
          <Route path="/shadowing/:level" element={<ShadowingListPage />} />
          <Route path="/shadowing/:level/:articleId" element={<ShadowingPage />} />
          <Route path="/grammar/:level" element={<GrammarQuizPage />} />
          <Route path="/japan-travel" element={<JapanMapPage />} />
          <Route path="/japan-travel/:prefectureId" element={<PrefectureDetailPage />} />
          <Route path="/japan-travel/:prefectureId/spot/:spotIndex" element={<SpotDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
