"use client";

import EditClassForm from "@/app/components/customers-dashboard/home/EditClassForm";
import { getChildrenByCustomerId } from "@/app/helper/childrenApi";
import { getInstructors } from "@/app/helper/instructorsApi";
import { getClassById } from "@/app/helper/classesApi";
import { useEffect, useState } from "react";

function Page({ params }: { params: { id: string; classId: string } }) {
  const customerId = params.id;
  const classId = params.classId;

  const [editedClass, setEditedClass] = useState<ClassType | null>(null);
  const [instructors, setInstructors] = useState<Instructor[] | undefined>([]);
  const [children, setChildren] = useState<Child[] | undefined>([]);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const instructors = await getInstructors();
        setInstructors(instructors);
      } catch (error) {
        console.error(error);
      }
    };

    fetchInstructors();
  }, []);

  useEffect(() => {
    const fetchChildrenByCustomerId = async (customerId: string) => {
      try {
        const children = await getChildrenByCustomerId(customerId);
        setChildren(children);
      } catch (error) {
        console.error(error);
      }
    };

    fetchChildrenByCustomerId(customerId);
  }, []);

  useEffect(() => {
    const fetchClassById = async (id: string) => {
      try {
        const editedClass = await getClassById(id);
        setEditedClass(editedClass);
      } catch (error) {
        console.error("Failed to fetch class:", error);
      }
    };
    fetchClassById(classId);
  }, [classId]);

  return (
    <div>
      <div>
        <h1>Edit Class</h1>
      </div>
      {instructors && children && editedClass ? (
        <EditClassForm
          customerId={customerId}
          instructors={instructors}
          children={children}
          editedClass={editedClass}
        />
      ) : (
        <div>Loading ...</div>
      )}
    </div>
  );
}

export default Page;
