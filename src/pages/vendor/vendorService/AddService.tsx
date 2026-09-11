import React, { useState, useMemo } from "react";
import { useGetActiveCategoriesQuery } from "../../../features/category/categoryApi";
import type { Category } from "../../../features/category/categoryTypes";
import CategoryThumb from "../../../components/CategoryThumb";
import "../../../styles/vendor/AddVendorService.css";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";
import { toast } from "sonner";
import {
  useAddVendorServicesMutation,
  useGetAllVendorServicesQuery,
} from "../../../features/vendor/vendorApi";
import { useNavigate } from "react-router-dom";

interface ParentWithLeaves {
  parent: Category;
  leaves: Category[];
}
const ASSET_URL = import.meta.env.VITE_API_ASSET_URL ?? "";

function getImageUrl(path: string): string {
  if (!path) return "/placeholder-category.png";
  if (path.startsWith("http")) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${ASSET_URL}${clean}`;
}

function collectParentsWithLeaves(nodes: Category[]): ParentWithLeaves[] {
  const result: ParentWithLeaves[] = [];

  function isLeaf(node: Category): boolean {
    return !node.children || node.children.length === 0;
  }

  function walk(list: Category[]) {
    for (const node of list) {
      if (isLeaf(node)) continue;

      const activeChildren = (node.children ?? []).filter(
        (c) => c.status === "active",
      );

      if (activeChildren.length === 0) continue;

      if (activeChildren.every(isLeaf)) {
        result.push({ parent: node, leaves: activeChildren });
      } else {
        for (const child of activeChildren) {
          walk([child]);
        }
      }
    }
  }

  walk(nodes);
  return result;
}

const AddService: React.FC = () => {
  const { data, isLoading, isError } = useGetActiveCategoriesQuery();
  const [addVendorServices, { isLoading: isSubmitting }] =
    useAddVendorServicesMutation();
  const { data: existingServices } = useGetAllVendorServicesQuery();

  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [displayedParent, setDisplayedParent] =
    useState<ParentWithLeaves | null>(null);
  const [panelKey, setPanelKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const parentsWithLeaves = useMemo<ParentWithLeaves[]>(() => {
    if (!data?.data) return [];
    return collectParentsWithLeaves(data.data);
  }, [data]);

  const existingServiceIds = useMemo<Set<string>>(() => {
    if (!existingServices?.data) return new Set();
    return new Set(existingServices.data.map((s) => s.service._id));
  }, [existingServices]);

  const navigate = useNavigate();

  function handleCardClick(parentId: string) {
    if (activeParentId === parentId) {
      setActiveParentId(null);
    } else {
      const found =
        parentsWithLeaves.find((p) => p.parent._id === parentId) ?? null;
      setDisplayedParent(found);
      setActiveParentId(parentId);
      setPanelKey((k) => k + 1);
    }
  }

  const toggleLeaf = (id: string) => {
    if (existingServiceIds.has(id)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = (leaves: Category[]) => {
    const selectableLeaves = leaves.filter(
      (l) => !existingServiceIds.has(l._id),
    );

    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = selectableLeaves.every((l) => next.has(l._id));
      if (allSelected) {
        selectableLeaves.forEach((l) => next.delete(l._id));
      } else {
        selectableLeaves.forEach((l) => next.add(l._id));
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.warning("No services selected", {
        description: "Please select at least one service before saving.",
      });
      return;
    }

    try {
      await addVendorServices({
        service_ids: Array.from(selectedIds),
      }).unwrap();
      toast.success("Services added", {
        description: `${selectedIds.size} service${selectedIds.size > 1 ? "s" : ""} added successfully.`,
      });
      setSelectedIds(new Set());
      setActiveParentId(null);
      navigate("/vendor/services");
    } catch (err: any) {
      toast.error("Failed to add services", {
        description:
          err?.data?.message ?? "Something went wrong. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <FullScreenLoader
        title="Loading categories…"
        subtitle="Please wait while we load available services."
      />
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="vsa-center">
        <p className="as-error-text">Failed to load categories.</p>
      </div>
    );
  }

  return (
    <>
      <div className="vsa-root">
        <div className="vsa-header">
          <div>
            <h1 className="vsa-title">Add Service</h1>
            <p className="vsa-subtitle">
              Select a category, then choose the services you want to add.
            </p>
          </div>

          {selectedIds.size > 0 && (
            <div className="as-badge-wrap">
              <span className="as-count-badge">
                {selectedIds.size} selected
              </span>
              <button
                className="as-clear-btn"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="vsa-grid">
          {parentsWithLeaves.map(({ parent, leaves }) => {
            const selectedCount = leaves.filter((l) =>
              selectedIds.has(l._id),
            ).length;
            const addedCount = leaves.filter((l) =>
              existingServiceIds.has(l._id),
            ).length;
            const isActive = activeParentId === parent._id;

            return (
              <button
                key={parent._id}
                className={`vsa-card ${isActive ? "vsa-card--active" : ""}`}
                onClick={() => handleCardClick(parent._id)}
              >
                <div className="as-card-img-wrap">
                  <CategoryThumb
                    src={
                      parent.category_image
                        ? getImageUrl(parent.category_image)
                        : ""
                    }
                    alt={parent.name}
                    className="as-card-img"
                  />
                  {selectedCount > 0 && (
                    <span className="as-card-sel-dot">{selectedCount}</span>
                  )}
                  {addedCount > 0 && selectedCount === 0 && (
                    <span className="as-card-added-dot">✓</span>
                  )}
                </div>
                <p className="as-card-name">{parent.name}</p>
                <p className="as-card-count">{leaves.length} services</p>
                {isActive && <div className="as-card-active-bar" />}
              </button>
            );
          })}
        </div>

        {activeParentId && displayedParent && (
          <div
            key={panelKey}
            className={`vsa-panel ${activeParentId ? "vsa-panel--visible" : "vsa-panel--hiding"}`}
          >
            {/* Panel header */}
            <div className="as-panel-header">
              <div className="as-panel-title-row">
                <CategoryThumb
                  src={
                    displayedParent?.parent.category_image
                      ? getImageUrl(displayedParent.parent.category_image)
                      : ""
                  }
                  alt={displayedParent?.parent.name ?? ""}
                  className="as-panel-thumb"
                />
                <div>
                  <h2 className="as-panel-title">
                    {displayedParent?.parent.name}
                  </h2>
                  <p className="as-panel-desc">
                    {displayedParent?.parent.description}
                  </p>
                </div>
              </div>

              <div className="as-panel-actions">
                <button
                  className="as-sel-all-btn"
                  onClick={() =>
                    displayedParent && handleSelectAll(displayedParent.leaves)
                  }
                >
                  {(() => {
                    const selectable = (displayedParent?.leaves ?? []).filter(
                      (l) => !existingServiceIds.has(l._id),
                    );
                    return selectable.length > 0 &&
                      selectable.every((l) => selectedIds.has(l._id))
                      ? "Deselect all"
                      : "Select all";
                  })()}
                </button>
                <button
                  className="as-close-btn"
                  onClick={() => setActiveParentId(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Leaf cards */}
            <div className="as-leaf-grid">
              {(displayedParent?.leaves ?? []).map((leaf) => {
                const checked = selectedIds.has(leaf._id);
                const alreadyAdded = existingServiceIds.has(leaf._id);

                return (
                  <button
                    key={leaf._id}
                    className={`as-leaf-card ${checked ? "as-leaf-card--checked" : ""} ${alreadyAdded ? "as-leaf-card--added" : ""}`}
                    onClick={() => toggleLeaf(leaf._id)}
                    disabled={alreadyAdded}
                    title={
                      alreadyAdded
                        ? "Already added to your services"
                        : undefined
                    }
                  >
                    {alreadyAdded ? (
                      <div className="as-added-badge">
                        <svg
                          viewBox="0 0 12 10"
                          fill="none"
                          width="10"
                          height="10"
                        >
                          <path
                            d="M1 5l3.5 3.5L11 1"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div
                        className={`as-check ${checked ? "as-check--on" : ""}`}
                      >
                        {checked && (
                          <svg viewBox="0 0 12 10" fill="none">
                            <path
                              d="M1 5l3.5 3.5L11 1"
                              stroke="#fff"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    )}
                    <div className="as-leaf-img-wrap">
                      <CategoryThumb
                        src={
                          leaf.category_image
                            ? getImageUrl(leaf.category_image)
                            : ""
                        }
                        alt={leaf.name}
                        className="as-leaf-img"
                      />
                      {alreadyAdded && <div className="as-leaf-img-overlay" />}
                    </div>
                    <p className="as-leaf-name">{leaf.name}</p>
                    {alreadyAdded && (
                      <span className="as-leaf-added-label">Added</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="as-footer">
          <div className="as-footer-inner">
            <button
              className="as-submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving…"
                : `Save ${selectedIds.size} service${selectedIds.size > 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddService;
