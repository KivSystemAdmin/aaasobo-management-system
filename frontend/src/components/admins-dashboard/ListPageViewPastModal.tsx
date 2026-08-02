"use client";

import styles from "./ListPageViewPastModal.module.scss";
import ListTable from "@/components/admins-dashboard/ListTable";

const ListPageViewPastModal = ({
  fetchedData,
  pastListTableProps,
}: {
  fetchedData: any[];
  pastListTableProps: PastListTableProps;
}) => {
  if (!pastListTableProps) return null;
  const {
    listType,
    omitItems,
    linkItems,
    linkUrls,
    replaceItems,
    userType,
    categoryType,
    linkTarget,
    width,
  } = pastListTableProps;
  return (
    <div className={styles.modalContent} style={{ width: width }}>
      <ListTable
        listType={listType}
        fetchedData={fetchedData}
        omitItems={omitItems}
        linkItems={linkItems}
        linkUrls={linkUrls}
        itemNameLabels={pastListTableProps.itemNameLabels}
        replaceItems={replaceItems}
        userType={userType}
        categoryType={categoryType}
        linkTarget={linkTarget}
      />
    </div>
  );
};

export default ListPageViewPastModal;
