export interface DialogueLine {
  speaker: string;
  japanese: string;
  chinese: string;
}

export interface KeyPhrase {
  japanese: string;
  chinese: string;
}

export interface DialogueItem {
  id: string;
  title: string;
  titleJp: string;
  situation: string;
  lines: DialogueLine[];
  keyPhrases?: KeyPhrase[];
  notes?: string;
}

export interface DialogueDataset {
  name: string;
  level: string;
  dialogues: DialogueItem[];
}
