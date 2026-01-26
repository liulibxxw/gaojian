
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BoldIcon, 
  ItalicIcon, 
  Bars3BottomLeftIcon, 
  Bars3BottomRightIcon, 
  Bars3Icon, 
  PencilIcon, 
  AdjustmentsHorizontalIcon, 
  MinusIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  CheckIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/solid';
import { TEXT_PALETTE } from '../constants';
import { CoverState } from '../types';

interface RichTextToolbarProps {
  visible: boolean;
  state: CoverState;
  onChange: (newState: Partial<CoverState>) => void;
  keyboardOffset?: number;
}

const RichTextToolbar: React.FC<RichTextToolbarProps> = ({ visible, state, onChange, keyboardOffset = 0 }) => {
  const [showTextColorPalette, setShowTextColorPalette] = useState(false);
  const [showSizePalette, setShowSizePalette] = useState(false);
  const [showSearchAlign, setShowSearchAlign] = useState(false);
  const [searchChar, setSearchChar] = useState('');
  const [isRegexMode, setIsRegexMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [palettePosition, setPalettePosition] = useState<{left: number, bottom: number} | null>(null);
  const [batchFontSize, setBatchFontSize] = useState(13);

  // 分段对齐相关状态
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [rowEditData, setRowEditData] = useState({ left: '', center: '', right: '' });

  // 状态检测
  const [formatStates, setFormatStates] = useState({
    bold: false,
    italic: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false
  });
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  const currentSizeVal = useMemo(() => {
      const match = state.bodyTextSize?.match(/text-\[(\d+)px\]/);
      return match ? parseInt(match[1], 10) : 13;
  }, [state.bodyTextSize]);

  // 提取所有子节点信息
  const allParagraphs = useMemo(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = state.bodyText || "";
    const nodes = Array.from(tempDiv.childNodes);
    
    return nodes.map((node, i) => {
        let text = "";
        let html = "";
        if (node.nodeType === Node.ELEMENT_NODE) {
            text = (node as HTMLElement).innerText || "";
            html = (node as HTMLElement).outerHTML;
        } else if (node.nodeType === Node.TEXT_NODE) {
            text = node.textContent || "";
            html = node.textContent || "";
        }
        return { index: i, text: text.trim(), html: html };
    });
  }, [state.bodyText]);

  // 核心修复：当 searchChar 为空时不显示任何匹配项
  const matches = useMemo(() => {
    if (!searchChar.trim()) return [];
    
    let regex: RegExp | null = null;
    try {
        regex = isRegexMode ? new RegExp(searchChar, 'i') : null;
    } catch (e) {
        regex = null;
    }

    return allParagraphs.filter(p => {
        if (regex) return regex.test(p.text);
        return p.text.toLowerCase().includes(searchChar.toLowerCase());
    });
  }, [allParagraphs, searchChar, isRegexMode]);

  useEffect(() => {
    const updateFormatStates = () => {
      if (!visible) return;
      setFormatStates({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        alignLeft: document.queryCommandState('justifyLeft'),
        alignCenter: document.queryCommandState('justifyCenter'),
        alignRight: document.queryCommandState('justifyRight'),
        alignJustify: document.queryCommandState('justifyFull'),
      });
    };

    document.addEventListener('selectionchange', updateFormatStates);
    return () => document.removeEventListener('selectionchange', updateFormatStates);
  }, [visible]);

  useEffect(() => {
    if (!searchChar.trim()) {
        setSelectedIndices(new Set());
    } else {
        setSelectedIndices(new Set(matches.map(m => m.index)));
    }
  }, [matches, searchChar]);

  useEffect(() => {
    if (!visible) {
      setShowTextColorPalette(false);
      setShowSizePalette(false);
      setShowSearchAlign(false);
    }
  }, [visible]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && toolbarRef.current.contains(event.target as Node)) return;
      if (paletteRef.current && paletteRef.current.contains(event.target as Node)) return;
      setShowTextColorPalette(false);
      setShowSizePalette(false);
    };

    if (showTextColorPalette || showSizePalette) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showTextColorPalette, showSizePalette]);

  if (!visible) return null;

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    setTimeout(() => {
      setFormatStates({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        alignLeft: document.queryCommandState('justifyLeft'),
        alignCenter: document.queryCommandState('justifyCenter'),
        alignRight: document.queryCommandState('justifyRight'),
        alignJustify: document.queryCommandState('justifyFull'),
      });
    }, 10);
  };

  const applyBatchAlign = (alignment: string) => {
    if (selectedIndices.size === 0) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = state.bodyText || "";
    const nodes = Array.from(tempDiv.childNodes);
    
    let modified = false;
    nodes.forEach((node, i) => {
        if (selectedIndices.has(i)) {
            let targetEl: HTMLElement;
            if (node.nodeType === Node.TEXT_NODE) {
                const wrapper = document.createElement('div');
                wrapper.textContent = node.textContent;
                node.replaceWith(wrapper);
                targetEl = wrapper;
            } else {
                targetEl = node as HTMLElement;
            }
            targetEl.style.textAlign = alignment === 'justify' ? 'justify' : alignment;
            modified = true;
        }
    });

    if (modified) {
        onChange({ bodyText: tempDiv.innerHTML });
    }
  };

  const applyStyleToMatches = (styles: { color?: string, fontSize?: string }) => {
    if (!searchChar || selectedIndices.size === 0) return;
    
    let regex: RegExp;
    try {
        const pattern = isRegexMode ? searchChar : searchChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(`(${pattern})(?![^<]*>)`, 'gi');
    } catch (e) { return; }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = state.bodyText || "";
    const nodes = Array.from(tempDiv.childNodes);

    let modified = false;
    nodes.forEach((node, i) => {
        if (selectedIndices.has(i)) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                const originalHtml = el.innerHTML;
                const newHtml = originalHtml.replace(regex, (match) => {
                    const styleStr = [
                        styles.color ? `color: ${styles.color}` : '',
                        styles.fontSize ? `font-size: ${styles.fontSize}` : ''
                    ].filter(Boolean).join(';');
                    modified = true;
                    return `<span style="${styleStr}">${match}</span>`;
                });
                if (newHtml !== originalHtml) el.innerHTML = newHtml;
            } else if (node.nodeType === Node.TEXT_NODE) {
                const originalText = node.textContent || "";
                const newHtml = originalText.replace(regex, (match) => {
                    const styleStr = [
                        styles.color ? `color: ${styles.color}` : '',
                        styles.fontSize ? `font-size: ${styles.fontSize}` : ''
                    ].filter(Boolean).join(';');
                    modified = true;
                    return `<span style="${styleStr}">${match}</span>`;
                });
                if (newHtml !== originalText) {
                    const span = document.createElement('span');
                    span.innerHTML = newHtml;
                    node.replaceWith(span);
                }
            }
        }
    });

    if (modified) {
        onChange({ bodyText: tempDiv.innerHTML });
    }
  };

  const toggleSelection = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedIndices(next);
  };

  const toggleAll = () => {
    if (selectedIndices.size === matches.length) {
        setSelectedIndices(new Set());
    } else {
        setSelectedIndices(new Set(matches.map(m => m.index)));
    }
  };

  const handleBetweenPreset = () => {
      setIsRegexMode(true);
      if (searchChar.length === 2) {
          setSearchChar(`${searchChar[0]}.*${searchChar[1]}`);
      }
  };

  const assignSelection = (field: 'left' | 'center' | 'right') => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setRowEditData(prev => ({ ...prev, [field]: selection.toString() }));
    }
  };

  const submitRowEdit = (index: number) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = state.bodyText || "";
    const nodes = Array.from(tempDiv.childNodes);
    
    const target = nodes[index];
    if (target) {
        const rowHtml = `<div class="multi-align-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; width: 100%; gap: 4px; margin: 4px 0;">
            <div style="text-align: left;">${rowEditData.left || '&nbsp;'}</div>
            <div style="text-align: center;">${rowEditData.center || '&nbsp;'}</div>
            <div style="text-align: right;">${rowEditData.right || '&nbsp;'}</div>
        </div>`;
        const newEl = document.createElement('div');
        newEl.innerHTML = rowHtml;
        target.replaceWith(newEl.firstChild!);
        onChange({ bodyText: tempDiv.innerHTML });
        setEditingIndex(null);
        setRowEditData({ left: '', center: '', right: '' });
    }
  };

  const preventFocusLoss = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.closest('.interactive-area')) {
       e.preventDefault();
    }
  };

  const calculatePalettePosition = (target: HTMLElement) => {
      const rect = target.getBoundingClientRect();
      const screenW = window.innerWidth;
      const PALETTE_WIDTH = 280; 
      const PADDING = 10;
      const bottom = window.innerHeight - rect.top + 10; 
      let left = rect.left + rect.width / 2;
      const minLeft = PALETTE_WIDTH / 2 + PADDING;
      const maxLeft = screenW - PALETTE_WIDTH / 2 - PADDING;
      if (left < minLeft) left = minLeft;
      if (left > maxLeft) left = maxLeft;
      setPalettePosition({ left, bottom });
  };

  const toggleTextColor = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (showTextColorPalette) {
          setShowTextColorPalette(false);
      } else {
          calculatePalettePosition(e.currentTarget);
          setShowTextColorPalette(true);
          setShowSizePalette(false);
          setShowSearchAlign(false);
      }
  };

  const toggleSize = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (showSizePalette) {
          setShowSizePalette(false);
      } else {
          calculatePalettePosition(e.currentTarget);
          setShowSizePalette(true);
          setShowTextColorPalette(false);
          setShowSearchAlign(false);
      }
  };

  const toggleSearchAlign = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setShowSearchAlign(!showSearchAlign);
      if (!showSearchAlign) {
          setShowTextColorPalette(false);
          setShowSizePalette(false);
      }
  };

  const handleTextColorChange = (color: string) => {
      document.execCommand('styleWithCSS', false, 'true');
      document.execCommand('foreColor', false, color);
      setShowTextColorPalette(false);
  };

  const handleSizeChange = (newSize: number) => {
      onChange({ bodyTextSize: `text-[${newSize}px]` });
  };

  const handleBatchFontSizeChange = (newSize: number) => {
      setBatchFontSize(newSize);
      applyStyleToMatches({ fontSize: `${newSize}px` });
  };

  const containerClass = "flex items-center gap-0.5 bg-white rounded-xl p-0.5 border border-gray-200 shadow-sm shrink-0";
  const buttonClass = "p-1.5 hover:bg-gray-50 rounded-lg text-gray-600 transition-all active:scale-95";
  const activeButtonClass = "p-1.5 bg-purple-50 text-purple-600 rounded-lg transition-all active:scale-95 border border-purple-100";

  return (
    <>
        <div 
            ref={toolbarRef}
            className="w-full bg-white/95 backdrop-blur-md px-4 py-3 flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-200 lg:hidden border-t border-gray-100/50"
            onMouseDown={preventFocusLoss}
            onTouchStart={preventFocusLoss}
        >
            {showSearchAlign && (
                <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100 interactive-area animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text"
                                placeholder={isRegexMode ? "正则匹配(忽略HTML)..." : "搜索关键词..."}
                                value={searchChar}
                                onChange={(e) => setSearchChar(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
                            />
                        </div>
                        <button 
                            onClick={() => setIsRegexMode(!isRegexMode)}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-black border transition-all ${isRegexMode ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-400 border-gray-200'}`}
                        >
                            REG
                        </button>
                        <button 
                            onClick={handleBetweenPreset}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all bg-white border-gray-200 text-gray-600 active:bg-gray-100 shadow-sm`}
                        >
                            之间
                        </button>
                    </div>

                    <div className="flex flex-col gap-1 border-t pt-2 border-gray-200">
                        <div className="flex justify-between items-center px-1 mb-1">
                            <span className="text-[10px] font-bold text-gray-400">
                                {searchChar.trim() ? `找到 ${matches.length} 处结果` : '等待搜索输入...'}
                                {selectedIndices.size > 0 && ` (已选 ${selectedIndices.size})`}
                            </span>
                            {matches.length > 0 && (
                                <button onClick={toggleAll} className="text-[10px] text-purple-600 font-bold hover:underline">
                                    {selectedIndices.size === matches.length ? '取消全选' : '全选'}
                                </button>
                            )}
                        </div>
                        <div className="max-h-48 overflow-y-auto flex flex-col gap-2 custom-scrollbar pr-1">
                            {!searchChar.trim() ? (
                                <div className="text-center py-8 text-[10px] text-gray-400 flex flex-col items-center gap-2 opacity-60">
                                    <MagnifyingGlassIcon className="w-6 h-6 mb-1" />
                                    <span>输入关键词以开始搜索并批量修饰段落</span>
                                </div>
                            ) : matches.length === 0 ? (
                                <div className="text-center py-4 text-[10px] text-gray-400 italic">未发现匹配项</div>
                            ) : matches.map((m) => {
                                const isEditing = editingIndex === m.index;
                                return (
                                    <div 
                                        key={m.index} 
                                        className={`flex flex-col gap-2 p-2 rounded-lg border text-[10px] transition-all bg-white border-gray-100 shadow-sm`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div 
                                                onClick={() => toggleSelection(m.index)}
                                                className={`shrink-0 mt-0.5 w-3 h-3 rounded flex items-center justify-center border transition-all cursor-pointer ${selectedIndices.has(m.index) ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-300'}`}
                                            >
                                                {selectedIndices.has(m.index) && <CheckIcon className="w-2 h-2" />}
                                            </div>
                                            <span className="flex-1 select-text leading-relaxed text-gray-500 overflow-hidden break-words">{m.text || "(空内容)"}</span>
                                            <button 
                                                onClick={() => {
                                                    if (isEditing) setEditingIndex(null);
                                                    else {
                                                        setEditingIndex(m.index);
                                                        setRowEditData({ left: m.text, center: '', right: '' });
                                                    }
                                                }}
                                                className={`shrink-0 p-1 rounded transition-colors ${isEditing ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-purple-500'}`}
                                            >
                                                <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {isEditing && (
                                            <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded-xl border border-purple-100 animate-in zoom-in-95 interactive-area">
                                                <div className="flex justify-around gap-1">
                                                    <button onMouseDown={(e) => { e.preventDefault(); assignSelection('left'); }} className="flex-1 py-1 px-1 text-[8px] font-bold bg-white border border-gray-200 rounded text-gray-600 active:scale-95 shadow-sm">选中→左</button>
                                                    <button onMouseDown={(e) => { e.preventDefault(); assignSelection('center'); }} className="flex-1 py-1 px-1 text-[8px] font-bold bg-white border border-gray-200 rounded text-gray-600 active:scale-95 shadow-sm">选中→中</button>
                                                    <button onMouseDown={(e) => { e.preventDefault(); assignSelection('right'); }} className="flex-1 py-1 px-1 text-[8px] font-bold bg-white border border-gray-200 rounded text-gray-600 active:scale-95 shadow-sm">选中→右</button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-1">
                                                    <textarea value={rowEditData.left} onChange={(e) => setRowEditData(prev => ({ ...prev, left: e.target.value }))} className="h-10 text-[9px] p-1 border border-gray-200 rounded resize-none focus:border-purple-300 outline-none bg-white" placeholder="左侧" />
                                                    <textarea value={rowEditData.center} onChange={(e) => setRowEditData(prev => ({ ...prev, center: e.target.value }))} className="h-10 text-[9px] p-1 border border-gray-200 rounded resize-none focus:border-purple-300 outline-none bg-white" placeholder="中间" />
                                                    <textarea value={rowEditData.right} onChange={(e) => setRowEditData(prev => ({ ...prev, right: e.target.value }))} className="h-10 text-[9px] p-1 border border-gray-200 rounded resize-none focus:border-purple-300 outline-none bg-white" placeholder="右侧" />
                                                </div>
                                                <button onClick={() => submitRowEdit(m.index)} className="py-1.5 bg-purple-600 text-white text-[10px] font-bold rounded-lg shadow-sm active:scale-95 transition-transform">确认三段对齐</button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        {selectedIndices.size > 0 && (
                            <div className="flex flex-col gap-2 mt-2 animate-in slide-in-from-top-2">
                                <div className="flex gap-1">
                                    <button onClick={() => applyBatchAlign('left')} className="flex-1 flex justify-center py-2 bg-white rounded-lg text-gray-500 border border-gray-200 shadow-sm active:scale-95"><Bars3BottomLeftIcon className="w-4 h-4" /></button>
                                    <button onClick={() => applyBatchAlign('center')} className="flex-1 flex justify-center py-2 bg-white rounded-lg text-gray-500 border border-gray-200 shadow-sm active:scale-95">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M3 4h18v2H3V4zm4 5h10v2H7V9zm-4 5h18v2H3v-2zm4 5h10v2H7v-2z" /></svg>
                                    </button>
                                    <button onClick={() => applyBatchAlign('right')} className="flex-1 flex justify-center py-2 bg-white rounded-lg text-gray-500 border border-gray-200 shadow-sm active:scale-95"><Bars3BottomRightIcon className="w-4 h-4" /></button>
                                    <button onClick={() => applyBatchAlign('justify')} className="flex-1 flex justify-center py-2 bg-white rounded-lg text-gray-500 border border-gray-200 shadow-sm active:scale-95"><Bars3Icon className="w-4 h-4" /></button>
                                </div>
                                
                                <div className="flex flex-col gap-3 p-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-400 shrink-0">批量颜色:</span>
                                        <div className="flex gap-1.5 overflow-x-auto custom-scrollbar flex-1 py-1">
                                            {TEXT_PALETTE.map(c => (
                                                <button 
                                                    key={c.value} 
                                                    onClick={() => applyStyleToMatches({ color: c.value })}
                                                    className="w-5 h-5 rounded-full border border-gray-200 shrink-0 active:scale-90 transition-transform"
                                                    style={{ backgroundColor: c.value }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 border-t pt-3 border-gray-50">
                                        <span className="text-[10px] font-bold text-gray-400 shrink-0">批量字号:</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleBatchFontSizeChange(Math.max(10, batchFontSize - 1))} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-gray-100 rounded-full transition-colors active:scale-90"><MinusIcon className="w-4 h-4" /></button>
                                            <input type="range" min="10" max="40" step="1" value={batchFontSize} onChange={(e) => handleBatchFontSizeChange(parseInt(e.target.value))} className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                                            <button onClick={() => handleBatchFontSizeChange(Math.min(40, batchFontSize + 1))} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-gray-100 rounded-full transition-colors active:scale-90"><PlusIcon className="w-4 h-4" /></button>
                                            <span className="text-[10px] font-mono font-bold text-gray-600 w-8 text-center">{batchFontSize}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-around w-full">
                <div className={containerClass}>
                    <button onClick={() => handleFormat('bold')} className={formatStates.bold ? activeButtonClass : buttonClass} title="加粗"><BoldIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleFormat('italic')} className={formatStates.italic ? activeButtonClass : buttonClass} title="斜体"><ItalicIcon className="w-5 h-5" /></button>
                </div>

                <div className={containerClass}>
                    <button onClick={() => handleFormat('justifyLeft')} className={formatStates.alignLeft ? activeButtonClass : buttonClass} title="左对齐"><Bars3BottomLeftIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleFormat('justifyCenter')} className={formatStates.alignCenter ? activeButtonClass : buttonClass} title="居中">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 4h18v2H3V4zm4 5h10v2H7V9zm-4 5h18v2H3v-2zm4 5h10v2H7v-2z" /></svg>
                    </button>
                    <button onClick={() => handleFormat('justifyRight')} className={formatStates.alignRight ? activeButtonClass : buttonClass} title="右对齐"><Bars3BottomRightIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleFormat('justifyFull')} className={formatStates.alignJustify ? activeButtonClass : buttonClass} title="两端对齐"><Bars3Icon className="w-5 h-5" /></button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={toggleSearchAlign} className={`p-2 rounded-xl border shadow-sm transition-all active:scale-95 ${showSearchAlign ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'}`} title="批量搜索修饰"><MagnifyingGlassIcon className="w-5 h-5" /></button>
                    <button onClick={toggleSize} className={`p-2 rounded-xl border shadow-sm transition-all active:scale-95 ${showSizePalette ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-white text-gray-600 border-gray-200'}`} title="字号大小"><AdjustmentsHorizontalIcon className="w-5 h-5" /></button>
                    <button onClick={toggleTextColor} className={`p-2 rounded-xl border shadow-sm transition-all active:scale-95 ${showTextColorPalette ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-white text-gray-600 border-gray-200'}`} title="正文颜色"><PencilIcon className="w-5 h-5" /></button>
                </div>
            </div>
        </div>

        {(showTextColorPalette || showSizePalette) && palettePosition && (
            <div 
                ref={paletteRef}
                className="fixed z-[60] bg-white border border-gray-100 shadow-xl rounded-xl p-3 flex flex-wrap justify-center gap-2 animate-in slide-in-from-bottom-2 fade-in lg:hidden"
                style={{ left: palettePosition.left, bottom: palettePosition.bottom, transform: 'translateX(-50%)', width: 'max-content', maxWidth: '90vw' }}
                onMouseDown={preventFocusLoss} 
            >
                {showSizePalette && (
                    <div className="flex items-center gap-2 px-2 py-1">
                        <button onClick={() => handleSizeChange(Math.max(10, currentSizeVal - 1))} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full transition-colors"><MinusIcon className="w-4 h-4" /></button>
                        <input type="range" min="10" max="40" step="1" value={currentSizeVal} onChange={(e) => handleSizeChange(parseInt(e.target.value))} className="w-32 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                        <button onClick={() => handleSizeChange(Math.min(40, currentSizeVal + 1))} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full transition-colors"><PlusIcon className="w-4 h-4" /></button>
                        <span className="text-xs font-mono font-bold text-gray-600 w-8 text-center ml-1">{currentSizeVal}</span>
                    </div>
                )}
                {showTextColorPalette && TEXT_PALETTE.map((color) => (
                    <button key={color.value} onClick={() => handleTextColorChange(color.value)} className="w-8 h-8 rounded-full border shadow-sm hover:scale-110 transition-transform border-gray-200" style={{ backgroundColor: color.value }} title={color.label} />
                ))}
            </div>
        )}
    </>
  );
};

export default RichTextToolbar;
