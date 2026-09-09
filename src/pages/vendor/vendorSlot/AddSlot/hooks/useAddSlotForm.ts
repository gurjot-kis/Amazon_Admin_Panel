import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useAddVendorSlotMutation,
  useUpdateVendorSlotMutation,
  useGetVendorSlotByIdQuery,
} from "../../../../../features/vendor/vendorApi";
import { initialState, type SlotFormState } from "../utils/addSlotTypes";
import {
  TIME_RE,
  COORD_LAT_RE,
  COORD_LNG_RE,
  minutesOf,
  todayStr,
  to24Hour,
} from "../utils/addSlotUtils";

export function useAddSlotForm(slotId?: string) {
  const navigate = useNavigate();
  const isEditMode = Boolean(slotId);

  const [form, setForm] = useState<SlotFormState>(initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const {
    data: slotRes,
    isLoading: isSlotLoading,
    isError: isSlotError,
  } = useGetVendorSlotByIdQuery(slotId as string, {
    skip: !slotId,
  });

  const [addVendorSlot, { isLoading: isCreating }] = useAddVendorSlotMutation();
  const [updateVendorSlot, { isLoading: isUpdating }] =
    useUpdateVendorSlotMutation();

  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (!slotRes?.data) return;

    const slot = slotRes.data;
    const coordinates = slot.location?.coordinates ?? [];
    const longitude =
      coordinates[0] !== undefined ? String(coordinates[0]) : "";
    const latitude = coordinates[1] !== undefined ? String(coordinates[1]) : "";

    const formattedDate = slot.date?.includes("T")
      ? slot.date.split("T")[0]
      : (slot.date ?? "");

    setForm({
      category_id: slot.category_id || "",
      date: formattedDate,
      startTime: to24Hour(slot.startTime || ""),
      endTime: to24Hour(slot.endTime || ""),
      longitude,
      latitude,
    });
  }, [slotRes]);

  const setField = (field: keyof SlotFormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const markAllTouched = () =>
    setTouched({
      category_id: true,
      date: true,
      startTime: true,
      endTime: true,
      latitude: true,
      longitude: true,
    });

  const errors = {
    category_id:
      touched.category_id && !form.category_id
        ? "Select a service category."
        : "",
    date: !touched.date
      ? ""
      : !form.date
        ? "Date is required."
        : !isEditMode && form.date < todayStr()
          ? "Date cannot be in the past."
          : "",
    startTime: !touched.startTime
      ? ""
      : !form.startTime
        ? "Start time is required."
        : !TIME_RE.test(form.startTime)
          ? "Enter a valid time."
          : "",
    endTime: !touched.endTime
      ? ""
      : !form.endTime
        ? "End time is required."
        : !TIME_RE.test(form.endTime)
          ? "Enter a valid time."
          : form.startTime &&
              minutesOf(form.endTime) <= minutesOf(form.startTime)
            ? "End must be after start."
            : minutesOf(form.endTime) - minutesOf(form.startTime) < 15
              ? "Minimum 15-minute slot."
              : "",
    latitude: !touched.latitude
      ? ""
      : !form.latitude
        ? "Latitude is required."
        : !COORD_LAT_RE.test(form.latitude)
          ? "Valid range: −90 to 90."
          : "",
    longitude: !touched.longitude
      ? ""
      : !form.longitude
        ? "Longitude is required."
        : !COORD_LNG_RE.test(form.longitude)
          ? "Valid range: −180 to 180."
          : "",
  };

  const isFormValid =
    !!form.category_id &&
    !!form.date &&
    (isEditMode || form.date >= todayStr()) &&
    TIME_RE.test(form.startTime) &&
    TIME_RE.test(form.endTime) &&
    minutesOf(form.endTime) > minutesOf(form.startTime) &&
    minutesOf(form.endTime) - minutesOf(form.startTime) >= 15 &&
    COORD_LAT_RE.test(form.latitude) &&
    COORD_LNG_RE.test(form.longitude);

  const step1Done = !!form.category_id;
  const step2Done =
    !!form.date &&
    TIME_RE.test(form.startTime) &&
    TIME_RE.test(form.endTime) &&
    minutesOf(form.endTime) > minutesOf(form.startTime);
  const step3Done =
    COORD_LAT_RE.test(form.latitude) && COORD_LNG_RE.test(form.longitude);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    markAllTouched();
    if (!isFormValid) return;

    const payload = {
      category_id: form.category_id,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      location: {
        coordinates: [
          parseFloat(form.longitude),
          parseFloat(form.latitude),
        ] as [number, number],
      },
    };

    try {
      if (isEditMode && slotId) {
        await updateVendorSlot({ slotId, payload }).unwrap();
        toast.success("Slot updated successfully", {
          description: `${form.date} · ${form.startTime}–${form.endTime}`,
        });
      } else {
        await addVendorSlot(payload).unwrap();
        toast.success("Slot created successfully", {
          description: `${form.date} · ${form.startTime}–${form.endTime}`,
        });
      }
      navigate(-1);
    } catch (err: any) {
      toast.error(
        isEditMode ? "Failed to update slot" : "Failed to create slot",
        {
          description: err?.data?.message ?? "Something went wrong. Try again.",
        },
      );
    }
  };

  return {
    form,
    errors,
    touched,
    isEditMode,
    isSubmitting,
    isSlotLoading,
    isSlotError,
    isFormValid,
    step1Done,
    step2Done,
    step3Done,
    setField,
    markTouched,
    handleSubmit,
  };
}
