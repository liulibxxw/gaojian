import React, { useState, useEffect, useRef } from 'react';
import { 
  BoldIcon, 
  ItalicIcon, 
  Bars3BottomLeftIcon, 
  Bars3BottomRightIcon,
  PencilIcon,
  AdjustmentsHorizontalIcon,
  MinusIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/solid';
import { TEXT_PALETTE, PALETTE } from '../constants';
import { CoverState } from '../types';

interface RichTextToolbarProps {
  visible: boolean;
  state: CoverState;
  onChange: (newState: Partial<CoverState>) => void;
}

const RichTextToolbar: React.FC<RichTextToolbarProps> = ({ visible, state, onChange }) => {
  const [showTextColorPalette, setShowTextColorPalette] = useState(false);
  const [showSizePalette, setShowSizePalette] = useState(false);
  const [showSearchAlign, setShowSearchAlign] = useState(false);
  const [searchChar, setSearchChar] = useState('');
  const [palettePosition, setPalettePosition] = useState<{left: number, bottom: number} | null>(null);
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  const currentSizeVal = React.useMemo(() => {
      const match = state.bodyTextSize?.match(/text-\[(\d+)px\]/);
      return match ? parseInt(match[1], 10) : 13;
  }, [state.bodyTextSize]);

  useEffect(() => {
    if (!visible) {
      setShowTextColorPalette(false);
      setShowSizePalette(false);
      setShowSearchAlign(false);
    }
  }, [visible]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && toolbarRef.current.contains(event.target as Node)) {
          return;
      }
      if (paletteRef.current && paletteRef.current.contains(event.target as Node)) {
          return;
      }
      setShowTextColorPalette(false);
      setShowSizePalette(false);
      // 注意：这里不自动关闭搜索框，以便用户输入
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
  };

  const applyBatchAlign = (alignment: string) => {
    if (!searchChar) return;

    // 创建临时容器解析HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = state.bodyText || "";
    
    // 获取所有顶级段落元素（contentEditable通常使用div或p包装段落）
    let paragraphs = Array.from(tempDiv.children) as HTMLElement[];
    
    // 如果没有子元素，说明是纯文本或单个段落
    if (paragraphs.length === 0 && tempDiv.innerText.trim()) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = tempDiv.innerHTML;
        tempDiv.innerHTML = '';
        tempDiv.appendChild(wrapper);
        paragraphs = [wrapper];
    }

    let modified = false;
    paragraphs.forEach(p => {
        if (p.innerText.includes(searchChar)) {
            p.style.textAlign = alignment;
            modified = true;
        }
    });

    if (modified) {
        onChange({ bodyText: tempDiv.innerHTML });
    }
  };

  const preventFocusLoss = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'INPUT' && !target.closest('.search-input-container')) {
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

  const containerClass = "flex items-center gap-0.5 bg-white rounded-xl p-0.5 border border-gray-200 shadow-sm shrink-0";
  const buttonClass = "p-1.5 hover:bg-gray-50 rounded-lg text-gray-600 transition-all active:scale-95";

  return (
    <>
        <div 
            ref={toolbarRef}
            className="w-full bg-white/95 backdrop-blur-md px-4 py-3 flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-200 lg:hidden border-t border-gray-100/50"
            onMouseDown={preventFocusLoss}
            onTouchStart={preventFocusLoss}
        >
            {showSearchAlign && (
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100 search-input-container animate-in fade-in zoom-in-95">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="搜索字符批量对齐..."
                            value={searchChar}
                            onChange={(e) => setSearchChar(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
                        />
                    </div>
                    <div className="flex gap-1 border-l pl-2 border-gray-200">
                        <button onClick={() => applyBatchAlign('left')} className="p-1.5 hover:bg-white rounded-md text-gray-500 shadow-sm border border-transparent active:border-purple-200">
                            <Bars3BottomLeftIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => applyBatchAlign('center')} className="p-1.5 hover:bg-white rounded-md text-gray-500 shadow-sm border border-transparent active:border-purple-200">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M3 4h18v2H3V4zm4 5h10v2H7V9zm-4 5h18v2H3v-2zm4 5h10v2H7v-2z" /></svg>
                        </button>
                        <button onClick={() => applyBatchAlign('right')} className="p-1.5 hover:bg-white rounded-md text-gray-500 shadow-sm border border-transparent active:border-purple-200">
                            <Bars3BottomRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-around w-full">
                <div className={containerClass}>
                    <button onClick={() => handleFormat('bold')} className={buttonClass} title="加粗"><BoldIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleFormat('italic')} className={buttonClass} title="斜体"><ItalicIcon className="w-5 h-5" /></button>
                </div>

                <div className={containerClass}>
                    <button onClick={() => handleFormat('justifyLeft')} className={buttonClass} title="左对齐"><Bars3BottomLeftIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleFormat('justifyCenter')} className={buttonClass} title="居中">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 4h18v2H3V4zm4 5h10v2H7V9zm-4 5h18v2H3v-2zm4 5h10v2H7v-2z" /></svg>
                    </button>
                    <button onClick={() => handleFormat('justifyRight')} className={buttonClass} title="右对齐"><Bars3BottomRightIcon className="w-5 h-5" /></button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={toggleSearchAlign}
                        className={`p-2 rounded-xl border shadow-sm transition-all active:scale-95 ${showSearchAlign ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'}`}
                        title="搜索对齐"
                    >
                        <MagnifyingGlassIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                        onClick={toggleSize}
                        className={`p-2 rounded-xl border shadow-sm transition-all active:scale-95 ${showSizePalette ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-white text-gray-600 border-gray-200'}`}
                        title="字号大小"
                    >
                        <AdjustmentsHorizontalIcon className="w-5 h-5" />
                    </button>

                    <button
                        onClick={toggleTextColor}
                        className={`p-2 rounded-xl border shadow-sm transition-all active:scale-95 ${showTextColorPalette ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-white text-gray-600 border-gray-200'}`}
                        title="正文颜色"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>

        {(showTextColorPalette || showSizePalette) && palettePosition && (
            <div 
                ref={paletteRef}
                className="fixed z-[60] bg-white border border-gray-100 shadow-xl rounded-xl p-3 flex flex-wrap justify-center gap-2 animate-in slide-in-from-bottom-2 fade-in lg:hidden"
                style={{
                    left: palettePosition.left,
                    bottom: palettePosition.bottom,
                    transform: 'translateX(-50%)',
                    width: 'max-content',
                    maxWidth: '90vw'
                }}
                onMouseDown={preventFocusLoss} 
            >
                {showSizePalette && (
                    <div className="flex items-center gap-2 px-2 py-1">
                        <button 
                            onClick={() => handleSizeChange(Math.max(10, currentSizeVal - 1))}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <MinusIcon className="w-4 h-4" />
                        </button>
                        
                        <input 
                            type="range" 
                            min="10" 
                            max="40" 
                            step="1" 
                            value={currentSizeVal} 
                            onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                            className="w-32 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />

                         <button 
                            onClick={() => handleSizeChange(Math.min(40, currentSizeVal + 1))}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <PlusIcon className="w-4 h-4" />
                        </button>
                        
                        <span className="text-xs font-mono font-bold text-gray-600 w-8 text-center ml-1">{currentSizeVal}</span>
                    </div>
                )}

                {showTextColorPalette && TEXT_PALETTE.map((color) => (
                    <button
                        key={color.value}
                        onClick={() => handleTextColorChange(color.value)}
                        className="w-8 h-8 rounded-full border shadow-sm hover:scale-110 transition-transform border-gray-200"
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                    />
                ))}
            </div>
        )}
    </>
  );
};

export default RichTextToolbar;