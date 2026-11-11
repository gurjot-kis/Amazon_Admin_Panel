import React, { useEffect } from "react";
import { useGetDashboardQuery } from "../../features/dashboard/dashboardApi";
import "../../styles/dashboard/admin_dashboard.css";
import { useHeader } from "../../layout/LayoutContext";
import { useNavigate } from "react-router-dom";

const Icons = {
  Wallet: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  Orders: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Products: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  ),
  Users: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  TrendUp: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 12, height: 12 }}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
};

export default function Dashboard(): React.ReactElement {
  const { data: response, isLoading } = useGetDashboardQuery();
  const dashboard = response?.data;
  const navigate = useNavigate();

  const { setHeaderConfig } = useHeader();

  useEffect(() => {
    setHeaderConfig({
      title: "Dashboard",
      subtitle: "Overview of your platform’s performance and activity",
    });
  }, [setHeaderConfig]);

  const formatCurrency = (val: string | number | undefined) => {
    if (val === undefined || val === null) return "₹0";
    const num = typeof val === "string" ? parseFloat(val) : val;
    return isNaN(num)
      ? "₹0"
      : new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(num);
  };

  const cards = [
    {
      id: "earnings",
      title: "Total Revenue",
      value: formatCurrency(dashboard?.totalEarning),
      variant: "earnings",
      icon: <Icons.Wallet />,
      badge: "Platform Volume",
      caption: "All time completed",
      navigatePath: "orders",
    },
    {
      id: "orders",
      title: "Total Orders",
      value: dashboard?.totalOrders?.toLocaleString() ?? "0",
      variant: "orders",
      icon: <Icons.Orders />,
      badge: "Fulfilled",
      caption: "Total bookings & sales",
      navigatePath: "orders",
    },
    {
      id: "products",
      title: "Catalog Items",
      value: dashboard?.totalProducts?.toLocaleString() ?? "0",
      variant: "products",
      icon: <Icons.Products />,
      badge: "Active",
      caption: "Live services & products",
      navigatePath: "",
    },
    {
      id: "users",
      title: "Total Customers",
      value: dashboard?.totalUsers?.toLocaleString() ?? "0",
      variant: "users",
      icon: <Icons.Users />,
      badge: "Accounts",
      caption: "Registered platform users",
      navigatePath: "users",
    },
  ];

  return (
    <div className="db-grid">
      {cards.map((card) => {
        if (isLoading) {
          return (
            <div
              key={card.id}
              className="db-stat-card"
              style={{ cursor: card.navigatePath ? "pointer" : "default" }}
            >
              <div className="db-card-header">
                <div>
                  <div className="db-card-skeleton db-card-skeleton--title" />
                  <div className="db-card-skeleton db-card-skeleton--val" />
                </div>
                <div className="db-card-skeleton db-card-skeleton--icon" />
              </div>
            </div>
          );
        }

        return (
          <div
            key={card.id}
            className={`db-stat-card db-stat-card--${card.variant}`}
            onClick={() => {
              if (card.navigatePath) {
                navigate(`/admin/${card.navigatePath}`);
              }
            }}
          >
            <div className="db-card-header">
              <div>
                <h4 className="db-card-title">{card.title}</h4>
                <p className="db-card-value">{card.value}</p>
              </div>
              <div className="db-card-icon">{card.icon}</div>
            </div>

            <div className="db-card-footer">
              <span className="db-card-badge">
                <Icons.TrendUp />
                {card.badge}
              </span>
              <span className="db-card-caption">{card.caption}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
