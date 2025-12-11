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