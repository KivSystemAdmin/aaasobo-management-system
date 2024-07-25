"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import Link from "next/link";
import { getAllInstructors, getAllCustomers } from "@/app/helper/adminsApi";

interface UsersTableProps {
  userType: string;
  omitItems: string[];
  linkItems: string[];
  linkUrls: string[];
  replaceItems: string[];
}

function UsersTable({
  userType,
  omitItems,
  linkItems,
  linkUrls,
  replaceItems,
}: UsersTableProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterColumn, setFilterColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");

  useEffect(() => {
    // Fetch the users based on the user type
    const fetchUsers = async () => {
      try {
        let usersData;
        switch (userType) {
          case "instructor":
            usersData = await getAllInstructors();
            break;
          case "customer":
            usersData = await getAllCustomers();
            break;
          case "customer":
            usersData = await getAllCustomers();
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
                // Replace the item with the value(e.g.,[ID] -> 1,2,3...)
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
    getCoreRowModel: getCoreRowModel(), //provide a core row model
    getSortedRowModel: getSortedRowModel(), //provide a sorting row model
  });

  return (
    <>
      <h1>{userType}</h1>
      <select
        value={filterColumn}
        onChange={(e) => setFilterColumn(e.target.value)}
      >
        <option disabled value="">
          --- Select a column ---
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
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                  {{
                    asc: "▲",
                    desc: "▼",
                  }[header.column.getIsSorted() as string] ?? ""}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default UsersTable;
