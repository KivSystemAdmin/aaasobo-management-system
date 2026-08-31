"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import type { EnrollmentStatusCustomer } from "@shared/schemas/admins";
import styles from "./EnrollmentStatusList.module.scss";

const PAGE_SIZES = [30, 50, 100];

const japanesePlanName = (planName: string) =>
  planName.split(" / ", 1)[0].trim();

export default function EnrollmentStatusList({
  customers,
}: {
  customers: EnrollmentStatusCustomer[];
}) {
  const [query, setQuery] = useState("");
  const [pageSize, setPageSizeState] = useState(30);
  const [page, setPageState] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(
    () => new Set(customers.slice(0, 30).map(({ id }) => id)),
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLocaleLowerCase().includes(term) ||
        customer.subscriptions.some(({ recurringClasses }) =>
          recurringClasses.some(
            (recurringClass) =>
              recurringClass.instructor.toLocaleLowerCase().includes(term) ||
              recurringClass.children.some((child) =>
                child.toLocaleLowerCase().includes(term),
              ),
          ),
        ),
    );
  }, [customers, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const resetToFirstPage = (nextPageSize = pageSize, nextQuery = query) => {
    setPageState(0);
    const normalized = nextQuery.trim().toLocaleLowerCase();
    const nextFiltered = normalized
      ? customers.filter(
          (customer) =>
            customer.name.toLocaleLowerCase().includes(normalized) ||
            customer.subscriptions.some(({ recurringClasses }) =>
              recurringClasses.some(
                (item) =>
                  item.instructor.toLocaleLowerCase().includes(normalized) ||
                  item.children.some((child) =>
                    child.toLocaleLowerCase().includes(normalized),
                  ),
              ),
            ),
        )
      : customers;
    setExpandedIds(
      new Set(nextFiltered.slice(0, nextPageSize).map(({ id }) => id)),
    );
  };

  const changePage = (nextPage: number) => {
    setPageState(nextPage);
    setExpandedIds(
      new Set(
        filtered
          .slice(nextPage * pageSize, (nextPage + 1) * pageSize)
          .map(({ id }) => id),
      ),
    );
  };

  return (
    <main className={styles.container}>
      <h1>カスタマーリスト</h1>
      <p className={styles.description}>
        お客さまごとの契約プランと、現在有効な定期クラスの割当状況を表示します。
      </p>
      <div className={styles.controls}>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            resetToFirstPage(pageSize, event.target.value);
          }}
          placeholder="お客さま・お子さま・講師を検索"
          aria-label="受講状況を検索"
        />
        <div className={styles.controlButtons}>
          <button
            type="button"
            onClick={() => setExpandedIds(new Set(visible.map(({ id }) => id)))}
          >
            すべて開く
          </button>
          <button type="button" onClick={() => setExpandedIds(new Set())}>
            すべて閉じる
          </button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className={styles.empty}>該当するお客さまが見つかりません</p>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.enrollmentTable}>
            <thead>
              <tr>
                <th>お客さま</th>
                <th>プラン</th>
                <th>お子さま</th>
                <th>講師</th>
                <th>曜日</th>
                <th>時間</th>
                <th>期間</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((customer) => {
                const expanded = expandedIds.has(customer.id);
                const subscriptions = customer.subscriptions.filter(
                  ({ recurringClasses }) => recurringClasses.length,
                );
                return (
                  <Fragment key={customer.id}>
                    <tr className={styles.customerRow}>
                      <td colSpan={7}>
                        <button
                          type="button"
                          aria-label={`${customer.name}の詳細を${expanded ? "閉じる" : "開く"}`}
                          aria-expanded={expanded}
                          onClick={() =>
                            setExpandedIds((current) => {
                              const next = new Set(current);
                              expanded
                                ? next.delete(customer.id)
                                : next.add(customer.id);
                              return next;
                            })
                          }
                        >
                          {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        </button>
                        <Link href={`/admins/customer-list/${customer.id}`}>
                          {customer.name}
                        </Link>
                      </td>
                    </tr>
                    {expanded && subscriptions.length === 0 && (
                      <tr className={styles.noClassesRow}>
                        <td></td>
                        <td colSpan={6}>現在受講中のクラスはありません</td>
                      </tr>
                    )}
                    {expanded &&
                      subscriptions.map((subscription) =>
                        subscription.recurringClasses.map((item, index) => (
                          <tr className={styles.classRow} key={item.id}>
                            <td></td>
                            {index === 0 && (
                              <td
                                className={styles.planCell}
                                rowSpan={subscription.recurringClasses.length}
                              >
                                {japanesePlanName(subscription.planName)}
                              </td>
                            )}
                            <td>{item.children.join(", ") || "—"}</td>
                            <td>{item.instructor}</td>
                            <td>{item.weekday}</td>
                            <td>{item.time}</td>
                            <td>
                              {item.startDate}〜{item.endDate}
                            </td>
                          </tr>
                        )),
                      )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length > 0 && (
        <nav className={styles.pagination} aria-label="ページネーション">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              type="button"
              key={index}
              className={page === index ? styles.activePage : undefined}
              onClick={() => changePage(index)}
              aria-current={page === index ? "page" : undefined}
            >
              {index + 1}
            </button>
          ))}
          <label>
            表示件数
            <select
              value={pageSize}
              onChange={(event) => {
                const size = Number(event.target.value);
                setPageSizeState(size);
                resetToFirstPage(size);
              }}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}件
                </option>
              ))}
            </select>
          </label>
        </nav>
      )}
    </main>
  );
}
