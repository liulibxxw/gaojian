
export interface CoverState {
  title: string;
  subtitle: string;
  bodyText: string;
  secondaryBodyText: string;
  category: string;
  author: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  titleFont: 'modern' | 'serif' | 'jianghu' | 'bold';
  bodyFont: 'modern' | 'serif' | 'jianghu' | 'bold';
  layoutStyle: 'centered' | 'split' | 'minimal' | 'duality';
  mode: 'cover' | 'long-text';
  bodyTextSize: string;
  bodyTextAlign: string;
  isBodyBold: boolean;
  isBodyItalic: boolean;
}

export interface ContentPreset {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  bodyText: string;
  secondaryBodyText?: string;
  category: string;
  author: string;
}

export type FontStyle = CoverState['titleFont'];
export type LayoutStyle = CoverState['layoutStyle'];

export type EditorTab = 'style' | 'drafts' | 'content' | 'export';
