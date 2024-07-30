"use client";

import { useState } from "react";

// Define the Tab interface
interface Tab {
  label: string;
  content: React.ReactNode;
}

// Configure the Tab component
const Tab: React.FC<{
  label: string;
  onClick: () => void;
  isActive: boolean;
}> = ({ label, onClick, isActive }) => {
  return (
    <button
      onClick={onClick}
      style={{ fontWeight: isActive ? "bold" : "normal" }}
    >
      {label}
    </button>
  );
};

// Configure the TabContent component
const TabContent: React.FC<{ content: React.ReactNode }> = ({ content }) => {
  return <>{content}</>;
};

// Configure the TabFunction component
const TabFunction: React.FC<{ tabs: Tab[] }> = ({ tabs }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  return (
    <>
      <div>
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
    </>
  );
};

export default TabFunction;
