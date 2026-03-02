import React, { useEffect, useMemo, useRef, useState } from "react";
import "../Search/style.css";
import Button from "@mui/material/Button";
import { IoSearch } from "react-icons/io5";
import { useAppContext } from "../../hooks/useAppContext";
import { useNavigate } from "react-router-dom";
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
  "touser",
];

const POPULAR_TERMS = [
  "formal paint",
  "zara jeans",
  "formal shirt",
  "baggy jeans",
  "black shirt",
  "white shirt",
];

const Search = () => {

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [liveSuggestions, setLiveSuggestions] = useState([]);

  const context = useAppContext();

  const history = useNavigate();
  const searchWrapperRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
    const inputRef = useRef(null);

  const normalizedSuggestions = useMemo(() => {
    return liveSuggestions
      ?.map((item) => item?.name)
      .filter(Boolean)
      .slice(0, 8);
  }, [liveSuggestions]);

  const performSearch = (query = searchQuery) => {
    const trimmedQuery = query.trim();


    if (trimmedQuery === "") {
      context?.alertBox("error", "Please type something to search");
      return;
    }

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
        return uniqueValues.slice(0, 4);
      });

      setTimeout(() => {
        setIsLoading(false);
        setIsDropdownOpen(false);
        context?.setOpenSearchPanel(false);
        history("/search");
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
    setLiveSuggestions([]);
    setIsDropdownOpen(true);
  };

  const onKeyDownInput = (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

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
      setLiveSuggestions([]);
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      postData(`/api/product/search/get`, {
        page: 1,
        limit: 8,
        query: searchQuery.trim(),
      }).then((res) => {
        setLiveSuggestions(res?.products || []);
      });
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

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
          {normalizedSuggestions.length > 0 ? (
            <ul className="searchSuggestionsList">
              {normalizedSuggestions.map((item) => (
                <li key={item}>
                  <button type="button" onClick={() => onSelectSuggestion(item)}>
                    <IoSearch className="text-[20px] text-[#3d3d3d]" />
                    <span>{item}</span>
                  </button>
                </li>
              ))}
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
