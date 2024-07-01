"use client";

import { formatDate, formatTime } from "@/app/helper/dateUtils";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

function Customer() {
  const { id } = useParams();
  const [customerData, setCustomerData] = useState<
  Customer | undefined
  >();
  const [instructorsData, setInstructorsData] = useState<Instructors>();

  useEffect(() => {
    if (!id) return;

    const getCustomerLessons = async () => {
      try {
        const response = await fetch(`http://localhost:4000/customers/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCustomerData(data);
      } catch (error) {
        console.error(error);
      }
    };

    const getInstructors = async () => {
      try {
        const response = await fetch(`http://localhost:4000/instructors`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setInstructorsData(data);
      } catch (error) {
        console.error(error);
      }
    };

    getCustomerLessons();
    getInstructors();
  }, [id]);

  return (
    <div>
      <p>You can add the lesson xx times.</p>
      <button>Add lessons</button>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Time</th>
            <th>Instructor</th>
            {/* <th>Lesson Link</th> */}
            <th>Status</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {customerData?.customer.lesson.map((lesson) => {
            const dateTime = new Date(lesson.dateTime);

            const date = formatDate(dateTime, "Asia/Tokyo");
            const japanTime = formatTime(dateTime, "Asia/Tokyo");

            const instructorName = instructorsData?.data.find(
              (instructor) => instructor.id === lesson.instructorId
            );

            return (
              <tr key={lesson.id}>
                <td>{customerData.customer.name}</td>
                <td>{date}</td>
                <td>{japanTime}</td>
                <td>{instructorName?.name}</td>
                {/* <td>{lesson.link}</td> */}
                <td>{lesson.status}</td>
                <td>
                  <div>
                    <button>Change</button>
                    <button>Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Customer;
