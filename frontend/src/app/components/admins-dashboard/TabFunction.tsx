import { useState } from "react";
import styles from "./TabFunction.module.scss";
import Link from "next/link";

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
  activeTabName: string;
  initialActiveTab?: number;
}> = ({ tabs, breadcrumb, activeTabName, initialActiveTab = 0 }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(initialActiveTab);

  const handleTabClick = (index: number, activeTabName: string) => {
    setActiveTabIndex(index);
    localStorage.setItem(activeTabName, index.toString());
  };

  return (
    <>
      <nav className={styles.breadcrumb}>
        <ul className={styles.breadcrumb__list}>
          <li className={styles.breadcrumb__item}>
            <Link href={breadcrumb[1]} passHref>
              {breadcrumb[0]}{" "}
            </Link>
          </li>
          <li className={styles.breadcrumb__separator}>{" >> "}</li>
          <li className={styles.breadcrumb__item}>{breadcrumb[2]}</li>
        </ul>
      </nav>
      <div className={styles.tabWrapper}>
        <div className={styles.tabContainer}>
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              onClick={() => handleTabClick(index, activeTabName)}
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
