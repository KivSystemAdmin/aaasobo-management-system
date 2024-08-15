"use client";

import { getInstructor } from "@/app/helper/instructorsApi";
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./InstructorProfile.module.scss";

function InstructorProfile({
  instructorId,
  isAdminAuthenticated,
}: {
  instructorId: string;
  isAdminAuthenticated?: boolean;
}) {
  const [instructor, setInstructor] = useState<Instructor | null>(null);

  useEffect(() => {
    const fetchInstructorById = async (instructorId: string) => {
      try {
        const id = parseInt(instructorId);
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
          <h3>Nickname</h3> <p>{instructor.nickname}</p>
          <h3>Email</h3> <p>{instructor.email}</p>
          <h3>Class URL</h3>{" "}
          <p>
            <a
              href={instructor.classURL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {instructor.classURL}
            </a>
          </p>
          <h3>Meeting ID</h3> <p>{instructor.meetingId}</p>
          <h3>Passcode</h3> <p>{instructor.passcode}</p>
          <h3>Self Introduction URL</h3>{" "}
          <p>
            <a
              href={instructor.introductionURL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {instructor.introductionURL}
            </a>
          </p>
          <br />
          <p>
            ■ If you wish to update the profile information above, please
            contact the staff via Facebook.
          </p>
        </>
      ) : (
        <div className={styles.loadingContainer}>Loading ...</div>
      )}
    </>
  );
}

export default InstructorProfile;
