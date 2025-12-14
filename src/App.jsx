import React from 'react';
import { AppProvider } from './AppContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import SkipToContent from './components/SkipToContent.jsx';
import ScenarioEditorShell from './components/ScenarioEditorShell.jsx';

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <SkipToContent />
        <ScenarioEditorShell />
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
