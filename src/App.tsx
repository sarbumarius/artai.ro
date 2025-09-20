import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { cn } from './utils/cn';
import { Header } from './components/Header';
import { PromptComposer } from './components/PromptComposer';
import { ImageCanvas } from './components/ImageCanvas';
import { HistoryPanel } from './components/HistoryPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAppStore } from './store/useAppStore';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import { AuthProvider } from './hooks/useAuth';

function FilenameControl() {
  const { downloadFilename, setDownloadFilename } = useAppStore();
  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:block text-xs text-gray-400">Save as</span>
      <input
        className="h-8 px-2 bg-gray-900 border border-gray-700 rounded text-xs text-gray-100 w-40 sm:w-56"
        value={downloadFilename}
        onChange={(e) => setDownloadFilename(e.target.value)}
        placeholder="filename"
      />
      <span className="text-xs text-gray-500">.png</span>
    </div>
  );
}

const ServerHistory = React.lazy(() => import('./components/ServerHistory'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

function AppContent() {
  useKeyboardShortcuts();
  
  const { showPromptPanel, setShowPromptPanel, showHistory, setShowHistory } = useAppStore();
  const [activeTab, setActiveTab] = React.useState<'composer' | 'history'>('composer');
  
  // Set mobile defaults on mount
  React.useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setShowPromptPanel(false);
        setShowHistory(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setShowPromptPanel, setShowHistory]);

  return (
    <div className="h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      <Header />

      {/* Tabs */}
      <div className="px-6 pt-3 bg-gray-950 border-b border-gray-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              className={cn(
                'px-3 py-2 text-sm rounded-t-md border-b-2',
                activeTab === 'composer' ? 'text-yellow-400 border-yellow-400' : 'text-gray-400 border-transparent hover:text-gray-200'
              )}
              onClick={() => setActiveTab('composer')}
            >
              Composer
            </button>
            <button
              className={cn(
                'px-3 py-2 text-sm rounded-t-md border-b-2',
                activeTab === 'history' ? 'text-yellow-400 border-yellow-400' : 'text-gray-400 border-transparent hover:text-gray-200'
              )}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
          </div>
          {/* Save filename control */}
          <FilenameControl />
        </div>
      </div>
      
      {activeTab === 'composer' ? (
        <div className="flex-1 flex overflow-hidden">
          <div className={cn("flex-shrink-0 transition-all duration-300", !showPromptPanel && "w-8") }>
            <PromptComposer />
          </div>
          <div className="flex-1 min-w-0">
            <ImageCanvas />
          </div>
          <div className="flex-shrink-0">
            <HistoryPanel />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          {/* Server-backed history list */}
          <React.Suspense fallback={<div className="p-6 text-sm text-gray-400">Loading history...</div>}>
            <ServerHistory />
          </React.Suspense>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<AppContent />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;