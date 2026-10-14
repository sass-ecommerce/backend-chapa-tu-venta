import { QueryFailedError } from 'typeorm';

// Shared by product and variant images: both keep one cover (isPrimary) and an
// explicit order, and are registered by their S3 key.

export const IMAGE_ORDER = {
  isPrimary: 'DESC',
  sortOrder: 'ASC',
  createdAt: 'ASC',
} as const;

interface OrderedImage {
  id: string;
  isPrimary: boolean;
  sortOrder: number;
  updatedAt: Date | null;
}

// True when the key is a file directly inside `folder` (not in a subfolder),
// so a variant's key never passes as a product's and vice versa.
export function isKeyInFolder(s3Key: string, folder: string): boolean {
  if (!s3Key.startsWith(folder)) return false;
  const fileName = s3Key.slice(folder.length);
  return fileName.length > 0 && !fileName.includes('/');
}

// Without an explicit position the image goes last, and it becomes the cover
// when there is none yet.
export function resolveImagePosition(
  images: Pick<OrderedImage, 'isPrimary' | 'sortOrder'>[],
  requested: { isPrimary?: boolean; sortOrder?: number },
): { isPrimary: boolean; sortOrder: number } {
  return {
    isPrimary: requested.isPrimary ?? !images.some((img) => img.isPrimary),
    sortOrder:
      requested.sortOrder ??
      images.reduce((next, img) => Math.max(next, img.sortOrder + 1), 0),
  };
}

// Listed images first, in the given order; the rest keep their relative order
// after them. The first one becomes the cover. An id that isn't one of `images`
// throws `notFound(id)` before anything changes.
export function applyImageOrder<T extends OrderedImage>(
  images: T[],
  imageIds: string[],
  notFound: (id: string) => Error,
): T[] {
  const byId = new Map(images.map((img) => [img.id, img]));
  const unknownId = imageIds.find((id) => !byId.has(id));
  if (unknownId) throw notFound(unknownId);

  const ordered = [
    ...imageIds.map((id) => byId.get(id)!),
    ...images.filter((img) => !imageIds.includes(img.id)),
  ];
  const now = new Date();
  ordered.forEach((img, index) => {
    img.sortOrder = index;
    img.isPrimary = index === 0;
    img.updatedAt = now;
  });
  return ordered;
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error as QueryFailedError & { driverError?: { code?: string } })
      .driverError?.code === '23505'
  );
}
