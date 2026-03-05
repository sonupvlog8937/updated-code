import React, { useEffect, useMemo, useRef, useState } from "react";
import "../Search/style.css";
import Button from "@mui/material/Button";
import { IoSearch } from "react-icons/io5";
import { useAppContext } from "../../hooks/useAppContext";
import { useLocation, useNavigate } from "react-router-dom";
import { postData } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";
import { IoTimeOutline } from "react-icons/io5";
import { IoClose } from "react-icons/io5";

const TRENDING_TERMS = [
  "shirt",
  "jeans",
  "t shirts",
  "bag",
  "watches",
  "trouser",
];

const POPULAR_TERMS = [
  "formal pant",
  "zara jeans",
  "formal shirt",
  "baggy jeans",
  "black shirt",
  "white shirt",
];

const MAX_TYPEAHEAD_SUGGESTIONS = 7;

const Search = () => {

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [querySuggestions, setQuerySuggestions] = useState([]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestedCorrection, setSuggestedCorrection] = useState("");
  const [aiHintSummary, setAiHintSummary] = useState("");
  const [aiHintHighlights, setAiHintHighlights] = useState([]);

  const context = useAppContext();

  const history = useNavigate();
  const location = useLocation();
  const STORAGE_KEY = "recent_searches_v1";
  const searchWrapperRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const normalizedSuggestions = useMemo(() => {
    return querySuggestions
      ?.map((item) => item?.toLowerCase()?.trim())
      .filter(Boolean)
      .slice(0, 10);
  }, [querySuggestions]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) {
        setRecentSearches(saved.slice(0, 6));
      }
    } catch (error) {
      setRecentSearches([]);
    }
  }, []);

  const performSearch = (query = searchQuery) => {
    const trimmedQuery = query.trim();


    if (trimmedQuery === "") {
      context?.alertBox("error", "Please type something to search");
      return;
    }

    setIsDropdownOpen(false);
    setIsLoading(true);

    const obj = {
      page: 1,
      limit: 20,
      query: trimmedQuery,
    };

    postData(`/api/product/search/get`, obj).then((res) => {
      context?.setSearchData(res);

      setRecentSearches((prev) => {
        const uniqueValues = [trimmedQuery, ...prev.filter((item) => item !== trimmedQuery)];
        const nextValues = uniqueValues.slice(0, 6);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextValues));
        return nextValues;
      });

      setTimeout(() => {
        setIsLoading(false);
        context?.setOpenSearchPanel(false);
        history(`/search?query=${encodeURIComponent(trimmedQuery)}&page=1`);
      }, 500);
    });
  };

  const onChangeInput = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsDropdownOpen(true);
  };

  const onSelectSuggestion = (suggestion) => {
    setSearchQuery(suggestion);
    performSearch(suggestion);
  };

  const onClearSearch = () => {
    setSearchQuery("");
    setQuerySuggestions([]);
    setSuggestedProducts([]);
    setSuggestedCorrection("");
    setAiHintSummary("");
    setAiHintHighlights([]);
    setIsDropdownOpen(true);
  };

  const onKeyDownInput = (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryValue = params.get("query") || "";
    setSearchQuery(queryValue);
  }, [location.search]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!searchWrapperRef.current?.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (context?.openSearchPanel) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [context?.openSearchPanel]);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setQuerySuggestions([]);
      setSuggestedProducts([]);
      setSuggestedCorrection("");
      setAiHintSummary("");
      setAiHintHighlights([]);
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      postData(`/api/product/search/get`, {
        page: 1,
        limit: 8,
        query: searchQuery.trim(),
      }).then((res) => {
        setQuerySuggestions(res?.suggestions || []);
        setSuggestedProducts(res?.suggestionProducts || []);
        setSuggestedCorrection(res?.correctedQuery || "");
        setAiHintSummary(res?.aiInsights?.summary || "");
        setAiHintHighlights((res?.aiInsights?.highlights || []).slice(0, 2));
      });
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const predictiveSuggestions = useMemo(() => {
    return [...new Set(normalizedSuggestions)].slice(0, 10);
  }, [normalizedSuggestions]);

   const typeaheadSuggestions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) return [];

    const fallbackPool = [
      ...recentSearches,
      ...TRENDING_TERMS,
      ...POPULAR_TERMS,
      ...suggestedProducts.map((item) => item?.name || ""),
    ];

    const ranked = [...predictiveSuggestions, ...fallbackPool]
      .map((item) => item?.toString().trim())
      .filter(Boolean)
      .filter((item) => item.toLowerCase().includes(normalizedQuery));

    return [...new Set(ranked)].slice(0, MAX_TYPEAHEAD_SUGGESTIONS);
  }, [searchQuery, recentSearches, predictiveSuggestions, suggestedProducts]);


  const hasLiveSuggestions =
    typeaheadSuggestions.length > 0 ||
    suggestedProducts.length > 0 ||
    Boolean(suggestedCorrection) ||
    Boolean(aiHintSummary);

  return (
    <div ref={searchWrapperRef} className="searchContainer relative w-[100%]">
      <div className="searchBox w-[100%] h-[50px] bg-[#e5e5e5] rounded-[8px] relative p-2 border border-transparent focus-within:border-[#0d6efd]">
        <IoSearch className="absolute left-[14px] top-[14px] text-[22px] text-[#666] cursor-pointer" onClick={() => inputRef.current?.focus()} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for Products, Brands and More"
          className="w-full h-[35px] focus:outline-none bg-inherit pl-10 pr-14 text-[15px]"
          value={searchQuery}
          onFocus={() => setIsDropdownOpen(true)}
          onChange={onChangeInput}
          onKeyDown={onKeyDownInput}
        />
        {searchQuery.trim().length > 0 && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute top-[11px] right-[46px] z-50 text-[#666] hover:text-black"
            onClick={onClearSearch}
          >
            <IoClose className="text-[20px]" />
          </button>
        )}
        <Button
          className="!absolute top-[8px] right-[5px] z-50 !w-[37px] !min-w-[37px] h-[37px] !rounded-full !text-black"
          onClick={() => performSearch()}
        >
          {isLoading === true ? <CircularProgress /> : <IoSearch className="text-[#4e4e4e] text-[22px]" />}
        </Button>
      </div>

      {isDropdownOpen && (
        <div className="searchDropdown absolute top-[56px] left-0 w-full bg-[#efefef] rounded-[8px] shadow-lg z-[200] p-3 max-h-[75vh] overflow-y-auto">
          {searchQuery.trim().length > 0 && hasLiveSuggestions ? (
            <ul className="searchSuggestionsList">
              {suggestedCorrection && suggestedCorrection !== searchQuery.trim().toLowerCase() && (
                <li>
                  <button type="button" className="didYouMeanBtn" onClick={() => onSelectSuggestion(suggestedCorrection)}>
                    <span className="font-[500] text-[14px] text-[#6a6a6a]">Did you mean</span>
                    <span className="font-[700]">{suggestedCorrection}</span>
                  </button>
                </li>
              )}
              {aiHintSummary && (
                <li>
                  <div className="rounded-[8px] bg-[#e8f2ff] p-2 mb-1">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#2e63b8] font-[700]">AI suggestion</p>
                    <p className="text-[12px] text-[#1e1e1e]">{aiHintSummary}</p>
                    {aiHintHighlights.length > 0 && (
                      <ul className="mt-1 text-[11px] text-[#3f3f3f] list-disc pl-4">
                        {aiHintHighlights.map((hint) => (
                          <li key={hint}>{hint}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              )}
              {typeaheadSuggestions.map((item) => (
                <li key={item}>
                  <button type="button" onClick={() => onSelectSuggestion(item)}>
                    <IoSearch className="text-[20px] text-[#3d3d3d]" />
                    <span>{item}</span>
                  </button>
                </li>
              ))}
               {suggestedProducts.length > 0 && (
                <li className="mt-2 pt-2 border-t border-[#d0d0d0]">
                  <h4 className="searchSectionTitle">Suggested products</h4>
                  <div className="flex flex-col gap-2 mt-2">
                    {suggestedProducts.map((product) => (
                      <button
                        key={product?._id || product?.name}
                        type="button"
                        className="text-left bg-white/70 rounded-[8px] p-2 hover:bg-white transition"
                        onClick={() => onSelectSuggestion(product?.name || "")}
                      >
                        <p className="text-[13px] font-[600] leading-[1.2]">{product?.name}</p>
                        {product?.brand && (
                          <p className="text-[11px] text-[#5b5b5b] mt-[2px]">Brand: {product?.brand}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </li>
              )}
            </ul>
          ) : (
            <>
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  {recentSearches.map((item) => (
                    <button key={item} type="button" className="searchChip" onClick={() => onSelectSuggestion(item)}>
                      <IoTimeOutline /> {item}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <h4 className="searchSectionTitle">Trending</h4>
                <ul className="searchSuggestionsList">
                  {TRENDING_TERMS.map((item) => (
                    <li key={item}>
                      <button type="button" onClick={() => onSelectSuggestion(item)}>
                        <IoSearch className="text-[20px] text-[#595959]" />
                        <span>{item}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t mt-3 border-[#d6d6d6]">
                <h4 className="searchSectionTitle text-center">Most Searched</h4>
                <div className="popularTermsWrap">
                  {POPULAR_TERMS.map((item) => (
                    <button key={item} type="button" className="popularTerm" onClick={() => onSelectSuggestion(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
export default Search;
