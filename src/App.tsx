import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import {
  AdminProtectedRoute,
  VendorProtectedRoute,
} from "./components/ProtectedRoute";
import { VENDOR_ROUTES, ROUTES } from "./routes";
import DashboardPage from "./pages/admin/DashboardPage";
import ProfilePage from "./pages/admin/profile/ProfilePage";
import SupportPage from "./pages/SupportPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VendorProfilePage from "./pages/vendor/VendorProfilePage";
import VendorSupportPage from "./pages/vendor/VendorSupportPage";
import CategoryList from "./pages/admin/category/CategoryList";
import Layout from "./layout/admin/Layout";
import AddCategory from "./pages/admin/category/AddCategory";
import { CustomToaster } from "./components/common/CustomToaster";
import ProductList from "./pages/admin/product/ProductList";
import AddProduct from "./pages/admin/product/AddProduct";
import ProductDetails from "./pages/admin/product/ProductDetails";
import AllOrderList from "./pages/admin/orders/AllOrderList";
import OrderDetails from "./pages/admin/orders/OrderDetails";
import UserList from "./pages/admin/user/UserList";
import VendorList from "./pages/admin/vendor/VendorList";
import AddVendor from "./pages/admin/vendor/AddVendor";
import VendorDashboardPage from "./pages/vendor/VendorDashboardPage";
import VendorLayout from "./layout/vendor/VendorLayout";
import VendorSlotList from "./pages/vendor/vendorSlot/SlotList";
import AddSlot from "./pages/vendor/vendorSlot/AddSlot";

function App() {
  return (
    <>
      <CustomToaster />
      <Routes>
        <Route path="/" element={<Navigate to={ROUTES.login} replace />} />
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.verifyOtp} element={<VerifyOtpPage />} />
        <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
        <Route element={<VendorProtectedRoute />}>
          <Route element={<VendorLayout />}>
            <Route
              path={VENDOR_ROUTES.dashboard}
              element={<VendorDashboardPage />}
            />
            <Route path={VENDOR_ROUTES.profile} element={<VendorProfilePage />} />
            <Route path={VENDOR_ROUTES.support} element={<VendorSupportPage />} />

            <Route path={VENDOR_ROUTES.slots} element={<VendorSlotList/>}/>
            <Route path={VENDOR_ROUTES.addSlot} element={<AddSlot/>}/>
            <Route path={VENDOR_ROUTES.editSlot} element={<AddSlot/>}/>
          </Route>
        </Route>
        <Route element={<AdminProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path={ROUTES.dashboard} element={<DashboardPage />} />

            <Route path={ROUTES.categories} element={<CategoryList />} />
            <Route path={ROUTES.addCategory} element={<AddCategory />} />
            <Route path={ROUTES.editCategory} element={<AddCategory />} />

            <Route path={ROUTES.products} element={<ProductList />} />
            <Route path={ROUTES.productsNew} element={<AddProduct />} />
            <Route path={ROUTES.productEdit} element={<AddProduct />} />
            <Route path={ROUTES.productDetails} element={<ProductDetails />} />

            <Route path={ROUTES.orders} element={<AllOrderList />} />
            <Route path={ROUTES.orderDetails} element={<OrderDetails />} />

            <Route path={ROUTES.profile} element={<ProfilePage />} />
            <Route path={ROUTES.users} element={<UserList />} />

            <Route path={ROUTES.vendors} element={<VendorList />} />
            <Route path={ROUTES.vendorCreate} element={<AddVendor />} />
            <Route path={ROUTES.vendorEdit} element={<AddVendor />} />

            <Route path={ROUTES.support} element={<SupportPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
      </Routes>
    </>
  );
}

export default App;
