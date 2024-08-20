import { useState, useEffect, useMemo } from "react";
import styles from "./UsersTable.module.scss";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import Link from "next/link";
import {
  getAllInstructors,
  getAllCustomers,
  getAllChildren,
} from "@/app/helper/adminsApi";
import RedirectButton from "../RedirectButton";

type UsersTableProps = {
  userType: string;
  omitItems: string[];
  linkItems: string[];
  linkUrls: string[];
  replaceItems: string[];
  addUserLink?: string[];
};

function UsersTable({
  userType,
  omitItems,
  linkItems,
  linkUrls,
  replaceItems,
  addUserLink,
}: UsersTableProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterColumn, setFilterColumn] = useState<string>("0");
  const [filterValue, setFilterValue] = useState<string>("");
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the users based on the user type
    const fetchUsers = async () => {
      try {
        let usersData;
        switch (userType) {
          case "Instructor List":
            usersData = await getAllInstructors();
            // Set the active tab to the instructor calendar tab.
            localStorage.setItem("activeInstructorTab", "0");
            break;
          case "Customer List":
            usersData = await getAllCustomers();
            // Set the active tab to the customer calendar tab.
            localStorage.setItem("activeCustomerTab", "0");
            break;
          case "Child List":
            usersData = await getAllChildren();
            // Set the active tab to the children profiles tab.
            localStorage.setItem("activeCustomerTab", "2");
            break;
          default:
            usersData = [];
        }
        setUsers(usersData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUsers();
  }, [userType]);

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
  }, [users]);

  // Define the displays of the table
  const columns = useMemo<ColumnDef<any>[]>(
    () =>
      users.length > 0
        ? Object.keys(users[0])
            // Omit the item from the table
            .filter((key) => !omitItems.includes(key))
            // Set the item to be a link
            .map((key) => ({
              accessorKey: key,
              header: key,
              cell: (data) => {
                const value = data.getValue();
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
                return <Link href={linkUrl}>{value}</Link>;
              },
            }))
        : [],
    [users, omitItems, linkItems, linkUrls, replaceItems],
  );

  // Handle cell click to toggle the expanded state
  const handleCellClick = (cellId: string) => {
    setSelectedCellId((prevId) => (prevId === cellId ? null : cellId));
  };

  // Configure the filter
  const filteredData = useMemo(
    () =>
      users.filter((user) =>
        filterColumn && filterValue
          ? String(user[filterColumn])
              .toLowerCase()
              .includes(filterValue.toLowerCase())
          : true,
      ),
    [users, filterColumn, filterValue],
  );

  // Define the table configuration
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(), // provide a core row model
    getSortedRowModel: getSortedRowModel(), // provide a sorting row model
  });

  // Change the option color when selected
  const changeOptionColor = (optionTag: HTMLSelectElement) => {
    if (parseInt(optionTag.value) !== 0) {
      optionTag.style.color = "#000000";
    }
  };

  // Handle the filter change
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterColumn(event.target.value);
    changeOptionColor(event.target);
  };

  // Delete the selected user
  const handleDeleteClick = (rowId: string | null) => {
    // TODO: Delete the selected user
    if (rowId === null) return alert("Something went wrong. Please try again.");
    const deleteId = parseInt(rowId);
    console.log("Delete the selected user:", users[deleteId]);
  };

  return (
    <>
      <h1 className={styles.title}>{userType}</h1>
      <div className={styles.container}>
        <div className={styles.topContainer}>
          <div className={styles.filterContainer}>
            <select value={filterColumn} onChange={handleChange}>
              <option disabled value="0">
                Select a column
              </option>
              {users.length > 0 &&
                Object.keys(users[0])
                  .filter((key) => !omitItems.includes(key))
                  .map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
            </select>
            <input
              type="text"
              placeholder="Enter filter value..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
          </div>
          {addUserLink ? (
            <RedirectButton
              linkURL={addUserLink[0]}
              btnText={addUserLink[1]}
              className="addBtn"
              Icon={PlusIcon}
            />
          ) : null}
        </div>
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
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {{
                      asc: "▲",
                      desc: "▼",
                    }[header.column.getIsSorted() as string] ?? "　"}
                  </th>
                ))}
                {/* <th></th> */}
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                {/* <td>
                  <TrashIcon
                    className={styles.icon}
                    onClick={() => handleDeleteClick(row.id)}
                  />
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default UsersTable;
