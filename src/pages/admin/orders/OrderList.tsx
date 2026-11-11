import { useEffect, useState, useMemo } from "react";
import { MdStorefront, MdPerson } from "react-icons/md";
import { useGetAdminOrderCountQuery } from "../../../features/order/orderApi";
import type { AdminOrderStore } from "../../../features/order/orderTypes";
import { DataTable } from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { useHeader } from "../../../layout/LayoutContext";

import "../../../styles/order/AdminOrderList.css";

const PAGE_LIMIT = 10;
const ASSET_URL = (import.meta.env.VITE_API_ASSET_URL as string) || "";

const AdminOrderList = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { setHeaderConfig } = useHeader();

  useEffect(() => {
    setHeaderConfig({
      title: "Store Orders Overview",
    });
  }, [setHeaderConfig]);

  // Debounced Search Handling
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetAdminOrderCountQuery({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
    });

  const stores: AdminOrderStore[] = data?.data?.stores ?? [];
  const pagination = data?.data?.pagination;

  // Aggregate stats across the visible stores
  const summary = useMemo(() => {
    return stores.reduce(
      (acc, curr) => ({
        totalOrders: acc.totalOrders + (curr.orderCount || 0),
        totalRevenue: acc.totalRevenue + (curr.orderAmount || 0),
      }),
      { totalOrders: 0, totalRevenue: 0 },
    );
  }, [stores]);

  const columns: DataTableColumn<AdminOrderStore>[] = [
    {
      key: "store_name",
      header: "Store",
      isPrimary: true,
      render: (store) => {
        const logoUrl = store.store_logo
          ? store.store_logo.startsWith("http")
            ? store.store_logo
            : `${ASSET_URL}${store.store_logo}`
          : null;

        return (
          <div className="d-flex align-items-center gap-3">
            <span className="aol-thumb">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={store.store_name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "d-none",
                    );
                  }}
                />
              ) : null}
              <span className={`aol-thumb-fallback ${logoUrl ? "d-none" : ""}`}>
                <MdStorefront size={22} />
              </span>
            </span>

            <div className="aol-store-info">
              <span className="aol-store-name">{store.store_name}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "vendor_name",
      header: "Vendor",
      render: (store) => {
        const avatarUrl = store.vendor_image
          ? store.vendor_image.startsWith("http")
            ? store.vendor_image
            : `${ASSET_URL}${store.vendor_image}`
          : null;

        return (
          <div className="d-flex align-items-center gap-2">
            <span className="aol-avatar">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={store.vendor_name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "d-none",
                    );
                  }}
                />
              ) : (
                <span>
                  {store.vendor_name ? (
                    store.vendor_name.charAt(0).toUpperCase()
                  ) : (
                    <MdPerson size={16} />
                  )}
                </span>
              )}
            </span>
            <span className="aol-vendor-name">{store.vendor_name || "—"}</span>
          </div>
        );
      },
    },
    {
      key: "orderCount",
      header: "Total Orders",
      render: (store) => (
        <span className="aol-count-badge">
          {store.orderCount.toLocaleString()}{" "}
          {store.orderCount === 1 ? "order" : "orders"}
        </span>
      ),
    },
    {
      key: "itemsAmount",
      header: "Items Amount",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (store) => (
        <span style={{ fontSize: "0.875rem", color: "#475569" }}>
          ₹{store.itemsAmount.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "orderAmount",
      header: "Total Order Amount",
      render: (store) => (
        <div>
          <div className="aol-amount-text">
            ₹{store.orderAmount.toLocaleString("en-IN")}
          </div>
          <div className="aol-sub-amount">
            Avg: ₹
            {store.orderCount > 0
              ? Math.round(store.orderAmount / store.orderCount).toLocaleString(
                  "en-IN",
                )
              : 0}
          </div>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      statPills={[
        { label: `${pagination?.total ?? stores.length} stores`, navy: true },
        { label: `${summary.totalOrders.toLocaleString()} total orders` },
        {
          label: `₹${summary.totalRevenue.toLocaleString("en-IN")} total volume`,
        },
      ]}
      columns={columns}
      data={stores}
      getId={(store) => store.store_id}
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Search by store or vendor name..."
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      errorMessage={`Couldn't load order counts${
        error && "status" in error ? ` (${error.status})` : ""
      }.`}
      onRetry={refetch}
      emptyMessage={
        search
          ? `No store orders match "${search}".`
          : "No store order data available."
      }
      pagination={pagination}
      onPageChange={setPage}
    />
  );
};

export default AdminOrderList;
