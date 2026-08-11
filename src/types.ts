import type { ImageSourcePropType } from "react-native";

export type SongImage = {
  source: ImageSourcePropType;
  width: number;
  height: number;
};

export type Song = {
  id: string;
  number: number | null;
  title: string;
  images: SongImage[];
};

export type Category = {
  id: string;
  name: string;
  builtin: boolean;
};
