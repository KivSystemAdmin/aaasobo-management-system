import Link from "next/link";
import styles from "./ListTable.module.scss";

type FilterButtonProps = {
  filterHref?: string;
  clearFilterHref?: string;
  isFilterActive?: boolean;
  displayNames?: [string, string]; // [filtered view, unfiltered view]
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
    <div
      className={styles.filterToggle}
      role="group"
      aria-label="クラスの表示範囲"
    >
      <Link
        href={filterHref}
        className={`${styles.filterToggleOption} ${
          isFilterActive ? styles.filterToggleOptionActive : ""
        }`}
        aria-current={isFilterActive ? "page" : undefined}
      >
        {displayNames?.[0]}
      </Link>
      <Link
        href={clearFilterHref}
        className={`${styles.filterToggleOption} ${
          !isFilterActive ? styles.filterToggleOptionActive : ""
        }`}
        aria-current={!isFilterActive ? "page" : undefined}
      >
        {displayNames?.[1]}
      </Link>
    </div>
  );
}

export default FilterButton;
