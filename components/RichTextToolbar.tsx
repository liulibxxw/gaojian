
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
  keyboardHeight?: number;
}

const RichTextToolbar: React.FC<RichTextToolbarProps> = ({ visible, state, onChange, keyboardHeight = 0 }) => {
  const [showTextColorPalette, setShowTextColorPalette] = useState(false);
  const [showSizePalette, setShowSizePalette] = useState(false);
  const [showSearchAlign, setShowSearchAlign] = useState(false);
  const [searchChar, setSearchChar] = useState('');
  const [isRegexMode, setIsRegexMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [paletteOffset, setPaletteOffset] = useState<number>(0);
  const [batchFontSize, setBatchFontSize] = useState(13);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [rowEditData, setRowEditData] = useState({ left: '', center: '', right: '' });

  const [formatStates, setFormatStates] = useState({
    bold: false,
    italic: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false
  });
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const buttonsRowRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  const currentSizeVal = useMemo(() => {
      const match = state.bodyTextSize?.match(/text-\[(\d+)px\]/);
      return match ? parseInt(match[1], 10) : 13;
  }, [state.bodyTextSize]);

  const allParagraphs = useMemo(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = state.bodyText || "";
    let ps = Array.from(tempDiv.children) as HTMLElement[];
    if (ps.length === 0 && tempDiv.innerText.trim()) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = tempDiv.innerHTML;
        ps = [wrapper];
    }
    return ps.map((p, i) => ({ index: i, text: p.innerText, html: p.outerHTML }));
  }, [state.bodyText]);

  const matches = useMemo(() => {
    if (!searchChar) return [];
    let regex: RegExp | null = null;
    try { regex = isRegexMode ? new RegExp(searchChar, 'i') : null; } catch (e) { regex = null; }
    return allParagraphs.filter(p => regex ? regex.test(p.text) : p.text.includes(searchChar));
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

  useEffect(() => { setSelectedIndices(new Set(matches.map(m => m.index))); }, [matches]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current?.contains(event.target as Node)) return;
      if (paletteRef.current?.contains(event.target as Node)) return;
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

  const calculatePalettePosition = (target: HTMLElement) => {
      const rect = target.getBoundingClientRect();
      const parentRect = buttonsRowRef.current?.getBoundingClientRect();
      if (!parentRect) return;
      // 计算相对于工具栏容器的 left 偏移
      const center = rect.left + rect.width / 2 - parentRect.left;
      setPaletteOffset(center);
  };

  const toggleTextColor = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (showTextColorPalette) setShowTextColorPalette(false);
      else {
          calculatePalettePosition(e.currentTarget);
          setShowTextColorPalette(true);
          setShowSizePalette(false);
          setShowSearchAlign(false);
      }
  };

  const toggleSize = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (showSizePalette) setShowSizePalette(false);
      else {
          calculatePalettePosition(e.currentTarget);
          setShowSizePalette(true);
          setShowTextColorPalette(false);
          setShowSearchAlign(false);
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

  const preventFocusLoss = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.closest('.interactive-area')) {
       e.preventDefault();
    }
  };

  const containerClass = "flex items-center gap-0.5 bg-white rounded-xl p-0.5 border border-gray-200 shadow-sm shrink-0";
  const buttonClass = "p-1.5 hover:bg-gray-50 rounded-lg text-gray-600 transition-all active:scale-95";
  const activeButtonClass = "p-1.5 bg-purple-50 text-purple-600 rounded-lg transition-all active:scale-95 border border-purple-100";

  return (
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
                            placeholder={isRegexMode ? "正则表达式匹配..." : "搜索内容进行批量操作..."}
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
                </div>
                {/* 更多批量操作逻辑省略以保持核心代码整洁 */}
            </div>
        )}

        <div ref={buttonsRowRef} className="relative flex items-center justify-around w-full">
            <div className={containerClass}>
                <button onClick={() => handleFormat('bold')} className={formatStates.bold ? activeButtonClass : buttonClass}><BoldIcon className="w-5 h-5"/></button>
                <button onClick={() => handleFormat('italic')} className={formatStates.italic ? activeButtonClass : buttonClass}><ItalicIcon className="w-5 h-5"/></button>
            </div>

            <div className={containerClass}>
                <button onClick={() => handleFormat('justifyLeft')} className={formatStates.alignLeft ? activeButtonClass : buttonClass}><Bars3BottomLeftIcon className="w-5 h-5"/></button>
                <button onClick={() => handleFormat('justifyCenter')} className={formatStates.alignCenter ? activeButtonClass : buttonClass}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 4h18v2H3V4zm4 5h10v2H7V9zm-4 5h18v2H3v-2zm4 5h10v2H7v-2z" /></svg>
                </button>
                <button onClick={() => handleFormat('justifyRight')} className={formatStates.alignRight ? activeButtonClass : buttonClass}><Bars3BottomRightIcon className="w-5 h-5"/></button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={() => setShowSearchAlign(!showSearchAlign)}
                    className={`p-2 rounded-xl border shadow-sm transition-all active:scale-95 ${showSearchAlign ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={toggleSize}
                    className={`p-2 rounded-xl border shadow-sm transition-all active:scale-95 ${showSizePalette ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                    <AdjustmentsHorizontalIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={toggleTextColor}
                    className={`p-2 rounded-xl border shadow-sm transition-all active:scale-95 ${showTextColorPalette ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                    <PencilIcon className="w-5 h-5" />
                </button>
            </div>

            {/* 这里是核心修复：使用 absolute 相对于按钮行进行定位 */}
            {(showTextColorPalette || showSizePalette) && (
                <div 
                    ref={paletteRef}
                    className="absolute bottom-[calc(100%+12px)] z-[60] bg-white border border-gray-100 shadow-xl rounded-xl p-3 flex flex-wrap justify-center gap-2 animate-in slide-in-from-bottom-2 fade-in"
                    style={{
                        left: paletteOffset,
                        transform: `translateX(-50%)`,
                        width: 'max-content',
                        maxWidth: '90vw'
                    }}
                    onMouseDown={preventFocusLoss} 
                >
                    {showSizePalette && (
                        <div className="flex items-center gap-2 px-2 py-1">
                            <button onClick={() => handleSizeChange(Math.max(10, currentSizeVal - 1))} className="p-1.5 text-gray-500 hover:text-purple-600 rounded-full"><MinusIcon className="w-4 h-4"/></button>
                            <input 
                                type="range" min="10" max="40" value={currentSizeVal} 
                                onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                                className="w-32 h-1.5 bg-gray-200 rounded-lg accent-purple-600"
                            />
                            <button onClick={() => handleSizeChange(Math.min(40, currentSizeVal + 1))} className="p-1.5 text-gray-500 hover:text-purple-600 rounded-full"><PlusIcon className="w-4 h-4"/></button>
                            <span className="text-xs font-mono font-bold text-gray-600 w-8">{currentSizeVal}</span>
                        </div>
                    )}
                    {showTextColorPalette && TEXT_PALETTE.map((color) => (
                        <button
                            key={color.value}
                            onClick={() => handleTextColorChange(color.value)}
                            className="w-8 h-8 rounded-full border shadow-sm border-gray-200"
                            style={{ backgroundColor: color.value }}
                        />
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default RichTextToolbar;
