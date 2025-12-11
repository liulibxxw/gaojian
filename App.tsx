import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CoverState, ContentPreset } from './types';
import { 
  INITIAL_TITLE, 
  INITIAL_SUBTITLE, 
  INITIAL_BODY_TEXT, 
  INITIAL_AUTHOR, 
  INITIAL_BG_COLOR,
  INITIAL_ACCENT_COLOR,
  INITIAL_TEXT_COLOR,
  PALETTE, 
  DEFAULT_PRESETS,
  PastelColor,
  INITIAL_CATEGORY
} from './constants';
import CoverPreview from './components/CoverPreview';
import EditorControls, { EditorTab, MobileDraftsStrip, MobileStylePanel, ContentEditorModal } from './components/EditorControls';
import ExportModal from './components/ExportModal';
import RichTextToolbar from './components/RichTextToolbar';
import { ArrowDownTrayIcon, PaintBrushIcon, BookmarkIcon, ArrowsRightLeftIcon, SwatchIcon } from '@heroicons/react/24/solid';
import domtoimage from 'dom-to-image-more';

const App: React.FC = () => {
  const [state, setState] = useState<CoverState>(() => {
    try {
      const saved = localStorage.getItem('coverState_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
           ...parsed,
           backgroundColor: parsed.backgroundColor || INITIAL_BG_COLOR,
           accentColor: parsed.accentColor || INITIAL_ACCENT_COLOR,
           textColor: parsed.textColor || INITIAL_TEXT_COLOR,
           titleFont: parsed.titleFont || 'serif'
        };
      }
    } catch (e) {
      console.error("Failed to load state", e);
    }
    return {
      title: INITIAL_TITLE,
      subtitle: INITIAL_SUBTITLE,
      bodyText: INITIAL_BODY_TEXT,
      category: INITIAL_CATEGORY,
      author: INITIAL_AUTHOR,
      backgroundColor: INITIAL_BG_COLOR,
      accentColor: INITIAL_ACCENT_COLOR,
      textColor: INITIAL_TEXT_COLOR,
      titleFont: 'serif',
      bodyFont: 'serif',
      layoutStyle: 'minimal',
      mode: 'cover',
      bodyTextSize: 'text-[13px]',
      bodyTextAlign: 'text-justify',
      isBodyBold: false,
      isBodyItalic: false,
    };
  });

  const [activeTab, setActiveTab] = useState<EditorTab | undefined>(undefined);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportImage, setExportImage] = useState<string | null>(null);
  const [presets, setPresets] = useState<ContentPreset[]>(() => {
    try {
      const saved = localStorage.getItem('coverPresets_v2');
      return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
    } catch {
      return DEFAULT_PRESETS;
    }
  });
  
  const [isMobileContentEditing, setIsMobileContentEditing] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('coverState_v2', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem('coverPresets_v2', JSON.stringify(presets));
  }, [presets]);

  const handleStateChange = (updates: Partial<CoverState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleExport = useCallback(async () => {
    if (!previewRef.current) return;
    
    setIsExporting(true);
    setShowExportModal(true);
    setExportImage(null);

    // Wait for UI to update (remove cursors etc)
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const node = previewRef.current;
      const scale = 3; // High resolution
      
      // Use dom-to-image-more which handles text rendering better
      const dataUrl = await domtoimage.toPng(node, {
        height: node.offsetHeight * scale,
        width: node.offsetWidth * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${node.offsetWidth}px`,
          height: `${node.offsetHeight}px`
        }
      });
      
      setExportImage(dataUrl);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出图片失败，请重试');
      setShowExportModal(false);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleDownload = () => {
    if (exportImage) {
      const link = document.createElement('a');
      link.download = `cover-${Date.now()}.png`;
      link.href = exportImage;
      link.click();
    }
  };

  const handleSavePreset = (name: string) => {
    const newPreset: ContentPreset = {
      id: Date.now().toString(),
      name,
      title: state.title,
      subtitle: state.subtitle,
      bodyText: state.bodyText,
      category: state.category,
      author: state.author
    };
    setPresets(prev => [newPreset, ...prev]);
  };

  const handleDeletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  };

  const handleLoadPreset = (preset: ContentPreset) => {
    setState(prev => ({
      ...prev,
      title: preset.title,
      subtitle: preset.subtitle,
      bodyText: preset.bodyText,
      category: preset.category,
      author: preset.author
    }));
  };
  
  const handleCreateNew = () => {
      setState(prev => ({
          ...prev,
          title: "新标题",
          subtitle: "新副标题",
          bodyText: "",
          category: "分类",
          author: "作者"
      }));
      setIsMobileContentEditing(true);
  };

  // Mobile layout helpers
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 text-gray-900 font-sans-sc overflow-hidden">
      {/* Header - Compact on Mobile */}
      <header className="flex-none bg-white border-b border-gray-200 px-4 py-3 md:py-4 flex justify-between items-center z-40 shadow-sm relative">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md transform rotate-3">
             <span className="font-jianghu text-lg">书</span>
           </div>
           <h1 className="text-lg font-bold tracking-tight hidden md:block">小红书封面生成器</h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
           {/* Color Palette - Simplified */}
           <div className="flex items-center bg-gray-100 rounded-full p-1 pr-3 gap-2">
             <SwatchIcon className="w-4 h-4 text-gray-400 ml-2" />
             <div className="flex -space-x-1.5">
                {PALETTE.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleStateChange({ backgroundColor: color.value })}
                    className={`w-5 h-5 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110 hover:z-10 ${state.backgroundColor === color.value ? 'ring-2 ring-purple-400 z-10 scale-110' : ''}`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
             </div>
           </div>

           <div className="h-6 w-px bg-gray-200 mx-1"></div>

           <button 
             onClick={() => handleStateChange({ mode: state.mode === 'cover' ? 'long-text' : 'cover' })}
             className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
             title={state.mode === 'cover' ? "切换长图模式" : "切换封面模式"}
           >
             <ArrowsRightLeftIcon className="w-5 h-5" />
             <span className="text-xs font-bold hidden md:inline">{state.mode === 'cover' ? "封面模式" : "长图模式"}</span>
           </button>

           <button 
             onClick={handleExport}
             className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg shadow-md hover:bg-black transition-transform active:scale-95 flex items-center gap-2"
           >
             <ArrowDownTrayIcon className="w-4 h-4" />
             <span className="hidden md:inline">导出图片</span>
             <span className="md:hidden">导出</span>
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left/Top: Preview Area */}
        <div 
            ref={containerRef}
            className="flex-1 flex items-center justify-center bg-gray-100/50 relative overflow-hidden touch-none"
        >
             <div className="transform scale-[0.85] md:scale-100 transition-transform duration-300 origin-center">
                <CoverPreview 
                    ref={previewRef} 
                    state={state} 
                    onBodyTextChange={(text) => handleStateChange({ bodyText: text })}
                />
             </div>
             
             <RichTextToolbar 
                visible={!isMobile} 
                state={state} 
                onChange={handleStateChange} 
             />
        </div>

        {/* Right: Desktop Controls */}
        <div className="hidden md:block w-[380px] bg-white border-l border-gray-200 h-full overflow-hidden shadow-xl z-20">
            <EditorControls 
                state={state} 
                onChange={handleStateChange} 
                presets={presets}
                onSavePreset={handleSavePreset}
                onDeletePreset={handleDeletePreset}
                onLoadPreset={handleLoadPreset}
                onExport={handleExport}
                activeTab={activeTab || 'content'}
                onTabChange={setActiveTab}
            />
        </div>
      </main>

      {/* Mobile Rich Text Toolbar (Floating) */}
      <div className="md:hidden absolute bottom-[180px] left-0 w-full z-30 pointer-events-none">
          <div className="pointer-events-auto px-4">
             <RichTextToolbar 
                visible={true} 
                state={state} 
                onChange={handleStateChange} 
             />
          </div>
      </div>

      {/* Mobile Bottom Navigation & Controls */}
      <div className="md:hidden flex-none z-40 bg-white border-t border-gray-200">
         <div className="flex justify-around items-center h-14 px-2">
            <button 
               onClick={() => setActiveTab(activeTab === 'drafts' ? undefined : 'drafts')}
               className={`flex-1 flex flex-col items-center justify-center gap-1 h-full ${activeTab === 'drafts' ? 'text-purple-600' : 'text-gray-400'}`}
            >
               <BookmarkIcon className="w-6 h-6" />
               <span className="text-[10px] font-bold">草稿</span>
            </button>
            
             <button 
               onClick={() => setIsMobileContentEditing(true)}
               className={`flex-1 flex flex-col items-center justify-center gap-1 h-full -mt-6`}
            >
               <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-gray-50">
                  <PaintBrushIcon className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-bold text-gray-600">编辑内容</span>
            </button>

            <button 
               onClick={() => setActiveTab(activeTab === 'style' ? undefined : 'style')}
               className={`flex-1 flex flex-col items-center justify-center gap-1 h-full ${activeTab === 'style' ? 'text-purple-600' : 'text-gray-400'}`}
            >
               <SwatchIcon className="w-6 h-6" />
               <span className="text-[10px] font-bold">风格</span>
            </button>
         </div>

         {/* Mobile Panels Overlay */}
         {activeTab === 'drafts' && (
             <div className="absolute bottom-14 left-0 w-full animate-in slide-in-from-bottom-10 fade-in duration-200">
                <MobileDraftsStrip 
                   presets={presets} 
                   onLoadPreset={handleLoadPreset} 
                   state={state} 
                   onChange={handleStateChange}
                   onSavePreset={handleSavePreset}
                   onDeletePreset={handleDeletePreset}
                   onEditContent={() => setIsMobileContentEditing(true)}
                   activePresetId={null}
                   onCreateNew={handleCreateNew}
                />
             </div>
         )}

         {activeTab === 'style' && (
             <div className="absolute bottom-14 left-0 w-full animate-in slide-in-from-bottom-10 fade-in duration-200">
                <MobileStylePanel state={state} onChange={handleStateChange} />
             </div>
         )}
      </div>

      <ContentEditorModal 
         isOpen={isMobileContentEditing} 
         onClose={() => setIsMobileContentEditing(false)}
         state={state}
         onChange={handleStateChange}
         onConfirm={() => setIsMobileContentEditing(false)}
      />

      {showExportModal && (
        <ExportModal
          imageUrl={exportImage}
          isExporting={isExporting}
          onClose={() => setShowExportModal(false)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

export default App;