"use client";

import { getInstructor } from "@/app/helper/instructorsApi";
import { useEffect, useState } from "react";
import Image from "next/image";

const Page = ({ params }: { params: { id: string } }) => {
  const instructorId = parseInt(params.id);

  const [instructor, setInstructor] = useState<Instructor | null>(null);

  useEffect(() => {
    const fetchInstructorById = async (id: number) => {
      try {
        const response = await getInstructor(id);
        if ("message" in response) {
          alert(response.message);
          return;
        }
        setInstructor(response.instructor);
      } catch (error) {
        console.error("Failed to fetch instructor:", error);
      }
    };
    fetchInstructorById(instructorId);
  }, [instructorId]);

  return (
    <>
      <h1>Profile Page</h1>
      {instructor ? (
        <>
          <Image
            src={`/instructors/${instructor.icon}`}
            alt={instructor.name}
            width={100}
            height={100}
            priority
          />
          <h3>Name</h3> <p>{instructor.name}</p>
          <h3>Nick Name</h3> <p>{instructor.nickname}</p>
          <h3>Email</h3> <p>{instructor.email}</p>
          <h3>Class Link</h3> <p>{instructor.classLink}</p>
        </>
      ) : (
        <div>Loading ...</div>
      )}
    </>
  );
};

export default Page;
