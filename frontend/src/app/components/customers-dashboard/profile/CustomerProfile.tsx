"use client";

import styles from "./CustomerProfile.module.scss";
import { useEffect, useState } from "react";
import { getCustomerById, editCustomer } from "@/app/helper/customersApi";
import {
  UserCircleIcon,
  EnvelopeIcon,
  HomeIcon,
} from "@heroicons/react/24/solid";
import { prefectures } from "@/app/helper/data";
import ActionButton from "../../ActionButton";
import { CheckIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CustomerProfile({ customerId }: { customerId: string }) {
  const [customer, setCustomer] = useState<Customer | undefined>();
  const [latestCustomerData, setLatestCustomerData] = useState<
    Customer | undefined
  >();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const customerData = await getCustomerById(customerId);
        setCustomer(customerData);
        setLatestCustomerData(customerData);
      } catch (error) {
        console.error(error);
      }
    };
    fetchCustomer();
  }, [customerId]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer) return;

    // Check if there are any changes
    if (
      customer.name === latestCustomerData?.name &&
      customer.email === latestCustomerData?.email &&
      customer.prefecture === latestCustomerData?.prefecture
    ) {
      return alert("No changes were made.");
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(customer.email)) {
      return alert("Please enter a valid email address.");
    }

    try {
      const data = await editCustomer(
        customerId,
        customer.name,
        customer.email,
        customer.prefecture,
      );
      toast.success("Profile edited successfully!");

      setIsEditing(false);
      setCustomer(data.customer);
      setLatestCustomerData(data.customer);
    } catch (error) {
      console.error("Failed to edit customer data:", error);
    }
  };

  const handleCancelClick = () => {
    if (latestCustomerData) {
      setCustomer(latestCustomerData);
      setIsEditing(false);
    }
  };

  return (
    <>
      {customer ? (
        <form className={styles.customer} onSubmit={handleFormSubmit}>
          {/* Customer Name */}
          <label className={styles.customerName}>
            <UserCircleIcon className={styles.profileInfoIcon} />

            <div className={styles.customerName__nameSection}>
              <p className={styles.customerName__text}>Name</p>
              {isEditing ? (
                <input
                  className={`${styles.customerName__inputField} ${isEditing ? styles.editable : ""}`}
                  type="text"
                  value={customer.name}
                  onChange={(e) => {
                    if (isEditing) {
                      setCustomer({ ...customer, name: e.target.value });
                    }
                  }}
                  required
                />
              ) : (
                <div className={styles.customerName__name}>{customer.name}</div>
              )}
            </div>
          </label>

          {/* Customer email */}
          <label className={styles.email}>
            <div className={styles.email__iconContainer}>
              <EnvelopeIcon className={styles.email__icon} />
            </div>
            {isEditing ? (
              <input
                className={`${styles.email__inputField} ${isEditing ? styles.editable : ""}`}
                type="email"
                value={customer.email}
                onChange={(e) => {
                  if (isEditing) {
                    setCustomer({ ...customer, email: e.target.value });
                  }
                }}
                required
              />
            ) : (
              <div className={styles.email__name}>{customer.email}</div>
            )}
          </label>

          {/* Customer prefecture */}
          <label className={styles.customerHome}>
            <HomeIcon className={styles.customerHome__icon} />

            {isEditing ? (
              <select
                className={`${styles.customerHome__inputField} ${isEditing ? styles.editable : ""}`}
                value={customer.prefecture}
                onChange={(e) => {
                  setCustomer({
                    ...customer,
                    prefecture: e.target.value,
                  });
                }}
                required
              >
                {prefectures.map((prefecture) => (
                  <option key={prefecture} value={prefecture}>
                    {prefecture}
                  </option>
                ))}
              </select>
            ) : (
              <div className={styles.customerHome__name}>
                {customer.prefecture}
              </div>
            )}
          </label>

          <div className={styles.buttons}>
            {isEditing ? (
              <div className={styles.buttons__editing}>
                <ActionButton
                  className="cancelEditingChild"
                  btnText="Cancel"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleCancelClick();
                  }}
                />

                <ActionButton
                  className="saveChild"
                  btnText="Save"
                  type="submit"
                  Icon={CheckIcon}
                />
              </div>
            ) : (
              <div className={styles.buttons__notEditing}>
                <ActionButton
                  className="editChild"
                  btnText="Edit"
                  onClick={handleEditClick}
                />
              </div>
            )}
          </div>
        </form>
      ) : (
        <p className={styles.loadingContainer}>Loading ...</p>
      )}
    </>
  );
}

export default CustomerProfile;
