import type {
  Category,
  CategoryRow,
  FlatCategoryOption,
} from "./categoryTypes";

const ASSET_BASE_URL = import.meta.env.VITE_API_ASSET_URL ?? "";

export const resolveImageUrl = (path?: string): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${ASSET_BASE_URL}${normalized}`;
};

export const LEVEL_LABEL: Record<number, string> = {
  1: "L1",
  2: "L2",
  3: "L3",
};

export const countAll = (
  categories: Category[],
): { total: number; byLevel: Record<number, number> } => {
  const byLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  let total = 0;
  const walk = (list: Category[]) => {
    list.forEach((c) => {
      total += 1;
      byLevel[c.level] = (byLevel[c.level] ?? 0) + 1;
      if (c.children?.length) walk(c.children);
    });
  };
  walk(categories);
  return { total, byLevel };
};


export const flattenRows = (
  categories: Category[],
  depth: number,
  expandedIds: Set<string>,
): CategoryRow[] => {
  const rows: CategoryRow[] = [];
  categories.forEach((category) => {
    const hasChildren = Boolean(category.children?.length);
    const isExpanded = expandedIds.has(category._id);

    rows.push({ category, depth, hasChildren, isExpanded });

    if (hasChildren && isExpanded) {
      rows.push(...flattenRows(category.children!, depth + 1, expandedIds));
    }
  });
  return rows;
};

// Builds a compact page-number window, e.g. [1, '…', 4, 5, 6, '…', 12]
export const buildPageWindow = (
  current: number,
  totalPages: number,
): (number | "…")[] => {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set<number>([
    1,
    totalPages,
    current,
    current - 1,
    current + 1,
  ]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) result.push("…");
    result.push(page);
  });
  return result;
};

// export const flattenForParentOptions = (
//   categories: Category[],
//   depth = 0,
// ): FlatCategoryOption[] => {
//   const options: FlatCategoryOption[] = [];
//   categories.forEach((category) => {
//     if (category.level <= 2) {
//       options.push({
//         _id: category._id,
//         name: category.name,
//         level: category.level,
//         depth,
//       });
//     }
//     if (category.children?.length) {
//       options.push(...flattenForParentOptions(category.children, depth + 1));
//     }
//   });
//   return options;
// };
export const flattenForParentOptions = (
  categories: any[],
  depth = 0
): FlatCategoryOption[] => {
  const result: FlatCategoryOption[] = [];

  for (const cat of categories) {
    result.push({
      _id: cat._id,
      name: cat.name,
      depth,
      level: cat.level,
    });

    if (cat.children?.length) {
      result.push(...flattenForParentOptions(cat.children, depth + 1));
    }
  }

  return result;
};

export const getAncestorChain = (
  tree: Category[] | undefined,
  targetId: string,
): Category[] => {
  if (!tree) return [];

  const walk = (nodes: Category[], trail: Category[]): Category[] | null => {
    for (const node of nodes) {
      const nextTrail = [...trail, node];
      if (node._id === targetId) return nextTrail;
      if (node.children?.length) {
        const found = walk(node.children, nextTrail);
        if (found) return found;
      }
    }
    return null;
  };

  return walk(tree, []) ?? [];
};
