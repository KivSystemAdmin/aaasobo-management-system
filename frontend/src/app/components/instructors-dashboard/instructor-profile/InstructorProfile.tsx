"use client";

import { getInstructor } from "@/app/helper/instructorsApi";
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./InstructorProfile.module.scss";
import {
  EnvelopeIcon,
  InformationCircleIcon,
  LinkIcon,
  UserCircleIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import Loading from "../../Loading";

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
      <h2>Profile Page</h2>
      <div className={styles.container}>
        {instructor ? (
          <>
            <Image
              src={`/instructors/${instructor.icon}`}
              alt={instructor.name}
              width={100}
              height={100}
              priority
              className={styles.pic}
            />
            <p>Name</p> <h3>{instructor.name}</h3>
            <div className={styles.insideContainer}>
              <UserCircleIcon className={styles.icon} />
              <div>
                <p>Nickname</p>
                <h4>{instructor.nickname}</h4>
              </div>
            </div>
            <div className={styles.insideContainer}>
              <EnvelopeIcon className={styles.icon} />
              <div>
                <p>Email</p>
                <h4>{instructor.email}</h4>
              </div>
            </div>
            <div className={styles.insideContainer}>
              <VideoCameraIcon className={styles.icon} />
              <div>
                <p>Class URL</p>
                <h4>
                  <a
                    href={instructor.classURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.url}
                  >
                    {instructor.classURL}
                  </a>
                </h4>
                <div className={styles.urlInfo}>
                  <p>Meeting ID: </p>
                  <p>{instructor.meetingId}</p>
                </div>
                <div className={styles.urlInfo}>
                  <p>Passcode: </p>
                  <p>{instructor.passcode}</p>
                </div>
              </div>
            </div>
            <div className={styles.insideContainer}>
              <LinkIcon className={styles.icon} />
              <div>
                <p>Self Introduction URL</p>
                <h4>
                  <a
                    href={instructor.introductionURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.url}
                  >
                    {instructor.introductionURL}
                  </a>
                </h4>
              </div>
            </div>
            <div className={styles.insideContainer}>
              <InformationCircleIcon className={styles.icon} />
              <p className={styles.info}>
                If you wish to update the profile information above, please
                contact the staff via Facebook.
              </p>
            </div>
          </>
        ) : (
          <Loading />
        )}
      </div>
    </>
  );
}

export default InstructorProfile;
