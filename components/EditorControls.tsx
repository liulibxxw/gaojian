
import React, { useState, useEffect } from 'react';
import { CoverState, FontStyle, LayoutStyle, ContentPreset, EditorTab } from '../types';
import { PALETTE, TEXT_PALETTE } from '../constants';
import { GoogleGenAI } from "@google/genai";
import { 
    BookmarkIcon, 
    TrashIcon, 
    CheckIcon, 
    XMarkIcon, 
    PlusIcon, 
    PencilSquareIcon, 
    PaintBrushIcon, 
    AdjustmentsHorizontalIcon,
    SwatchIcon,
    ArrowDownTrayIcon,
    SparklesIcon,
    CheckCircleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/solid';

interface EditorControlsProps {
  state: CoverState;
  onChange: (newState: Partial<CoverState>) => void;
  presets?: ContentPreset[];
  onSavePreset?: (name: string) => void;
  onDeletePreset?: (id: string) => void;
  onRenamePreset?: (id: string, newName: string) => void;
  onLoadPreset?: (preset: ContentPreset) => void;
  onExport: (filename: string) => void;
  activeTab?: EditorTab;
  onTabChange?: (tab: EditorTab) => void;
  onClose?: () => void; 
  mobileView?: EditorTab;
  onEditContent?: () => void;
  activePresetId?: string | null;
  onCreateNew?: () => void;
  isExporting?: boolean;
}

export const MobileExportPanel: React.FC<EditorControlsProps> = ({ state, onExport, isExporting }) => {
  const [characters, setCharacters] = useState<string[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeCharacters = async () => {
    if (!state.bodyText && !state.secondaryBodyText) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const fullText = `${state.bodyText} ${state.secondaryBodyText}`.replace(/<[^>]*>/g, ' ');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `请从以下文稿内容中提取出所有出现的人名、主角名或角色名。只返回名字，用逗号分隔。如果没有名字请返回“无”。文稿：${fullText}`,
      });

      const text = response.text || '无';
      const list = text.split(/[,，]/).map(name => name.trim()).filter(name => name && name !== '无');
      const uniqueList = Array.from(new Set(list));
      setCharacters(uniqueList);
      if (uniqueList.length > 0) setSelectedCharacters([uniqueList[0]]);
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 挂载时自动执行 AI 识别
  useEffect(() => {
    analyzeCharacters();
  }, []);

  const toggleCharacter = (char: string) => {
    setSelectedCharacters(prev => 
      prev.includes(char) ? prev.filter(c => c !== char) : [...prev, char]
    );
  };

  const prefix = state.mode === 'cover' ? '封面' : '长文';
  const charSuffix = selectedCharacters.length > 0 ? selectedCharacters.join(',') : '无';
  const filename = `${prefix}-${state.title || '未命名'}-${charSuffix}.png`;

  return (
    <div className="w-full h-44 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-bottom-5">
      <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center shrink-0">
        <span className="text-xs font-bold text-gray-500 flex items-center gap-2">
          <ArrowDownTrayIcon className="w-3.5 h-3.5 text-purple-600" />
          导出设置
        </span>
        <div className="text-[9px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded max-w-[150px] truncate">
          {filename}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">识别文稿主角</h4>
            {isAnalyzing && (
              <div className="flex items-center gap-1 text-[9px] text-purple-600 font-bold animate-pulse">
                <ArrowPathIcon className="w-2.5 h-2.5 animate-spin" />
                正在智能识别...
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-gray-50/50 rounded-xl border border-gray-100">
            {characters.length === 0 && !isAnalyzing ? (
              <span className="text-[9px] text-gray-400 italic">未检测到角色名</span>
            ) : characters.map(char => (
                <button
                  key={char}
                  onClick={() => toggleCharacter(char)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                    selectedCharacters.includes(char) 
                    ? 'bg-purple-50 border-purple-200 text-purple-600 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-500'
                  }`}
                >
                  {char}
                  {selectedCharacters.includes(char) && <CheckCircleIcon className="w-3 h-3" />}
                </button>
              ))
            }
          </div>
        </div>

        <button 
          onClick={() => onExport(filename)}
          disabled={isExporting}
          className={`w-full py-3 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 ${
            isExporting ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-black'
          }`}
        >
          {isExporting ? (
            <>
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              <span>高清渲染中...</span>
            </>
          ) : (
            <>
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>保存到相册</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const MobileDraftsStrip: React.FC<EditorControlsProps> = ({
  presets = [],
  onLoadPreset,
  onSavePreset,
  onDeletePreset,
  state,
  onEditContent,
  activePresetId,
  onCreateNew
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState('');

  const handleSave = () => {
    if (saveName.trim() && onSavePreset) {
      onSavePreset(saveName.trim());
      setIsSaving(false);
      setSaveName('');
    }
  };

  const getPresetColor = (index: number) => {
    const colors = ['bg-rose-300', 'bg-blue-300', 'bg-amber-300', 'bg-emerald-300', 'bg-purple-300'];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full h-44 bg-white/90 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col pointer-events-auto">
       <div className="px-4 py-2 flex justify-between items-center border-b border-gray-100 shrink-0 h-10">
          <span className="text-xs font-bold text-gray-500">我的草稿 ({presets.length})</span>
          {isSaving && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 absolute right-4 bg-white z-10">
              <input 
                autoFocus
                className="bg-gray-100 rounded px-2 py-1 text-xs w-32 outline-none border border-transparent focus:border-purple-500 transition-all"
                placeholder="输入草稿名称..."
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button onClick={handleSave} className="text-green-600 bg-green-50 p-1 rounded hover:bg-green-100"><CheckIcon className="w-4 h-4"/></button>
              <button onClick={() => setIsSaving(false)} className="text-gray-400 bg-gray-50 p-1 rounded hover:bg-gray-100"><XMarkIcon className="w-4 h-4"/></button>
            </div>
          )}
       </div>
       
       <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center gap-3 px-4 py-2 custom-scrollbar">
          <div 
            onClick={onCreateNew}
            className="shrink-0 w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 cursor-pointer hover:border-purple-500 hover:text-purple-500 hover:bg-purple-50 transition-all active:scale-95 bg-gray-50/50"
          >
             <PlusIcon className="w-6 h-6" />
             <span className="text-[10px] font-bold">新建草稿</span>
          </div>

          {presets.map((preset, idx) => {
             const isActive = activePresetId === preset.id;
             return (
              <div 
                key={preset.id}
                onClick={() => {
                  if (isActive) {
                    if (onEditContent) onEditContent();
                  } else {
                    if (onLoadPreset) onLoadPreset(preset);
                  }
                }}
                className={`relative shrink-0 w-28 h-28 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden transition-all duration-200 ${isActive ? 'border-purple-500 ring-1 ring-purple-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
              >
                 <div className={`absolute top-0 left-0 h-full w-1 ${getPresetColor(idx)}`}></div>
                 <div className="p-2 pl-3 flex flex-col h-full">
                    <div className="text-xs font-bold truncate text-gray-800">{preset.name}</div>
                    
                    <div className="mt-2 mb-auto">
                       <span className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md inline-block max-w-full truncate border border-gray-100">
                         {preset.category || '未分类'}
                       </span>
                    </div>
                    
                    <div className="mt-auto pt-1 flex justify-end items-center gap-1 w-full">
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (onLoadPreset) onLoadPreset(preset);
                                if (onEditContent) onEditContent(); 
                            }}
                            className="text-purple-500 bg-purple-50 hover:bg-purple-100 p-1.5 rounded-md transition-colors"
                        >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                        </button>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); if (onDeletePreset) onDeletePreset(preset.id); }}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                        >
                            <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                 </div>
              </div>
             );
          })}
       </div>
    </div>
  );
};

export const MobileStylePanel: React.FC<EditorControlsProps> = ({ state, onChange }) => {
  return (
    <div className="w-full h-44 bg-white/90 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col pointer-events-auto">
       <div className="px-4 py-2 flex items-center border-b border-gray-100 shrink-0 h-10">
          <span className="text-xs font-bold text-gray-500">风格与布局</span>
       </div>
       <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
          <div>
             <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">布局模板</h4>
             <div className="grid grid-cols-4 gap-3">
              {[
                { id: 'duality', label: '假作真时' },
                { id: 'minimal', label: '机能档案' },
                { id: 'split', label: '电影叙事' },
                { id: 'centered', label: '杂志海报' }
              ].map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => onChange({ layoutStyle: layout.id as LayoutStyle })}
                  className={`shrink-0 h-20 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${state.layoutStyle === layout.id ? 'border-purple-500 bg-purple-50 text-purple-600 shadow-sm' : 'border-gray-200 bg-white text-gray-500'}`}
                >
                  <div className={`w-8 h-8 rounded border-2 ${state.layoutStyle === layout.id ? 'border-purple-300 bg-purple-100' : 'border-gray-300 bg-gray-50'}`}></div>
                  <span className="text-xs font-bold">{layout.label}</span>
                </button>
              ))}
            </div>
          </div>
       </div>
    </div>
  );
};

export const ContentEditorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  state: CoverState;
  onChange: (newState: Partial<CoverState>) => void;
  onConfirm?: () => void;
}> = ({ isOpen, onClose, state, onChange, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in">
       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
             <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <PencilSquareIcon className="w-5 h-5 text-purple-600" />
                编辑卡片内容
             </h3>
             <button onClick={onClose} className="p-1.5 bg-gray-200 rounded-full text-gray-500 hover:bg-gray-300">
               <XMarkIcon className="w-4 h-4" />
             </button>
          </div>
          
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase">主标题</label>
              <textarea 
                value={state.title}
                onChange={(e) => onChange({ title: e.target.value })}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none resize-none font-sans-sc text-sm font-bold text-gray-900"
                rows={2}
                placeholder="输入标题..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase">副标题 / 文案</label>
              <textarea
                value={state.subtitle}
                onChange={(e) => onChange({ subtitle: e.target.value })}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none font-sans-sc text-sm resize-none"
                rows={3}
                placeholder="输入副标题..."
              />
            </div>
            
            {state.layoutStyle === 'duality' && (
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase text-purple-600">正文（里象）</label>
                 <div className="text-[10px] text-gray-400 mb-1">仅在“假作真时”风格下显示</div>
                 <textarea
                  value={state.secondaryBodyText}
                  onChange={(e) => onChange({ secondaryBodyText: e.target.value })}
                  className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none font-sans-sc text-sm resize-none"
                  rows={3}
                  placeholder="第二段正文..."
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase">分类</label>
                <input 
                  type="text"
                  value={state.category}
                  onChange={(e) => onChange({ category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase">作者</label>
                <input 
                  type="text"
                  value={state.author}
                  onChange={(e) => onChange({ author: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-gray-50/30">
             <button 
                onClick={() => {
                   if (onConfirm) onConfirm();
                }} 
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform"
             >
                完成
             </button>
          </div>
       </div>
    </div>
  );
};


const EditorControls: React.FC<EditorControlsProps> = ({ 
  state, 
  onChange, 
  presets = [],
  onSavePreset,
  onDeletePreset,
  onLoadPreset,
  activeTab,
  onTabChange,
  mobileView
}) => {
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  
  const startSavePreset = () => {
    setPresetNameInput(state.title || '无标题草稿');
    setIsSavingPreset(true);
  };

  const confirmSavePreset = () => {
    if (onSavePreset && presetNameInput.trim()) {
      onSavePreset(presetNameInput.trim());
      setIsSavingPreset(false);
    }
  };

  const getPresetColor = (index: number) => {
    const colors = ['bg-rose-300', 'bg-blue-300', 'bg-amber-300', 'bg-emerald-300', 'bg-purple-300'];
    return colors[index % colors.length];
  };

  const renderDraftsTab = () => (
    <div className="space-y-4 h-full flex flex-col">
       <div className="flex justify-between items-center px-1 shrink-0">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <BookmarkIcon className="w-4 h-4 text-purple-500" />
                我的草稿
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{presets.length}</span>
            </h3>
            
            {!isSavingPreset ? (
               <button 
                 onClick={startSavePreset}
                 className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-black transition-all shadow-sm active:scale-95"
               >
                 <PlusIcon className="w-3 h-3" />
                 存为草稿
               </button>
            ) : (
               <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-5">
                  <input 
                    autoFocus
                    value={presetNameInput}
                    onChange={(e) => setPresetNameInput(e.target.value)}
                    placeholder="名称..."
                    className="w-24 bg-gray-100 border-none rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-purple-200 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && confirmSavePreset()}
                  />
                  <button onClick={confirmSavePreset} className="p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600"><CheckIcon className="w-3 h-3" /></button>
                  <button onClick={() => setIsSavingPreset(false)} className="p-1.5 bg-gray-200 text-gray-500 rounded-md hover:bg-gray-300"><XMarkIcon className="w-3 h-3" /></button>
               </div>
            )}
        </div>

        <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-4 custom-scrollbar">
          {presets.map((preset, idx) => (
              <div 
                key={preset.id}
                onClick={() => onLoadPreset && onLoadPreset(preset)}
                className="group relative bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:border-purple-300 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-32 active:scale-95 duration-200"
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${getPresetColor(idx)}`}></div>
                <div className="pl-2 flex-1 min-w-0 flex flex-col">
                    <div className="font-bold text-sm text-gray-800 truncate mb-1">{preset.name}</div>
                    <div className="text-[10px] text-gray-500 line-clamp-3 font-serif-sc leading-relaxed opacity-80 flex-1 bg-gray-50 p-1 rounded mb-1">
                        {preset.subtitle || preset.title}
                    </div>
                </div>
                <div className="pl-2 flex justify-between items-end pt-1 shrink-0">
                    <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[70%]">
                        {preset.category || '未分类'}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeletePreset && onDeletePreset(preset.id); }}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1.5 -mr-1 -mb-1"
                    >
                        <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
              </div>
          ))}
        </div>
    </div>
  );

  const renderContentTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 opacity-60 px-1">
             <PencilSquareIcon className="w-4 h-4" />
             <span className="text-sm font-bold uppercase tracking-wider">文本内容</span>
        </div>
        
        <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100">
           提示：点击正文区域即可进行富文本编辑。选中文字可加粗、变斜或调整对齐方式。点击正文唤起工具栏可修改背景与文字颜色。
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">主标题</label>
          <textarea 
            value={state.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none resize-none font-sans-sc transition-all text-sm font-bold text-gray-800"
            rows={3}
            placeholder="输入引人注目的标题"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">副标题 / 文案</label>
          <textarea
            value={state.subtitle}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none font-sans-sc transition-all text-sm resize-none"
            rows={3}
            placeholder="一句话描述核心亮点"
          />
        </div>
        
        {state.layoutStyle === 'duality' && (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">正文（里象）</label>
            <textarea
              value={state.secondaryBodyText}
              onChange={(e) => onChange({ secondaryBodyText: e.target.value })}
              className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none font-sans-sc transition-all text-sm resize-none"
              rows={3}
              placeholder="仅在“假作真时”风格下显示"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">分类标签</label>
            <input 
              type="text"
              value={state.category}
              onChange={(e) => onChange({ category: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none font-sans-sc text-sm transition-all"
              placeholder="例如：文稿"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">作者署名</label>
            <input 
              type="text"
              value={state.author}
              onChange={(e) => onChange({ author: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none font-sans-sc text-sm transition-all"
              placeholder="例如：琉璃"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStyleTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="text-sm font-bold text-gray-800">风格与布局</label>
        
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'duality', label: '假作真时' },
            { id: 'minimal', label: '机能档案' },
            { id: 'split', label: '电影叙事' },
            { id: 'centered', label: '杂志海报' }
          ].map((layout) => (
            <button
              key={layout.id}
              onClick={() => onChange({ layoutStyle: layout.id as LayoutStyle })}
              className={`py-2 px-1 rounded-lg border text-[10px] md:text-xs font-medium transition-all ${state.layoutStyle === layout.id ? 'border-gray-800 bg-gray-800 text-white shadow-md transform scale-[1.02]' : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
            >
              {layout.label}
            </button>
          ))}
        </div>
      </div>
      
    </div>
  );

  const TabButton = ({ isActive, onClick, icon: Icon, label }: { isActive: boolean, onClick: () => void, icon: React.FC<any>, label: string }) => (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 text-xs font-bold transition-all ${
        isActive
          ? 'text-purple-600 border-b-2 border-purple-600'
          : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full font-sans-sc bg-white relative">
      <div className="hidden md:block p-6 pb-2">
        <div className="flex justify-between items-center mb-1">
          <div>
             <h2 className="text-2xl font-bold text-gray-900">衔书又止</h2>
             <p className="text-gray-400 text-xs mt-1">衔书又止</p>
          </div>
        </div>
      </div>

      <div className="px-2 md:px-6 border-b border-gray-100 shrink-0">
          <div className="flex">
            <TabButton isActive={activeTab === 'drafts'} onClick={() => onTabChange?.('drafts')} icon={BookmarkIcon} label="我的草稿" />
            <TabButton isActive={activeTab === 'content'} onClick={() => onTabChange?.('content')} icon={PencilSquareIcon} label="内容编辑" />
            <TabButton isActive={activeTab === 'style'} onClick={() => onTabChange?.('style')} icon={PaintBrushIcon} label="风格布局" />
          </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-28 relative custom-scrollbar">
        <div className="space-y-6">
          {activeTab === 'style' && renderStyleTab()}
          {activeTab === 'drafts' && renderDraftsTab()}
          {activeTab === 'content' && renderContentTab()}
        </div>
      </div>
    </div>
  );
};

export default EditorControls;
