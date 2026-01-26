
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

/**
 * [FormattingStyles] defines the visual styling properties that can be applied
 * via a TransformationRule.
 */
export interface FormattingStyles {
  color?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

/**
 * [TransformationRule] represents a rule for automatically formatting text
 * based on patterns (regex or keywords).
 */
export interface TransformationRule {
  id: string;
  name: string;
  pattern: string;
  formatting: FormattingStyles;
  scope: 'match' | 'paragraph';
  isActive: boolean;
}

/**
 * [AdvancedPreset] extends basic presets to include complex styling rules
 * and conditional content application.
 */
export interface AdvancedPreset {
  id: string;
  name: string;
  includeStyle: boolean;
  includeContent: boolean;
  coverState: Partial<CoverState>;
  rules: TransformationRule[];
}

export type FontStyle = CoverState['titleFont'];
export type LayoutStyle = CoverState['layoutStyle'];
export type EditorTab = 'style' | 'drafts' | 'content' | 'export';
