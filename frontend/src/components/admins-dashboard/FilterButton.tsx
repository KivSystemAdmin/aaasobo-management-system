import Link from "next/link";
import styles from "./ListTable.module.scss";

type FilterButtonProps = {
  filterHref?: string;
  clearFilterHref?: string;
  isFilterActive?: boolean;
  displayNames?: [string, string]; // [filter active, filter inactive]
};

function FilterButton({
  filterHref,
  clearFilterHref,
  isFilterActive = false,
  displayNames,
}: FilterButtonProps) {
  if (!filterHref || !clearFilterHref) {
    return null;
  }

  return (
    <Link
      href={isFilterActive ? clearFilterHref : filterHref}
      className={`${styles.filterButton} ${
        isFilterActive ? "" : styles.filterButtonInactive
      }`}
    >
      {isFilterActive ? displayNames?.[1] : displayNames?.[0]}
    </Link>
  );
}

export default FilterButton;
