
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchItems,
  deleteItem,
  getPublicUrl,
} from "./inventoryService";
import ItemForm from "./ItemForm";
import AdminLayout from "../../../components/AdminLayout";

import {
  Boxes,
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Filter,
  Download,
  ImageIcon,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

const Items = () => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const load = async () => {
    try {
      const { data } = await fetchItems();
      setItems(data || []);
    } catch (error) {
      console.error("Lỗi tải vật tư:", error);
      alert("Không thể tải danh sách vật tư!");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Xoá vật tư?")) return;

    try {
      await deleteItem(id);
      await load();
    } catch (error) {
      console.error(error);
      alert("Xoá vật tư thất bại!");
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />;
    }

    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary" />
    );
  };

  const SortableHeader = ({ label, column }) => (
    <th className="table-head-cell">
      <button
        type="button"
        onClick={() => handleSort(column)}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap hover:text-primary ${
          sortConfig.key === column ? "font-bold text-primary" : ""
        }`}
      >
        {label}
        <SortIcon column={column} />
      </button>
    </th>
  );

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    let result = items.filter((item) => {
      const matchesSearch =
        (item.name || "").toLowerCase().includes(keyword) ||
        (item.code || "").toLowerCase().includes(keyword);

      const isActive =
        item.status !== false &&
        item.status !== 0 &&
        item.status !== "inactive";

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      return matchesSearch && matchesStatus;
    });

    if (sortConfig.key) {
      const { key, direction } = sortConfig;

      result = [...result].sort((a, b) => {
        const valueA = a[key] ?? "";
        const valueB = b[key] ?? "";

        let comparison = 0;

        if (["price", "stock_min", "qty_on_hand"].includes(key)) {
          comparison =
            Number(valueA || 0) - Number(valueB || 0);
        } else if (key === "status") {
          const getStatus = (value) =>
            value === false ||
            value === 0 ||
            value === "inactive" ? 0 : 1;

          comparison = getStatus(valueA) - getStatus(valueB);
        } else {
          comparison = String(valueA).localeCompare(
            String(valueB),
            "vi",
            { numeric: true, sensitivity: "base" }
          );
        }

        return direction === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [items, search, statusFilter, sortConfig]);

  const handleExport = () => {
    const headers = [
      "Mã vật tư",
      "Tên vật tư",
      "Đơn vị",
      "Đơn giá",
      "Định mức tồn",
      "Số lượng tồn",
      "Ghi chú",
    ];

    const rows = filtered.map((item) => [
      item.code || "",
      item.name || "",
      item.unit || "",
      item.price || 0,
      item.stock_min || 0,
      item.qty_on_hand || 0,
      item.note || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "danh-sach-vat-tu.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="page-shell">
        <div className="page-header">
          <div className="page-header-main">
            <div className="page-header-icon">
              <Boxes className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            <div>
              <h2 className="page-header-title">Danh mục vật tư</h2>
              <p className="page-header-subtitle">
                Quản lý danh sách vật tư trong kho
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="btn-primary inline-flex items-center gap-2 px-4"
          >
            <Plus className="h-4 w-4" />
            Thêm mới
          </button>
        </div>

        <div className="card-portal overflow-hidden p-0">
          <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Package className="h-4 w-4 text-primary" />
                Tất cả vật tư
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc mã vật tư..."
                    className="input-portal w-full min-w-[200px] py-2.5 pl-9 pr-3"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <select
                  className="input-portal w-auto min-h-[44px] py-2.5 pl-3 pr-8"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng</option>
                </select>

                <button
                  onClick={handleExport}
                  className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>

                <Link
                  to="/admin/inventory/categories"
                  className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5"
                >
                  <Filter className="h-4 w-4" />
                  Nhóm vật tư
                </Link>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Đang hiển thị <strong>{filtered.length}</strong>/{items.length} vật tư.
              </p>

              {sortConfig.key && (
                <button
                  onClick={() =>
                    setSortConfig({ key: null, direction: "asc" })
                  }
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Xoá sắp xếp
                </button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Boxes className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                Không tìm thấy vật tư
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Thử thay đổi từ khoá tìm kiếm hoặc bộ lọc
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="table-head-row">
                  <tr>
                    <SortableHeader label="Trạng thái" column="status" />
                    <th className="table-head-cell">Ảnh</th>
                    <SortableHeader label="Mã vật tư" column="code" />
                    <SortableHeader label="Tên vật tư" column="name" />
                    <SortableHeader label="Đơn vị" column="unit" />
                    <SortableHeader label="Đơn giá" column="price" />
                    <SortableHeader label="Định mức tồn" column="stock_min" />
                    <SortableHeader label="Số lượng tồn" column="qty_on_hand" />
                    <SortableHeader label="Ghi chú" column="note" />
                    <th className="table-head-cell text-center">Thao tác</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filtered.map((it) => {
                    const url = it.image_path
                      ? getPublicUrl(it.image_path)
                      : null;

                    const isLowStock =
                      Number(it.qty_on_hand || 0) <
                      Number(it.stock_min || 0);

                    const isActive =
                      it.status !== false &&
                      it.status !== 0 &&
                      it.status !== "inactive";

                    return (
                      <tr key={it.id} className="table-row">
                        <td className="table-cell">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                              isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {isActive ? "Hoạt động" : "Ngừng"}
                          </span>
                        </td>

                        <td className="table-cell w-16">
                          {url ? (
                            <img
                              src={url}
                              alt={it.name || "Vật tư"}
                              className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
                              <ImageIcon className="h-5 w-5 text-slate-400" />
                            </div>
                          )}
                        </td>

                        <td className="table-cell font-medium text-slate-800">
                          {it.code || "—"}
                        </td>

                        <td className="table-cell text-slate-700">
                          {it.name}
                        </td>

                        <td className="table-cell text-slate-500">
                          {it.unit || "—"}
                        </td>

                        <td className="table-cell whitespace-nowrap text-slate-700">
                          {Number(it.price || 0).toLocaleString("vi-VN")} ₫
                        </td>

                        <td className="table-cell text-slate-500">
                          {it.stock_min || 0}
                        </td>

                        <td className="table-cell">
                          <span
                            className={`font-semibold ${
                              isLowStock ? "text-red-600" : "text-slate-700"
                            }`}
                          >
                            {Number(it.qty_on_hand || 0)}
                          </span>
                          {isLowStock && (
                            <span className="ml-1 text-xs text-red-500">
                              (Thấp)
                            </span>
                          )}
                        </td>

                        <td className="table-cell max-w-[150px] truncate text-slate-500">
                          {it.note || <span className="text-slate-400">—</span>}
                        </td>

                        <td className="table-cell text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200"
                              onClick={() => {
                                setEditing(it);
                                setShowForm(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Sửa
                            </button>

                            <button
                              type="button"
                              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                              onClick={() => handleDelete(it.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Xoá
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showForm && (
          <ItemForm
            initialData={editing}
            onClose={() => {
              setShowForm(false);
              setEditing(null);
              load();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default Items;
