import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppContext } from "../../hooks/useAppContext";
import { useLocation, useNavigate } from "react-router-dom";
import { postData } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";
import { IoSearch, IoTimeOutline, IoClose, IoFlameOutline, IoSparklesOutline } from "react-icons/io5";

const TRENDING_TERMS = ["shirt", "jeans", "t shirts", "bag", "watches", "trouser"];
const POPULAR_TERMS = ["formal pant", "zara jeans", "formal shirt", "baggy jeans", "black shirt", "white shirt"];
const MAX_TYPEAHEAD_SUGGESTIONS = 7;

const styles = `
  .search-root * { box-sizing: border-box; }

  .search-wrapper {
    position: relative;
    width: 100%;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .search-box {
    display: flex;
    align-items: center;
    width: 100%;
    height: 52px;
    background: #ffffff;
    border-radius: 14px;
    border: 1.5px solid #e0e0e0;
    padding: 0 8px 0 16px;
    gap: 8px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .search-box:focus-within {
    border-color: #1a1a2e;
    box-shadow: 0 0 0 4px rgba(26, 26, 46, 0.07);
  }

  .search-icon {
    font-size: 18px;
    color: #9e9e9e;
    flex-shrink: 0;
    transition: color 0.2s;
  }

  .search-box:focus-within .search-icon {
    color: #1a1a2e;
  }

  .search-input {
    flex: 1;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-size: 14.5px;
    color: #1a1a2e;
    font-family: inherit;
    letter-spacing: -0.01em;
  }

  .search-input::placeholder { color: #b0b0b0; }

  .clear-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #b0b0b0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 50%;
    transition: background 0.15s, color 0.15s;
    flex-shrink: 0;
  }

  .clear-btn:hover { background: #f0f0f0; color: #555; }

  .search-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: #1a1a2e;
    color: #fff;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.2s, transform 0.1s;
  }

  .search-btn:hover { background: #2d2d50; }
  .search-btn:active { transform: scale(0.96); }

  .search-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 100%;
    background: #ffffff;
    border-radius: 16px;
    border: 1.5px solid #ececec;
    box-shadow: 0 12px 40px rgba(0,0,0,0.10);
    z-index: 200;
    overflow: hidden;
    animation: dropIn 0.15s ease;
  }

  @keyframes dropIn {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .dropdown-scroll {
    max-height: 72vh;
    overflow-y: auto;
    padding: 8px;
  }

  .dropdown-scroll::-webkit-scrollbar { width: 4px; }
  .dropdown-scroll::-webkit-scrollbar-track { background: transparent; }
  .dropdown-scroll::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }

  .section-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9e9e9e;
    padding: 6px 10px 4px;
  }

  .section-label svg { font-size: 13px; }

  .suggestion-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .suggestion-list li button,
  .suggestion-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 10px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    border-radius: 10px;
    font-family: inherit;
    font-size: 14px;
    color: #1a1a2e;
    transition: background 0.13s;
    letter-spacing: -0.01em;
  }

  .suggestion-list li button:hover,
  .suggestion-item:hover { background: #f5f5f7; }

  .sugg-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: #f0f0f2;
    flex-shrink: 0;
    font-size: 14px;
    color: #5a5a7a;
  }

  .recent-icon { background: #f0f3ff; color: #4a6cf7; }
  .trending-icon { background: #fff2f0; color: #e74c3c; }

  .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 6px 8px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 20px;
    background: #f2f2f5;
    border: none;
    font-family: inherit;
    font-size: 12.5px;
    color: #3a3a5c;
    cursor: pointer;
    transition: background 0.13s, transform 0.1s;
    font-weight: 500;
    letter-spacing: -0.01em;
  }

  .chip:hover { background: #e8e8ef; transform: translateY(-1px); }
  .chip.recent-chip { background: #eef1ff; color: #4a6cf7; }
  .chip.recent-chip:hover { background: #dde3ff; }
  .chip.popular-chip { background: #fff0f5; color: #e91e8c; border: 1px solid #ffd6e8; }
  .chip.popular-chip:hover { background: #ffe0ed; }

  .divider {
    height: 1px;
    background: #f0f0f0;
    margin: 4px 0;
  }

  .did-you-mean-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 9px 12px;
    border: 1.5px dashed #d0d0e0;
    background: transparent;
    border-radius: 10px;
    font-family: inherit;
    font-size: 13.5px;
    cursor: pointer;
    margin-bottom: 4px;
    transition: background 0.13s, border-color 0.13s;
    color: #1a1a2e;
  }

  .did-you-mean-btn:hover { background: #f8f8ff; border-color: #9999cc; }
  .did-you-mean-label { color: #9e9e9e; font-size: 12px; }
  .did-you-mean-word { font-weight: 600; color: #4a6cf7; }

  .ai-card {
    background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%);
    border: 1px solid #dde2ff;
    border-radius: 12px;
    padding: 10px 12px;
    margin-bottom: 4px;
  }

  .ai-card-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #6c63ff;
    margin-bottom: 4px;
  }

  .ai-card-label svg { font-size: 12px; }

  .ai-summary {
    font-size: 13px;
    color: #2a2a4a;
    line-height: 1.5;
    margin: 0;
  }

  .ai-highlights {
    margin: 6px 0 0;
    padding-left: 14px;
    list-style-position: outside;
  }

  .ai-highlights li {
    font-size: 12px;
    color: #4a4a7a;
    line-height: 1.5;
    margin-bottom: 2px;
  }

  .product-card {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    border-radius: 10px;
    font-family: inherit;
    transition: background 0.13s;
  }

  .product-card:hover { background: #f5f5f7; }

  .product-thumb {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: #f0f0f5;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .product-name {
    font-size: 13.5px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 2px;
    letter-spacing: -0.01em;
  }

  .product-brand {
    font-size: 11.5px;
    color: #9e9e9e;
    margin: 0;
  }

  .products-grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 4px;
  }
`;

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
      if (Array.isArray(saved)) setRecentSearches(saved.slice(0, 6));
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const performSearch = (query = searchQuery) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      context?.alertBox("error", "Please type something to search");
      return;
    }

    setIsDropdownOpen(false);
    setIsLoading(true);

    postData(`/api/product/search/get`, { page: 1, limit: 20, query: trimmedQuery }).then((res) => {
      context?.setSearchData(res);
      setRecentSearches((prev) => {
        const unique = [trimmedQuery, ...prev.filter((i) => i !== trimmedQuery)].slice(0, 6);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
        return unique;
      });
      setTimeout(() => {
        setIsLoading(false);
        context?.setOpenSearchPanel(false);
        history(`/search?query=${encodeURIComponent(trimmedQuery)}&page=1`);
      }, 500);
    });
  };

  const onChangeInput = (e) => {
    setSearchQuery(e.target.value);
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
    inputRef.current?.focus();
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get("query") || "");
  }, [location.search]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (!searchWrapperRef.current?.contains(e.target)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (context?.openSearchPanel) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [context?.openSearchPanel]);

  useEffect(() => {
    clearTimeout(debounceTimeoutRef.current);
    if (searchQuery.trim().length < 2) {
      setQuerySuggestions([]);
      setSuggestedProducts([]);
      setSuggestedCorrection("");
      setAiHintSummary("");
      setAiHintHighlights([]);
      return;
    }
    debounceTimeoutRef.current = setTimeout(() => {
      postData(`/api/product/search/get`, { page: 1, limit: 8, query: searchQuery.trim() }).then((res) => {
        setQuerySuggestions(res?.suggestions || []);
        setSuggestedProducts(res?.suggestionProducts || []);
        setSuggestedCorrection(res?.correctedQuery || "");
        setAiHintSummary(res?.aiInsights?.summary || "");
        setAiHintHighlights((res?.aiInsights?.highlights || []).slice(0, 2));
      });
    }, 300);
    return () => clearTimeout(debounceTimeoutRef.current);
  }, [searchQuery]);

  const predictiveSuggestions = useMemo(
    () => [...new Set(normalizedSuggestions)].slice(0, 10),
    [normalizedSuggestions]
  );

  const typeaheadSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const pool = [
      ...recentSearches,
      ...TRENDING_TERMS,
      ...POPULAR_TERMS,
      ...suggestedProducts.map((p) => p?.name || ""),
    ];
    const ranked = [...predictiveSuggestions, ...pool]
      .map((i) => i?.toString().trim())
      .filter(Boolean)
      .filter((i) => i.toLowerCase().includes(q));
    return [...new Set(ranked)].slice(0, MAX_TYPEAHEAD_SUGGESTIONS);
  }, [searchQuery, recentSearches, predictiveSuggestions, suggestedProducts]);

  const hasLiveSuggestions =
    typeaheadSuggestions.length > 0 ||
    suggestedProducts.length > 0 ||
    Boolean(suggestedCorrection) ||
    Boolean(aiHintSummary);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div ref={searchWrapperRef} className="search-root search-wrapper">
      <style>{styles}</style>

      {/* Search Box */}
      <div className="search-box">
        <IoSearch className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products, brands & more..."
          className="search-input"
          value={searchQuery}
          onFocus={() => setIsDropdownOpen(true)}
          onChange={onChangeInput}
          onKeyDown={(e) => e.key === "Enter" && performSearch()}
          autoComplete="off"
        />
        {isSearching && (
          <button className="clear-btn" onClick={onClearSearch} aria-label="Clear">
            <IoClose style={{ fontSize: 16 }} />
          </button>
        )}
        <button className="search-btn" onClick={() => performSearch()} aria-label="Search">
          {isLoading ? (
            <CircularProgress size={18} style={{ color: "#fff" }} />
          ) : (
            <IoSearch style={{ fontSize: 17 }} />
          )}
        </button>
      </div>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="search-dropdown">
          <div className="dropdown-scroll">
            {isSearching && hasLiveSuggestions ? (
              <>
                {/* Did You Mean */}
                {suggestedCorrection && suggestedCorrection !== searchQuery.trim().toLowerCase() && (
                  <button className="did-you-mean-btn" onClick={() => onSelectSuggestion(suggestedCorrection)}>
                    <span className="did-you-mean-label">Did you mean</span>
                    <span className="did-you-mean-word">"{suggestedCorrection}"</span>
                  </button>
                )}

                {/* AI Hint */}
                {aiHintSummary && (
                  <div className="ai-card">
                    <div className="ai-card-label">
                      <IoSparklesOutline />
                      AI Suggestion
                    </div>
                    <p className="ai-summary">{aiHintSummary}</p>
                    {aiHintHighlights.length > 0 && (
                      <ul className="ai-highlights">
                        {aiHintHighlights.map((hint) => (
                          <li key={hint}>{hint}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Typeahead Suggestions */}
                {typeaheadSuggestions.length > 0 && (
                  <ul className="suggestion-list">
                    {typeaheadSuggestions.map((item) => {
                      const isRecent = recentSearches.includes(item);
                      return (
                        <li key={item}>
                          <button onClick={() => onSelectSuggestion(item)}>
                            <span className={`sugg-icon ${isRecent ? "recent-icon" : ""}`}>
                              {isRecent ? <IoTimeOutline /> : <IoSearch style={{ fontSize: 13 }} />}
                            </span>
                            <span>{item}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Suggested Products */}
                {suggestedProducts.length > 0 && (
                  <>
                    <div className="divider" style={{ margin: "8px 0" }} />
                    <div className="section-label">Suggested Products</div>
                    <div className="products-grid">
                      {suggestedProducts.map((product) => (
                        <button
                          key={product?._id || product?.name}
                          className="product-card"
                          onClick={() => onSelectSuggestion(product?.name || "")}
                        >
                          <div className="product-thumb">🛍️</div>
                          <div>
                            <p className="product-name">{product?.name}</p>
                            {product?.brand && <p className="product-brand">{product.brand}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <>
                    <div className="section-label">
                      <IoTimeOutline />
                      Recent
                    </div>
                    <div className="chip-row">
                      {recentSearches.map((item) => (
                        <button key={item} className="chip recent-chip" onClick={() => onSelectSuggestion(item)}>
                          <IoTimeOutline style={{ fontSize: 11 }} />
                          {item}
                        </button>
                      ))}
                    </div>
                    <div className="divider" />
                  </>
                )}

                {/* Trending */}
                <div className="section-label" style={{ marginTop: 4 }}>
                  <IoFlameOutline />
                  Trending
                </div>
                <ul className="suggestion-list">
                  {TRENDING_TERMS.map((item) => (
                    <li key={item}>
                      <button onClick={() => onSelectSuggestion(item)}>
                        <span className="sugg-icon trending-icon">
                          <IoFlameOutline style={{ fontSize: 13 }} />
                        </span>
                        <span>{item}</span>
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Most Searched */}
                <div className="divider" style={{ margin: "8px 0" }} />
                <div className="section-label">Most Searched</div>
                <div className="chip-row" style={{ paddingBottom: 4 }}>
                  {POPULAR_TERMS.map((item) => (
                    <button key={item} className="chip popular-chip" onClick={() => onSelectSuggestion(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;