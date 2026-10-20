import { Navigate, Route, Routes } from "react-router-dom";
import {
  AdminProtectedRoute,
  VendorProtectedRoute,
} from "./components/ProtectedRoute";
import { VENDOR_ROUTES, ROUTES } from "./routes";
import { CustomToaster } from "./components/common/CustomToaster";
import "./App.css";
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
import ProductList from "./pages/vendor/product/ProductList";
import AddProduct from "./pages/vendor/product/AddProduct";
import ProductDetails from "./pages/vendor/product/ProductDetails";
import AllOrderList from "./pages/admin/orders/AllOrderList";
import OrderDetails from "./pages/admin/orders/OrderDetails";
import UserList from "./pages/admin/user/UserList";
import VendorList from "./pages/admin/vendor/VendorList";
import AddVendor from "./pages/admin/vendor/AddVendor";
import VendorDashboardPage from "./pages/vendor/VendorDashboardPage";
import VendorLayout from "./layout/vendor/VendorLayout";
import VariantType from "./pages/admin/variant/VariantType";
import VariantOption from "./pages/admin/variant/VariantOption";
import AddVariantOption from "./pages/admin/variant/AddVariantOption";
import CartSettingsList from "./pages/admin/cart-settings/CartSettingsList";
import CreateCartSettings from "./pages/admin/cart-settings/CreateCartSettings";
import { default as AdminStoreList } from "./pages/admin/store/StoreList";
import { default as VendorStoreList } from "./pages/vendor/store/StoreList";
import StoreDetails from "./pages/admin/store/StoreDetails";
import AddStore from "./pages/vendor/store/AddStore";

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
            <Route
              path={VENDOR_ROUTES.profile}
              element={<VendorProfilePage />}
            />
            <Route
              path={VENDOR_ROUTES.support}
              element={<VendorSupportPage />}
            />
            <Route path={VENDOR_ROUTES.products} element={<ProductList />} />
            <Route path={VENDOR_ROUTES.productsNew} element={<AddProduct />} />
            <Route path={VENDOR_ROUTES.productEdit} element={<AddProduct />} />
            <Route
              path={VENDOR_ROUTES.productDetails}
              element={<ProductDetails />}
            />

            <Route path={VENDOR_ROUTES.stores} element={<VendorStoreList />} />
            <Route path={VENDOR_ROUTES.addStore} element={<AddStore />} />
            <Route path={VENDOR_ROUTES.editStore} element={<AddStore />} />
          </Route>
        </Route>
        <Route element={<AdminProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path={ROUTES.dashboard} element={<DashboardPage />} />

            <Route path={ROUTES.categories} element={<CategoryList />} />
            <Route path={ROUTES.addCategory} element={<AddCategory />} />
            <Route path={ROUTES.editCategory} element={<AddCategory />} />

            <Route path={ROUTES.orders} element={<AllOrderList />} />
            <Route path={ROUTES.orderDetails} element={<OrderDetails />} />

            <Route path={ROUTES.profile} element={<ProfilePage />} />
            <Route path={ROUTES.users} element={<UserList />} />

            <Route path={ROUTES.vendors} element={<VendorList />} />
            <Route path={ROUTES.vendorCreate} element={<AddVendor />} />
            <Route path={ROUTES.vendorEdit} element={<AddVendor />} />

            <Route path={ROUTES.variantType} element={<VariantType />} />
            <Route path={ROUTES.variantOption} element={<VariantOption />} />
            <Route
              path={ROUTES.addVariantOption}
              element={<AddVariantOption />}
            />
            <Route
              path={ROUTES.editVariantOption}
              element={<AddVariantOption />}
            />

            <Route path={ROUTES.cartSettings} element={<CartSettingsList />} />
            <Route
              path={ROUTES.addCartSettings}
              element={<CreateCartSettings />}
            />
            <Route
              path={ROUTES.editCartSettings}
              element={<CreateCartSettings />}
            />

            <Route path={ROUTES.stores} element={<AdminStoreList />} />
            <Route path={ROUTES.storeDetails} element={<StoreDetails />} />

            <Route path={ROUTES.support} element={<SupportPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
      </Routes>
    </>
  );
}

export default App;
