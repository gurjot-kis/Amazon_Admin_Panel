export interface SlotFormState {
  category_id: string;
  date: string;
  startTime: string;
  endTime: string;
  longitude: string;
  latitude: string;
}

export const initialState: SlotFormState = {
  category_id: "",
  date: "",
  startTime: "",
  endTime: "",
  longitude: "",
  latitude: "",
};

export interface PreLeafCategory {
  _id: string;
  name: string;
  level: number;
  category_image: string;
  parentName?: string;
}