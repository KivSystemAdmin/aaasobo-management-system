"use client";

import { useState, useEffect } from "react";
import { getAllInstructors } from "@/app/helper/adminsApi";

function UsersTable({ userType }: { userType: string }) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let usersData;
        switch (userType) {
          case "instructor":
            usersData = await getAllInstructors();
            break;
          // case "customer":
          //   usersData = await getAllCustomers();
          //   break;
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

  const userKeys = users.length > 0 ? Object.keys(users[0]) : [];

  return (
    <div>
      <h1>{userType}</h1>
      <table>
        <thead>
          <tr>
            {userKeys.map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              {userKeys.map((key) => (
                <td key={key}>{user[key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UsersTable;
