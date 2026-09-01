"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "./ListTable.module.scss";
import { EyeIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  createTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type TableOptions,
  type TableOptionsResolved,
  type RowData,
} from "@tanstack/react-table"; // Tanstack Table: https://tanstack.com/table/latest
import Link from "next/link";
import Modal from "@/components/elements/modal/Modal";
import ListPageRegistrationModal from "@/components/admins-dashboard/ListPageRegistrationModal";
import ListPageViewPastModal from "@/components/admins-dashboard/ListPageViewPastModal";
import ActionButton from "@/components/elements/buttons/actionButton/ActionButton";
import GenerateClassesForm from "./GenerateClassesForm";
import FilterButton from "./FilterButton";
import { OMIT_CLASS_STATUSES, PAGE_SIZE_OPTIONS } from "@/lib/data/data";

const ALL_COLUMNS_FILTER = "__all_columns__";

function useTable<TData extends RowData>(options: TableOptions<TData>) {
  const resolvedOptions: TableOptionsResolved<TData> = {
    state: {},
    onStateChange: () => {},
    renderFallbackValue: null,
    ...options,
  };

  const [table] = useState(() => createTable<TData>(resolvedOptions));
  const [state, setState] = useState(() => table.initialState);

  table.setOptions((prev) => ({
    ...prev,
    ...options,
    state: {
      ...state,
      ...options.state,
    },
    onStateChange: (updater) => {
      setState(updater);
      options.onStateChange?.(updater);
    },
  }));

  return table;
}

function ListTable({
  listType,
  fetchedData,
  fetchedPastData,
  omitItems,
  linkItems,
  linkUrls,
  itemNameLabels,
  replaceItems,
  userType,
  categoryType,
  addButton,
  viewPastButton,
  pastListTableProps,
  linkTarget,
  isFilterActive,
  filterHref,
  clearFilterHref,
  columnOrder,
}: ListTableProps) {
  const [currentData, setCurrentData] = useState<any[]>(fetchedData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterColumn, setFilterColumn] = useState<string>(
    listType === "Customer List" ? ALL_COLUMNS_FILTER : "0",
  );
  const [filterValue, setFilterValue] = useState<string>("");
  const [pagination, setPagination] = useState({
    pageIndex: 0, // Initial page index
    pageSize: PAGE_SIZE_OPTIONS[0], // Default page size
  });
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<[boolean, string]>([
    false,
    "",
  ]);

  // Handle cell click to toggle the expanded state
  const handleCellClick = (cellId: string) => {
    setSelectedCellId((prevId) => (prevId === cellId ? null : cellId));
  };

  const modalWidth = useMemo(() => {
    switch (listType) {
      case "Instructor List":
        return "700px";
      case "Admin List":
      case "Plan List":
        return "500px";
      default:
        return "100%";
    }
  }, [listType]);

  useEffect(() => {
    // Update settings based on the list type
    switch (listType) {
      case "Class List":
        // Set the active tab to the customer calendar tab.
        localStorage.setItem("activeCustomerTab", "0");
        // Set the previous list page to customer list.
        localStorage.setItem("previousListPage", "class-list");
        break;
      case "Instructor List":
        // Set the active tab to the instructor calendar tab.
        localStorage.setItem("activeInstructorTab", "0");
        // Set the previous list page to instructor list.
        localStorage.setItem("previousListPage", "instructor-list");
        break;
      case "Past Instructor List":
        // Set the active tab to the instructor profile tab.
        localStorage.setItem("activeInstructorTab", "1");
        break;
      case "Customer List":
        // Set the active tab to the customer calendar tab.
        localStorage.setItem("activeCustomerTab", "0");
        // Set the previous list page to customer list.
        localStorage.setItem("previousListPage", "customer-list");
        break;
      case "Past Customer List":
        // Set the active tab to the customer profile tab.
        localStorage.setItem("activeCustomerTab", "1");
        break;
      case "Child List":
        // Set the active tab to the children profiles tab.
        localStorage.setItem("activeCustomerTab", "2");
        // Set the previous list page to child list.
        localStorage.setItem("previousListPage", "child-list");
        break;
      case "Admin List":
        break;
      case "Plan List":
        break;
      case "Subscription List":
        // Set the active tab to the customer regular class tab.
        localStorage.setItem("activeCustomerTab", "3");
        // Set the previous list page to subscription list.
        localStorage.setItem("previousListPage", "subscription-list");
        break;
      default:
        break;
    }
  }, [listType]);

  useEffect(() => {
    const listData = async () => {
      let currentData = fetchedData;
      setCurrentData(currentData);
    };
    listData();
  }, [fetchedData]);

  useEffect(() => {
    // Handle the click event on the table cell
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLTableCellElement;
      if (target && target.tagName === "TD") {
        const cellId = target.dataset.cellId || "";
        handleCellClick(cellId);
      }
    };

    // Add event listener when clicking on the table cell
    document.addEventListener("click", handleClick);

    // Cleanup event listener when clicking on the same table cell again
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [currentData]);

  // Define the displays of the table
  const availableColumnKeys = useMemo(() => {
    if (currentData.length === 0) return [];

    const keys = Object.keys(currentData[0]).filter(
      (key) => !omitItems.includes(key),
    );
    if (!columnOrder) return keys;

    return [
      ...columnOrder.filter((key) => keys.includes(key)),
      ...keys.filter((key) => !columnOrder.includes(key)),
    ];
  }, [columnOrder, currentData, omitItems]);

  const columns = useMemo<ColumnDef<any>[]>(
    () =>
      currentData.length > 0
        ? availableColumnKeys.map((key) => ({
            accessorKey: key,
            header: key,
            cell: (data) => {
              const value = data.getValue() as any;

              // Only for Event List page
              // If the item is a color code, display it as a colored box
              if (key === "Color Code" && typeof value === "string") {
                return (
                  <div className={styles.eventColor}>
                    <div
                      className={styles.eventColor__colorBox}
                      style={{
                        backgroundColor: value,
                      }}
                    />
                    <span>{value.toUpperCase().replace(/,\s*/g, ", ")}</span>
                  </div>
                );
              }

              // If the item is not a link item, return the value
              if (!linkItems.includes(key)) {
                return value;
              }

              // Set the link URL
              let linkUrl = linkUrls[linkItems.indexOf(key)];

              // Replace the item with the value (e.g., [ID] -> 1, 2, 3...)
              replaceItems.forEach((replaceItem) => {
                linkUrl = linkUrl.replace(
                  `[${replaceItem}]`,
                  data.row.original[replaceItem],
                );
              });

              // Only for Class List page
              // If the class status is in the OMIT_CLASS_STATUSES list, do not set the link URL
              if (OMIT_CLASS_STATUSES.includes(data.row.original.Status)) {
                linkUrl = "";
              }

              return (
                <Link href={linkUrl} target={linkTarget}>
                  {value}
                </Link>
              );
            },
          }))
        : [],
    [
      availableColumnKeys,
      currentData.length,
      linkItems,
      linkUrls,
      replaceItems,
      linkTarget,
    ],
  );

  const filterColumns = useMemo(() => {
    if (currentData.length === 0) return [];

    const availableColumns = availableColumnKeys;

    if (listType !== "Customer List") return availableColumns;

    const prioritizedColumns = ["Children", "Customer"];

    return [
      ALL_COLUMNS_FILTER,
      ...prioritizedColumns.filter((key) => availableColumns.includes(key)),
      ...availableColumns.filter(
        (key) => key !== "No" && !prioritizedColumns.includes(key),
      ),
    ];
  }, [availableColumnKeys, currentData.length, listType]);

  // Configure the filter
  const filteredData = useMemo(
    () =>
      currentData.filter((eachData) => {
        if (!filterValue) return true;

        const normalizedFilterValue = filterValue.toLowerCase();

        if (filterColumn === ALL_COLUMNS_FILTER) {
          return Object.keys(eachData)
            .filter((key) => !omitItems.includes(key))
            .some((key) =>
              String(eachData[key])
                .toLowerCase()
                .includes(normalizedFilterValue),
            );
        }

        return filterColumn !== "0"
          ? String(eachData[filterColumn])
              .toLowerCase()
              .includes(normalizedFilterValue)
          : true;
      }),
    [currentData, filterColumn, filterValue, omitItems],
  );

  // Define the table configuration
  const table = useTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(), // Provide a core row model
    getSortedRowModel: getSortedRowModel(), // Provide a sorting row model
    getPaginationRowModel: getPaginationRowModel(), // Provide a pagination row model
    onPaginationChange: setPagination, // Update the pagination state when internal APIs mutate the pagination state
  });

  // Handle the filter change
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterColumn(event.target.value);
  };

  // Render the modal component based on the modal type
  const renderModal = () => {
    if (!isModalOpen[0]) return null;

    switch (isModalOpen[1]) {
      case "add":
        return (
          <ListPageRegistrationModal
            userType={userType}
            categoryType={categoryType}
            width={modalWidth}
          />
        );
      case "viewPast":
        if (!pastListTableProps) return null;
        return (
          <ListPageViewPastModal
            fetchedData={fetchedPastData ? fetchedPastData : []}
            pastListTableProps={pastListTableProps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.topContainer}>
          <div className={styles.filterContainer}>
            <select
              value={filterColumn}
              onChange={handleChange}
              style={{ color: filterColumn === "0" ? "#888888" : "#000000" }}
            >
              <option disabled value="0">
                カラムを選択
              </option>
              {filterColumns.map((key) => (
                <option key={key} value={key}>
                  {key === ALL_COLUMNS_FILTER ? "全項目" : key}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="検索対象を入力"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
          </div>
          <div className={`${styles.buttonsContainer}`}>
            {viewPastButton && (
              <ActionButton
                btnText={viewPastButton[1] + "を表示"}
                className="viewPastBtn"
                onClick={() => setIsModalOpen([true, "viewPast"])}
                Icon={EyeIcon}
              />
            )}
            {addButton &&
              (listType === "Class List" ? (
                <>
                  <FilterButton
                    filterHref={filterHref}
                    clearFilterHref={clearFilterHref}
                    isFilterActive={isFilterActive}
                    displayNames={["本日のクラス", "全クラス"]}
                  />
                  <GenerateClassesForm />
                </>
              ) : (
                <ActionButton
                  btnText={`${addButton[1]}を追加`}
                  className="addBtn"
                  onClick={() => setIsModalOpen([true, "add"])}
                  Icon={PlusIcon}
                />
              ))}
          </div>
        </div>
        {/* Pagination */}
        {/* Numbered page buttons */}
        {Array.from({ length: table.getPageCount() || 1 }, (_, index) => (
          <button
            key={index}
            className={`${styles.pageNumber} ${
              table.getState().pagination.pageIndex === index
                ? styles.activePage
                : ""
            }`}
            onClick={() => table.setPageIndex(index)}
          >
            {index + 1}
          </button>
        ))}
        {/* Select page size */}
        <select
          className={styles.pageSelect}
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </select>
        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.tableContainer}>
            <thead className={styles.tableHeader}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={
                        header.column.getIsSorted()
                          ? header.column.getIsSorted() === "asc"
                            ? "sorted-asc"
                            : "sorted-desc"
                          : ""
                      }
                    >
                      {itemNameLabels[header.column.id] ?? header.column.id}
                      {{
                        asc: " ▲",
                        desc: " ▼",
                      }[header.column.getIsSorted() as string] ?? "　"}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className={styles.tableBody}>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      data-cell-id={cell.id}
                      className={
                        selectedCellId === cell.id ? styles.expanded : ""
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Registration Modal */}
      <Modal
        isOpen={isModalOpen[0]}
        onClose={() => setIsModalOpen([false, ""])}
      >
        {renderModal()}
      </Modal>
    </>
  );
}

export default ListTable;
