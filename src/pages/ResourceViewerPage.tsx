import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { PDFViewer } from '../components/PDFViewer';

export const ResourceViewerPage: React.FC = () => {
  const { selectedResourceId, resources, setActivePage, setSelectedResourceId } = useAdmin();

  const selectedResource = resources.find(r => r.id === selectedResourceId);

  const handleBack = () => {
    setSelectedResourceId(null);
    if (selectedResource) {
      if (selectedResource.status === 'approved') {
        setActivePage('approved');
      } else if (selectedResource.status === 'rejected') {
        setActivePage('rejected');
      } else {
        setActivePage('pending');
      }
    } else {
      setActivePage('pending');
    }
  };

  if (!selectedResource) {
    return (
      <div className="p-6 h-[calc(100vh-64px)] flex items-center justify-center font-sans select-none">
        <div className="text-center space-y-4">
          <p className="text-sm text-zinc-500">No active resource selected for moderation review.</p>
          <button 
            onClick={handleBack}
            className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-750 text-zinc-300 hover:text-white transition cursor-pointer"
          >
            Return to Pending Queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-obsidian-950">
      <PDFViewer resource={selectedResource} onBack={handleBack} />
    </div>
  );
};
