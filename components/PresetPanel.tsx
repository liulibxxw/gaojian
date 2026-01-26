
import React, { useState, useMemo } from 'react';
import { AdvancedPreset, CoverState, TransformationRule, FormattingStyles } from '../types';
import { TEXT_PALETTE } from '../constants';
import { 
    PlusIcon, 
    TrashIcon, 
    XMarkIcon,
    SparklesIcon,
    EyeDropperIcon,
    BoldIcon,
    Bars3BottomLeftIcon,
    Bars3Icon
} from '@heroicons/react/24/solid';

interface PresetPanelProps {
    state: CoverState;
    presets: AdvancedPreset[];
    onSavePreset: (preset: AdvancedPreset) => void;
    onDeletePreset: (id: string) => void;
    onApplyPreset: (preset: AdvancedPreset) => void;
    onFormatText: (rules: TransformationRule[]) => void;
}

const RuleConfigItem: React.FC<{ 
    rule: TransformationRule; 
    onChange: (r: TransformationRule) => void; 
    onDelete: () => void 
}> = ({ rule, onChange, onDelete }) => {
    const updateFormatting = (patch: Partial<FormattingStyles>) => {
        onChange({ ...rule, formatting: { ...rule.formatting, ...patch } });
    };

    return (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs flex flex-col gap-3 shadow-sm">
            <div className="flex justify-between items-center">
                <input 
                    className="font-bold bg-transparent border-none p-0 focus:ring-0 text-gray-700 w-full text-xs"
                    value={rule.name}
                    onChange={(e) => onChange({...rule, name: e.target.value})}
                    placeholder="规则名称"
                />
                <button onClick={onDelete} className="text-gray-400 hover:text-red-500">
                    <XMarkIcon className="w-4 h-4" />
                </button>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 shrink-0 w-8">匹配项</span>
                <input 
                    className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 font-mono text-[10px] outline-none focus:border-purple-300"
                    value={rule.pattern}
                    onChange={(e) => onChange({...rule, pattern: e.target.value})}
                    placeholder="正则表达式或关键词..."
                />
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-100 pt-2">
                <span className="text-[10px] font-bold text-gray-400">排版修饰</span>
                
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Color Picker */}
                    <div className="flex gap-1 overflow-x-auto max-w-[120px] custom-scrollbar py-0.5">
                        {TEXT_PALETTE.map(c => (
                            <button 
                                key={c.value} 
                                onClick={() => updateFormatting({ color: c.value })}
                                className={`w-4 h-4 rounded-full border shrink-0 transition-all ${rule.formatting.color === c.value ? 'ring-1 ring-purple-500 ring-offset-1 border-transparent' : 'border-gray-200'}`}
                                style={{ backgroundColor: c.value }}
                            />
                        ))}
                    </div>

                    <div className="h-4 w-px bg-gray-200"></div>

                    {/* Font Size */}
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-0.5">
                        <span className="text-[9px] text-gray-400">字号</span>
                        <input 
                            type="number"
                            className="w-8 bg-transparent border-none p-0 text-[10px] font-bold text-center focus:ring-0"
                            value={rule.formatting.fontSize || ''}
                            onChange={(e) => updateFormatting({ fontSize: parseInt(e.target.value) || undefined })}
                            placeholder="--"
                        />
                    </div>

                    <div className="h-4 w-px bg-gray-200"></div>

                    {/* Bold Toggle */}
                    <button 
                        onClick={() => updateFormatting({ isBold: !rule.formatting.isBold })}
                        className={`p-1 rounded ${rule.formatting.isBold ? 'bg-purple-100 text-purple-600' : 'bg-white border border-gray-200 text-gray-400'}`}
                    >
                        <BoldIcon className="w-3 h-3" />
                    </button>

                    {/* Scope Toggle */}
                    <button 
                        onClick={() => onChange({...rule, scope: rule.scope === 'match' ? 'paragraph' : 'match'})}
                        className={`px-2 py-1 rounded text-[9px] font-bold border transition-all ${rule.scope === 'paragraph' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500'}`}
                    >
                        {rule.scope === 'paragraph' ? '整段' : '仅词'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export const SavePresetModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (preset: AdvancedPreset) => void;
    currentState: CoverState;
}> = ({ isOpen, onClose, onConfirm, currentState }) => {
    const [name, setName] = useState('');
    const [includeStyle, setIncludeStyle] = useState(true);
    const [includeContent, setIncludeContent] = useState(false);
    const [rules, setRules] = useState<TransformationRule[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    if (!isOpen) return null;

    const scanTextForRules = () => {
        setIsScanning(true);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = currentState.bodyText;
        const styledElements = tempDiv.querySelectorAll('[style]');
        
        const newRules: TransformationRule[] = [];
        const seenKeys = new Set<string>();

        styledElements.forEach((el, idx) => {
            const htmlEl = el as HTMLElement;
            const style = htmlEl.style;
            const text = el.textContent || '';
            
            // 忽略“两端对齐” (justify) 样式
            if (style.textAlign === 'justify') return;

            // 提取结构化样式
            const formatting: FormattingStyles = {};
            if (style.color) formatting.color = style.color;
            if (style.fontSize) formatting.fontSize = parseInt(style.fontSize);
            if (style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 700) formatting.isBold = true;
            if (style.fontStyle === 'italic') formatting.isItalic = true;
            if (style.textAlign && style.textAlign !== 'justify') formatting.textAlign = style.textAlign as any;

            // 只有当存在有效排版修饰时才记录
            if (Object.keys(formatting).length > 0 && text) {
                const key = JSON.stringify(formatting) + text;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    newRules.push({
                        id: `rule_${Date.now()}_${idx}`,
                        name: `识别: ${text.slice(0, 5)}...`,
                        pattern: text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                        formatting,
                        scope: 'match',
                        isActive: true
                    });
                }
            }
        });

        if (newRules.length === 0) {
            newRules.push({
                id: `rule_${Date.now()}_default`,
                name: '示例: 高亮开头',
                pattern: '^◎.*',
                formatting: { color: '#c0392b', isBold: true },
                scope: 'paragraph',
                isActive: true
            });
        }

        setRules(prev => [...prev, ...newRules]);
        setIsScanning(false);
    };

    const handleConfirm = () => {
        if (!name.trim()) return;
        
        const preset: AdvancedPreset = {
            id: Date.now().toString(),
            name: name.trim(),
            includeStyle,
            includeContent,
            coverState: includeStyle ? {
                backgroundColor: currentState.backgroundColor,
                accentColor: currentState.accentColor,
                textColor: currentState.textColor,
                titleFont: currentState.titleFont,
                bodyFont: currentState.bodyFont,
                layoutStyle: currentState.layoutStyle,
                bodyTextSize: currentState.bodyTextSize,
                bodyTextAlign: currentState.bodyTextAlign,
            } : {},
            rules: rules.filter(r => r.isActive)
        };
        
        if (includeContent) {
             preset.coverState = {
                 ...preset.coverState,
                 title: currentState.title,
                 subtitle: currentState.subtitle,
                 bodyText: currentState.bodyText,
                 secondaryBodyText: currentState.secondaryBodyText,
                 category: currentState.category,
                 author: currentState.author,
             }
        }

        onConfirm(preset);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex justify-center items-end sm:items-center sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div 
                className="bg-white w-full h-[calc(100dvh-3.5rem)] sm:h-[85vh] sm:w-[500px] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 transition-all"
            >
                <div className="flex flex-col h-full w-full">
                    <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                        <h3 className="font-bold text-gray-800">新建排版预设</h3>
                        <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
                    </div>

                    <div className="p-5 overflow-y-auto custom-scrollbar space-y-5 flex-1 min-h-0">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">预设名称</label>
                            <input 
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-purple-300 transition-all"
                                placeholder="如：江湖-战斗判词版式"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={includeStyle} onChange={e => setIncludeStyle(e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                                <span className="font-medium">包含基础风格</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={includeContent} onChange={e => setIncludeContent(e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                                <span className="font-medium">包含草稿文字</span>
                            </label>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-purple-600 uppercase">自动排版规则</span>
                                    <span className="text-[10px] text-gray-400">检测正文中的特殊排版并保存为自动规则</span>
                                </div>
                                <button 
                                    onClick={scanTextForRules}
                                    className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded-md border border-purple-100 hover:bg-purple-100 transition-colors"
                                >
                                    <EyeDropperIcon className="w-3 h-3" />
                                    {isScanning ? '扫描中...' : '扫描当前正文'}
                                </button>
                            </div>
                            
                            <div className="space-y-3 pb-2">
                                {rules.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-lg text-gray-400 text-xs">
                                        暂无规则，点击扫描或手动添加
                                    </div>
                                )}
                                {rules.map((rule, idx) => (
                                    <RuleConfigItem 
                                        key={rule.id} 
                                        rule={rule} 
                                        onChange={(updated) => setRules(prev => prev.map(r => r.id === rule.id ? updated : r))}
                                        onDelete={() => setRules(prev => prev.filter(r => r.id !== rule.id))}
                                    />
                                ))}
                                <button 
                                    onClick={() => setRules(prev => [...prev, {
                                        id: `rule_${Date.now()}`,
                                        name: '新规则',
                                        pattern: '',
                                        formatting: {},
                                        scope: 'match',
                                        isActive: true
                                    }])}
                                    className="w-full py-2 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors"
                                >
                                    <PlusIcon className="w-3 h-3" /> 添加自定义规则
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50/30 shrink-0">
                        <button 
                            onClick={handleConfirm}
                            disabled={!name.trim()}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm active:scale-95 disabled:opacity-50 transition-all shadow-lg"
                        >
                            保存高级预设
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MobilePresetPanel: React.FC<PresetPanelProps> = ({ 
    presets, 
    onSavePreset, 
    onDeletePreset, 
    onApplyPreset, 
    state,
    onFormatText
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const activeRules = useMemo(() => {
        if (!activePresetId) return [];
        return presets.find(p => p.id === activePresetId)?.rules || [];
    }, [activePresetId, presets]);

    const handleApply = (preset: AdvancedPreset) => {
        setActivePresetId(preset.id);
        onApplyPreset(preset);
    };

    return (
        <div className="w-full h-44 bg-white/90 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col pointer-events-auto">
            <div className="px-4 py-2 flex justify-between items-center border-b border-gray-100 shrink-0 h-10">
                <span className="text-xs font-bold text-gray-500">高级预设库 ({presets.length})</span>
                {activeRules.length > 0 && (
                     <button 
                        onClick={() => onFormatText(activeRules)}
                        className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm active:scale-95 transition-all animate-pulse"
                    >
                        <SparklesIcon className="w-3 h-3" />
                        应用排版规则
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center gap-3 px-4 py-2 custom-scrollbar">
                <div 
                    onClick={() => setIsModalOpen(true)}
                    className="shrink-0 w-32 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 cursor-pointer hover:border-purple-500 hover:text-purple-500 hover:bg-purple-50 transition-all active:scale-95 bg-gray-50/50"
                >
                    <PlusIcon className="w-6 h-6" />
                    <span className="text-[10px] font-bold">新建预设</span>
                </div>

                {presets.map((preset) => {
                    const isActive = activePresetId === preset.id;
                    const hasRules = preset.rules && preset.rules.length > 0;
                    
                    return (
                        <div 
                            key={preset.id}
                            className={`relative shrink-0 w-32 h-24 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden transition-all duration-200 group ${isActive ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-200 hover:border-gray-300'}`}
                            onClick={() => handleApply(preset)}
                        >
                            {isActive && <div className="absolute top-0 right-0 w-3 h-3 bg-purple-500 rounded-bl-lg z-10"></div>}
                            
                            <div className="p-2.5 flex flex-col h-full">
                                <div className="text-xs font-bold truncate text-gray-800 mb-1">{preset.name}</div>
                                <div className="flex gap-1 flex-wrap mb-auto">
                                    {preset.includeStyle && <span className="text-[8px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100">风格</span>}
                                    {hasRules && <span className="text-[8px] bg-purple-50 text-purple-600 px-1 rounded border border-purple-100">规则x{preset.rules.length}</span>}
                                </div>
                                
                                <div className="mt-auto flex justify-between items-center pt-1 border-t border-gray-50">
                                     <span className="text-[9px] text-gray-400 truncate pr-2">{isActive ? '使用中' : '点击应用'}</span>
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); onDeletePreset(preset.id); }}
                                        className="text-gray-300 hover:text-red-500 p-1"
                                    >
                                        <TrashIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <SavePresetModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onConfirm={onSavePreset}
                currentState={state}
            />
        </div>
    );
};
