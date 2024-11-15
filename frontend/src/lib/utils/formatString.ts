export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// for order statuses
// e.g. "in_development" -> "In Development"
export const normalizeStatus = (status: string): string => {
  if (status === "preorder_placed") {
    return "Pre-order Placed";
  }

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const slugify = (string: string): string => {
  return string
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
