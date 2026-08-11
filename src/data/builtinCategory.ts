import { hymns } from "./hymnManifest";
import type { Category, Song } from "../types";

export const HARPA_CATEGORY_ID = "harpa";

export const harpaCategory: Category = {
  id: HARPA_CATEGORY_ID,
  name: "Harpa Cristã Cifrada",
  builtin: true,
};

export const harpaSongs: Song[] = hymns.map((h) => ({
  id: `harpa:${h.number}`,
  number: h.number,
  title: h.title,
  images: [{ source: h.image, width: h.width, height: h.height }],
}));
