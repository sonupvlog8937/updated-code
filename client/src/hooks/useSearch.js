import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSuggestions,
  performSearch,
  fetchSearchDefaults,
  fetchRecentSearches,
  setSearchQuery,
  setIsDropdownOpen,
  setActiveIndex,
  clearSearchState,
} from "../store/searchSlice";

const DEBOUNCE_MS = 250;

/**
 * Intelligent search hook with debounce, abort, and keyboard navigation.
 */
export default function useSearch({ autoLoadDefaults = true } = {}) {
  const dispatch = useDispatch();
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const {
    search,
    loading,
    suggestionsLoading,
    suggestions,
    recentSearches,
    topSearches,
    trending,
    products,
    categories,
    brands,
    shops,
    related,
    didYouMean,
    popularCategories,
    popularBrands,
    popular,
    error,
    isDropdownOpen,
    activeIndex,
    totalProducts,
    page,
    totalPages,
    filterOptions,
  } = useSelector((state) => state.search);

  useEffect(() => {
    if (autoLoadDefaults) {
      dispatch(fetchSearchDefaults());
      dispatch(fetchRecentSearches());
    }
  }, [dispatch, autoLoadDefaults]);

  const debouncedFetchSuggestions = useCallback(
    (query) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        dispatch(fetchSuggestions({ query }));
      }, DEBOUNCE_MS);
    },
    [dispatch],
  );

  const onQueryChange = useCallback(
    (value) => {
      dispatch(setSearchQuery(value));
      dispatch(setIsDropdownOpen(true));
      dispatch(setActiveIndex(-1));
      debouncedFetchSuggestions(value);
    },
    [dispatch, debouncedFetchSuggestions],
  );

  const onFocus = useCallback(() => {
    dispatch(setIsDropdownOpen(true));
    if (!search.trim()) {
      dispatch(fetchSearchDefaults());
      dispatch(fetchRecentSearches());
    }
  }, [dispatch, search]);

  const onClose = useCallback(() => {
    dispatch(setIsDropdownOpen(false));
    dispatch(setActiveIndex(-1));
  }, [dispatch]);

  const executeSearch = useCallback(
    (query = search, options = {}) => {
      const trimmed = String(query || "").trim();
      if (!trimmed) return Promise.resolve(null);
      dispatch(setSearchQuery(trimmed));
      // Return the unwrapped promise so we can access the actual result
      return dispatch(performSearch({ query: trimmed, ...options })).unwrap();
    },
    [dispatch, search],
  );

  const selectableItems = useMemo(() => {
    const items = [];
    if (didYouMean) items.push({ type: "correction", value: didYouMean });
    suggestions.forEach((s) => items.push({ type: "suggestion", value: s }));
    products.slice(0, 5).forEach((p) => items.push({ type: "product", value: p.name, product: p }));
    return items;
  }, [didYouMean, suggestions, products]);

  const onKeyDown = useCallback(
    (event) => {
      if (!isDropdownOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = Math.min(activeIndex + 1, selectableItems.length - 1);
        dispatch(setActiveIndex(next));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        const prev = Math.max(activeIndex - 1, -1);
        dispatch(setActiveIndex(prev));
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (activeIndex >= 0 && selectableItems[activeIndex]) {
          executeSearch(selectableItems[activeIndex].value);
        } else {
          executeSearch();
        }
      }
    },
    [isDropdownOpen, activeIndex, selectableItems, dispatch, onClose, executeSearch],
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const recentKeywords = useMemo(
    () => recentSearches.map((r) => (typeof r === "string" ? r : r.keyword)).filter(Boolean),
    [recentSearches],
  );

  return {
    wrapperRef,
    search,
    loading,
    suggestionsLoading,
    suggestions,
    recentKeywords,
    topSearches,
    trending,
    products,
    categories,
    brands,
    shops,
    related,
    didYouMean,
    popularCategories,
    popularBrands,
    popular,
    error,
    isDropdownOpen,
    activeIndex,
    totalProducts,
    page,
    totalPages,
    filterOptions,
    onQueryChange,
    onFocus,
    onClose,
    executeSearch,
    onKeyDown,
    clearSearch: () => dispatch(clearSearchState()),
    openDropdown: () => dispatch(setIsDropdownOpen(true)),
  };
}
