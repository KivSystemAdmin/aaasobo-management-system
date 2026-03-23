"use client";

import { getRecurringClassesBySubscriptionId } from "@/lib/api/recurringClassesApi";
import { getChildrenByCustomerId } from "@/lib/api/childrenApi";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./RegularClassesTable.module.scss";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import RegularClassCard from "./RegularClassCard";
import EditRegularClassModal from "./EditRegularClassModal";
import {
  PREVIOUS_REGULAR_CLASSES,
  LOADING_TEXT,
  NO_REGULAR_CLASSES_MESSAGE,
} from "@/lib/messages/customerDashboard";

function RegularClassesTable({
  subscriptionId,
  userSessionType,
  adminId,
  customerId,
  customerTerminationAt,
  language,
  isSelectable,
  selectedRecurringIds,
  onToggleRecurring,
  plan,
  refreshKey,
}: {
  subscriptionId: number;
  userSessionType?: UserType;
  adminId?: number;
  customerId: number;
  customerTerminationAt?: string | null;
  language: LanguageType;
  isSelectable?: boolean;
  selectedRecurringIds?: number[];
  onToggleRecurring?: (id: number) => void;
  plan?: Plan;
  refreshKey?: number;
}) {
  const router = useRouter();
  const [activeRecurringClasses, setActiveRecurringClasses] = useState<
    RecurringClass[]
  >([]);
  const [historyRecurringClasses, setHistoryRecurringClasses] = useState<
    RecurringClass[]
  >([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [editingClass, setEditingClass] = useState<RecurringClass | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);

  // Fetch active classes and children on component mount
  useEffect(() => {
    const fetchActiveClasses = async () => {
      try {
        const data = await getRecurringClassesBySubscriptionId(
          subscriptionId,
          "active",
        );
        setActiveRecurringClasses(data.recurringClasses);
      } catch (error) {
        console.error("Failed to fetch active classes:", error);
      }
    };

    const fetchHistoryCount = async () => {
      try {
        // For now, fetch history to get count - in production, we'd want a separate count endpoint
        const data = await getRecurringClassesBySubscriptionId(
          subscriptionId,
          "history",
        );
        setHistoryCount(data.recurringClasses.length);
        // Cache the data if it's small to avoid refetch
        if (
          data.recurringClasses.length > 0 &&
          data.recurringClasses.length <= 10
        ) {
          setHistoryRecurringClasses(data.recurringClasses);
          setHistoryLoaded(true);
        }
      } catch (error) {
        console.error("Failed to fetch history count:", error);
      }
    };

    const fetchChildren = async () => {
      try {
        const children = await getChildrenByCustomerId(customerId);
        setAllChildren(children);
      } catch (error) {
        console.error("Failed to fetch children:", error);
      }
    };

    fetchActiveClasses();
    fetchHistoryCount();
    fetchChildren();
  }, [subscriptionId, customerId, updateCount, refreshKey]);

  // Fetch history classes when user expands the section
  const handleToggleHistory = async () => {
    if (!showHistory && !historyLoaded) {
      setHistoryLoading(true);
      try {
        const data = await getRecurringClassesBySubscriptionId(
          subscriptionId,
          "history",
        );
        setHistoryRecurringClasses(data.recurringClasses);
        setHistoryLoaded(true);
      } catch (error) {
        console.error("Failed to fetch history classes:", error);
      } finally {
        setHistoryLoading(false);
      }
    }
    setShowHistory(!showHistory);
  };

  const handleEditRegularClass = (recurringClassId: number) => {
    const classToEdit = activeRecurringClasses.find(
      (cls) => cls.id === recurringClassId,
    );
    if (classToEdit) {
      setEditingClass(classToEdit);
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingClass(null);
  };

  const handleEditSuccess = () => {
    setUpdateCount((count) => count + 1);
    router.refresh();
    handleCloseEditModal();
  };

  return (
    <div>
      {activeRecurringClasses.length > 0 && (
        <div className={styles.cardGrid}>
          {activeRecurringClasses.map((recurringClass) => (
            <RegularClassCard
              key={recurringClass.id}
              recurringClass={recurringClass}
              onEdit={handleEditRegularClass}
              language={language}
              userSessionType={userSessionType}
              customerTerminationAt={customerTerminationAt}
              isSelectable={isSelectable}
              selected={
                selectedRecurringIds?.includes(recurringClass.id) ?? false
              }
              onToggle={() => onToggleRecurring?.(recurringClass.id)}
            />
          ))}
        </div>
      )}

      {!isSelectable && historyCount > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <div
            className={styles.subheading}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            onClick={handleToggleHistory}
          >
            <h4>
              {PREVIOUS_REGULAR_CLASSES[language]} ({historyCount})
            </h4>
            {historyLoading ? (
              <div style={{ fontSize: "0.875rem", color: "#666" }}>
                {LOADING_TEXT[language]}
              </div>
            ) : showHistory ? (
              <ChevronUpIcon className={styles.icon} />
            ) : (
              <ChevronDownIcon className={styles.icon} />
            )}
          </div>
          {showHistory && historyLoaded && (
            <div className={styles.cardGrid}>
              {historyRecurringClasses.map((recurringClass) => (
                <RegularClassCard
                  key={recurringClass.id}
                  recurringClass={recurringClass}
                  language={language}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeRecurringClasses.length === 0 && historyCount === 0 && (
        <p>{NO_REGULAR_CLASSES_MESSAGE[language]}</p>
      )}

      {/* Edit Modal */}
      {editingClass && (
        <EditRegularClassModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          recurringClass={editingClass}
          customerId={customerId}
          allChildren={allChildren}
          userSessionType={userSessionType}
          adminId={adminId}
          onSuccess={handleEditSuccess}
          plan={plan}
        />
      )}
    </div>
  );
}

export default RegularClassesTable;
