"use client";

import AddButton from "@/app/components/customers-dashboard/AddButton";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { deleteChild, getChildrenByCustomerId } from "@/app/helper/childrenApi";
import EditButton from "@/app/components/customers-dashboard/EditButton";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;

  const [children, setChildren] = useState<Child[] | undefined>([]);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const childrenData = await getChildrenByCustomerId(customerId);
        setChildren(childrenData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchChildren();
  }, [customerId]);

  async function handleDelete(childId: number) {
    try {
      const deletedChildData = await deleteChild(childId);
      setChildren((prevChildren) =>
        prevChildren?.filter((child) => child.id !== childId),
      );
      alert(deletedChildData.message);
    } catch (error) {
      console.error("Failed to delete the child profile:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unknown error occurred.");
      }
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.page__header}>
        <h1 className={styles.page__title}>Children's Profiles</h1>
      </div>
      <AddButton
        linkURL={`/customers/${customerId}/children-profiles/add-child`}
        btnText="Add Child"
      />
      <div>
        <ul>
          {children?.map((child) => (
            <li key={child.id}>
              {child.name}
              <EditButton
                linkURL={`/customers/${customerId}/children-profiles/${child.id}/edit`}
                btnText="Edit Child"
              />
              <button onClick={() => handleDelete(child.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Page;
