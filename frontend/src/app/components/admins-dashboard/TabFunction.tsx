import { useState } from "react";
import styles from "./TabFunction.module.scss";

// Configure the Tab component
const Tab: React.FC<{
  label: string;
  onClick: () => void;
  isActive: boolean;
}> = ({ label, onClick, isActive }) => {
  return (
    <button
      onClick={onClick}
      className={`${styles.tabButton} ${
        isActive ? styles.active : styles.inactive
      }`}
    >
      {label}
    </button>
  );
};

// Configure the TabContent component
const TabContent: React.FC<{ content: React.ReactNode }> = ({ content }) => {
  return <div className={styles.tabContent}>{content}</div>;
};

// Configure the TabFunction component
const TabFunction: React.FC<{
  tabs: Tab[];
  breadcrumb: string[];
  initialActiveTab?: number;
}> = ({ tabs, breadcrumb, initialActiveTab = 0 }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(initialActiveTab);

  return (
    <>
      <p className={styles.breadcrumb}>{breadcrumb.join(" > ")}</p>
      <div className={styles.tabWrapper}>
        <div className={styles.tabContainer}>
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              onClick={() => setActiveTabIndex(index)}
              isActive={index === activeTabIndex}
            />
          ))}
        </div>
        <TabContent content={tabs[activeTabIndex].content} />
      </div>
    </>
  );
};

export default TabFunction;
