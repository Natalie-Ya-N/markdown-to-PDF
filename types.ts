
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark'
}

export interface MarkdownHeader {
  level: number;
  text: string;
  id: string;
}

export interface ThemeColors {
  bg: string;
  header: string;
  text: string;
  border: string;
}
