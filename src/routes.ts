export const PUBLIC_ROUTES = {
  login: "/login",
  forgotPassword: "/forgot-password",
  verifyOtp: "/verify-otp",
  resetPassword: "/reset-password",
} as const;

export const ROUTES = {
  ...PUBLIC_ROUTES,
  dashboard: "/admin/dashboard",

  categories: "/admin/categories",
  addCategory: "/admin/categories/add",
  editCategory: "/admin/categories/:categoryId/edit",

  variantType: "/admin/variant-type",

  variantOption: "/admin/variant-option",
  addVariantOption: "/admin/variant-option/add",
  editVariantOption: "/admin/variant-option/:id/edit",

  orders: "/admin/orders",
  orderDetails: "/admin/orders/:orderId/details",

  users: "/admin/users",
  profile: "/admin/profile",

  vendors: "/admin/vendors",
  vendorCreate: "/admin/vendors/add",
  vendorEdit: "admin/vendors/:vendorId/edit",

  cartSettings: "/admin/cart-settings",
  addCartSettings: "/admin/cart-settings/add",
  editCartSettings: "/admin/cart-settings/:id/edit",

  stores: "/admin/stores",
  storeDetails: "/admin/store/:storeId/details",

  support: "/admin/support",
} as const;

export const VENDOR_ROUTES = {
  dashboard: "/vendor/dashboard",
  profile: "/vendor/profile",
  support: "/vendor/support",

  products: "/vendor/products",
  productsNew: "/vendor/products/add",
  productEdit: "/vendor/products/:productId/edit",
  productDetails: "/vendor/products/:productId/details",

  stores: "/vendor/stores",
  addStore: "/vendor/store/add",
  editStore: "/vendor/store/:storeId/edit",
} as const;
