import { useAppDispatch, useAppSelector } from "../store";

export const useAppContext = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.app);
  return { ...state, dispatch };
};

export { useAppDispatch, useAppSelector };
