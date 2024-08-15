"use client";

import styles from "./CustomerProfile.module.scss";
import { useEffect, useState } from "react";
import { getCustomerById, editCustomer } from "@/app/helper/customersApi";
import {
  UserCircleIcon,
  EnvelopeIcon,
  HomeIcon,
  PencilIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { prefectures } from "@/app/helper/data";
import ActionButton from "../../ActionButton";

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
      alert(data.message);

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
        <form className={styles.formContainer} onSubmit={handleFormSubmit}>
          {/* Customer Name */}
          <div className={styles.field}>
            <label className={styles.label}>
              <p className={styles.label__text}>Name</p>
              <div className={styles.inputWrapper}>
                <input
                  className={`${styles.inputField} ${isEditing ? styles.editable : ""}`}
                  type="text"
                  value={customer.name}
                  readOnly={!isEditing}
                  onChange={(e) => {
                    if (isEditing) {
                      setCustomer({ ...customer, name: e.target.value });
                    }
                  }}
                  required
                />
                <UserCircleIcon className={styles.icon} />
              </div>
            </label>
          </div>

          {/* Customer email */}
          <div className={styles.field}>
            <label className={styles.label}>
              <p className={styles.label__text}>E-mail</p>
              <div className={styles.inputWrapper}>
                <input
                  className={`${styles.inputField} ${isEditing ? styles.editable : ""}`}
                  type="email"
                  value={customer.email}
                  readOnly={!isEditing}
                  onChange={(e) => {
                    if (isEditing) {
                      setCustomer({ ...customer, email: e.target.value });
                    }
                  }}
                  required
                />
                <EnvelopeIcon className={styles.icon} />
              </div>
            </label>
          </div>

          {/* Customer prefecture */}
          <div className={styles.field}>
            <label className={styles.label}>
              <p className={styles.label__text}>Prefecture</p>
              <div className={styles.inputWrapper}>
                {isEditing ? (
                  <select
                    className={`${styles.inputField} ${isEditing ? styles.editable : ""}`}
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
                  <input
                    className={styles.inputField}
                    type="text"
                    value={customer.prefecture}
                    readOnly
                  />
                )}
                <HomeIcon className={styles.icon} />
              </div>
            </label>
          </div>

          <div className={styles.buttonContainer}>
            {isEditing ? (
              <div className={styles.buttonContainer__editing}>
                <ActionButton
                  className="cancelBtn"
                  btnText="Cancel"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleCancelClick();
                  }}
                />

                <ActionButton
                  className="saveBtn"
                  btnText="Save"
                  type="submit"
                  Icon={ArrowPathIcon}
                />
              </div>
            ) : (
              <div className={styles.buttonContainer__notEditing}>
                <ActionButton
                  className="editBtn"
                  btnText="Edit"
                  onClick={handleEditClick}
                  Icon={PencilIcon}
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
