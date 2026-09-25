import { baseApi } from "../../store/api/baseApi";

import type {
  ApiResponse,
  CreateProductPayload,
  GetProductByIdResponse,
  GetProductsParams,
  GetProductsResponse,
  Product,
  ProductDetails,
  UpdateProductPayload,
} from "./productTypes";

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<GetProductsResponse, GetProductsParams>({
      query: ({ page, limit, search, category_id, status }) => {
        const params = new URLSearchParams();

        if (page !== undefined) params.set("page", String(page));
        if (limit !== undefined) params.set("limit", String(limit));
        if (search?.trim()) params.set("search", search.trim());
        if (category_id) params.set("category_id", category_id);
        if (status) params.set("status", status);

        const qs = params.toString();

        return {
          url: `/admin/product/list${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["Product"],
    }),

    getProductById: builder.query<GetProductByIdResponse, string>({
      query: (productId) => ({
        url: `/admin/product/${productId}`,
        method: "GET",
      }),

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["Product"],
    }),

    createProduct: builder.mutation<ApiResponse<Product>, CreateProductPayload>(
      {
        query: (data) => {
          const formData = new FormData();

          formData.append("name", data.name);
          if (data.description)
            formData.append("description", data.description);
          if (data.short_description)
            formData.append("short_description", data.short_description);
          formData.append("category_id", data.category_id);
          formData.append("sku", data.sku);
          formData.append("currency", data.currency);
          formData.append("costPrice", String(data.costPrice));
          formData.append("sellingPrice", String(data.sellingPrice));
          formData.append("price", String(data.price));
          if (data.stock !== undefined)
            formData.append("stock", String(data.stock));

          // Main image
          if (data.mainImage instanceof File) {
            formData.append("mainImage", data.mainImage);
          }

          // Featured images (only when no variants)
          if (!data.hasVariants && data.featuredImages?.length) {
            data.featuredImages.forEach((file) => {
              formData.append("featuredImages", file);
            });
          }

          formData.append("hasVariants", String(data.hasVariants ?? false));

          if (data.hasVariants && data.variantTypes?.length) {
            formData.append("variantTypes", JSON.stringify(data.variantTypes));
          }

          // Variants & their files
          if (data.hasVariants && data.variants?.length) {
            // 1. Append variant binary files to FormData under indexed keys
            data.variants.forEach((v: any, index: number) => {
              if (Array.isArray(v.images)) {
                v.images.forEach((file: any) => {
                  if (file instanceof File) {
                    formData.append(`variant_${index}_images`, file);
                  }
                });
              }
            });

            // 2. Strip out File instances from JSON to avoid empty {} strings
            const sanitizedVariants = data.variants.map((v: any) => ({
              combination: v.combination,
              sku: v.sku,
              costPrice: v.costPrice,
              sellingPrice: v.sellingPrice,
              price: v.price,
              stock: v.stock,
              images: Array.isArray(v.images)
                ? v.images.filter((img: any) => typeof img === "string")
                : [],
            }));

            formData.append("variants", JSON.stringify(sanitizedVariants));
          }

          return {
            url: "/admin/product/create",
            method: "POST",
            body: formData,
          };
        },
        extraOptions: { requiresAuth: true },
        invalidatesTags: ["Product"],
      },
    ),

    updateProduct: builder.mutation<
      ApiResponse<ProductDetails>,
      {
        productId: string;
        data: UpdateProductPayload;
      }
    >({
      query: ({ productId, data }) => {
        const formData = new FormData();

        if (data.name !== undefined) {
          formData.append("name", data.name);
        }

        if (data.description !== undefined) {
          formData.append("description", data.description);
        }

        if (data.short_description !== undefined) {
          formData.append("short_description", data.short_description);
        }

        if (data.category_id !== undefined) {
          formData.append("category_id", data.category_id);
        }

        if (data.sku !== undefined) {
          formData.append("sku", data.sku);
        }

        if (data.currency !== undefined) {
          formData.append("currency", data.currency);
        }

        if (data.costPrice !== undefined) {
          formData.append("costPrice", String(data.costPrice));
        }

        if (data.sellingPrice !== undefined) {
          formData.append("sellingPrice", String(data.sellingPrice));
        }

        if (data.price !== undefined) {
          formData.append("price", String(data.price));
        }

        if (data.stock !== undefined) {
          formData.append("stock", String(data.stock));
        }

        // Main image
        if (data.mainImage instanceof File) {
          formData.append("mainImage", data.mainImage);
        }

        // Featured images
        if (data.featuredImages?.length) {
          data.featuredImages.forEach((file) => {
            formData.append("featuredImages", file);
          });
        }

        if (data.hasVariants !== undefined) {
          formData.append("hasVariants", String(data.hasVariants));
        }

        // Variant types
        if (data.variantTypes) {
          formData.append("variantTypes", JSON.stringify(data.variantTypes));
        }

        // Variants
        if (data.variants) {
          data.variants.forEach((v, index) => {
            if (Array.isArray(v.images)) {
              v.images.forEach((file) => {
                if (file instanceof File) {
                  formData.append(`variant_${index}_images`, file);
                }
              });
            }
          });

          const sanitizedVariants = data.variants.map((v) => ({
            _id: (v as any)._id,
            combination: v.combination,
            sku: v.sku,
            costPrice: v.costPrice,
            sellingPrice: v.sellingPrice,
            price: v.price,
            stock: v.stock,

            images: Array.isArray(v.images)
              ? v.images.filter((img) => typeof img === "string")
              : [],
          }));

          formData.append("variants", JSON.stringify(sanitizedVariants));
        }

        return {
          url: `/admin/product/${productId}/update`,
          method: "PUT",
          body: formData,
        };
      },

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["Product"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
} = productApi;
