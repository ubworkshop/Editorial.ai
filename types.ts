export interface PublicationStyle {
  id: string;
  name: string;
  description: string;
  logoInitial: string;
  color: string;
  promptModifier: string;
}

export enum InputMode {
  TEXT = 'TEXT',
  URL = 'URL'
}

export interface GeneratedContent {
  headline: string;
  body: string;
  keyTakeaways: string[];
}
