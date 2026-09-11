export const PUBLIC_ROUTES = {
  login: "/login",
  forgotPassword: "/forgot-password",
  verifyOtp: "/verify-otp",
  resetPassword: "/reset-password",
} as const;

export const ROUTES = {
  ...PUBLIC_ROUTES,
  //Worked by kshitish start
  dashboard: "/admin/dashboard",

  categories: "/admin/categories",
  addCategory: "/admin/categories/add",
  editCategory: "/admin/categories/:categoryId/edit",

  products: "/admin/products",
  productsNew: "/admin/products/add",
  productEdit: "/admin/products/:productId/edit",
  productDetails: "/admin/products/:productId/details",

  orders: "/admin/orders",
  orderDetails: "/admin/orders/:orderId/details",

  users: "/admin/users",
  profile: "/admin/profile",

  vendors: "/admin/vendors",
  vendorCreate: "/admin/vendors/add",
  vendorEdit: "admin/vendors/:vendorId/edit",

  support: "/admin/support",
  //Worked by kshitish end
} as const;

export const VENDOR_ROUTES = {
  dashboard: "/vendor/dashboard",
  profile: "/vendor/profile",
  support: "/vendor/support",

  slots: "/vendor/slots",
  addSlot: "/vendor/slots/add",
  editSlot: "/vendor/slots/:slotId/edit",

  serviceList: "/vendor/services",
  addService:"/vendor/services/add",
  editService:"/vendor/services/:serviceId/edit"
} as const;
