import { customAlphabet } from "nanoid";

const referenceAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const nanoRef = customAlphabet(referenceAlphabet, 6);

export function generateReference(prefix: string) {
  return `${prefix}-${nanoRef()}`;
}

export function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
