import React, { useEffect } from "react";
import { useAppContext } from "../../hooks/useAppContext";
import { useLocation, useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import { IoSearch, IoTimeOutline, IoClose, IoFlameOutline, IoSparklesOutline, IoStorefrontOutline, IoPricetagOutline } from "react-icons/io5";
import useSearch from "../../hooks/useSearch";

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
    height: 42px;
    background: #ffffff;
    border-radius: 14px;
    border: 1.5px solid #e0e0e0;
    padding: 0 8px 0 16px;
    gap: 8px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }

  .search-box:focus-within {
    border-color: #1a1a2e;
    box-shadow: 0 4px 20px rgba(26, 26, 46, 0.12);
  }

  .search-icon { font-size: 18px; color: #9e9e9e; flex-shrink: 0; transition: color 0.2s; }
  .search-box:focus-within .search-icon { color: #1a1a2e; }

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
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: transparent;
    color: #9e9e9e;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    transition: color 0.2s, transform 0.1s;
  }

  .search-btn:hover { color: #1a1a2e; }
  .search-btn:active { transform: scale(0.96); }

  .search-dropdown {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    background: #ffffff;
    border-top: 1.5px solid #ececec;
    box-shadow: 0 -4px 24px rgba(0,0,0,0.06);
    z-index: 9999;
    overflow: hidden;
    animation: dropIn 0.18s ease;
  }

  @keyframes dropIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .dropdown-scroll {
    height: 100%;
    overflow-y: auto;
    padding: 12px 16px 80px;
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

  .suggestion-list { list-style: none; margin: 0; padding: 0; }

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
  .suggestion-item:hover,
  .suggestion-list li button.active { background: #f5f5f7; }

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
  .brand-icon { background: #fff8e6; color: #f59e0b; }
  .category-icon { background: #ecfdf5; color: #10b981; }

  .chip-row { display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 6px 8px; }

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

  .divider { height: 1px; background: #f0f0f0; margin: 4px 0; }

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

  .loading-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 10px;
    color: #9e9e9e;
    font-size: 13px;
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
    overflow: hidden;
  }

  .product-thumb img { width: 100%; height: 100%; object-fit: cover; }

  .product-name { font-size: 13.5px; font-weight: 600; color: #1a1a2e; margin: 0 0 2px; letter-spacing: -0.01em; }
  .product-brand { font-size: 11.5px; color: #9e9e9e; margin: 0; }
  .products-grid { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }

  .search-dropdown mark {
    background: #fff3cd;
    color: inherit;
    padding: 0 2px;
    border-radius: 2px;
  }
`;

const Search = ({ onSearchComplete, inputRef: externalInputRef }) => {
  const context = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = externalInputRef || React.useRef(null);

  const {
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
    didYouMean,
    popularCategories,
    popularBrands,
    isDropdownOpen,
    activeIndex,
    onQueryChange,
    onFocus,
    executeSearch,
    onKeyDown,
    clearSearch,
    openDropdown,
  } = useSearch();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("query") || "";
    if (q) onQueryChange(q);
  }, [location.search]);

  useEffect(() => {
    if (context?.openSearchPanel) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [context?.openSearchPanel, inputRef]);

  const handleSearch = async (query = search) => {
    const trimmed = String(query || "").trim();
    console.log("🔍 handleSearch called with:", trimmed);
    
    if (!trimmed) {
      context?.alertBox?.("error", "Please type something to search");
      return;
    }

    try {
      console.log("🚀 Executing search for:", trimmed);
      const payload = await executeSearch(trimmed);
      console.log("✅ Search payload received:", payload);
      
      if (!payload) {
        console.warn("⚠️ Search returned no results");
        return;
      }
      
      // Close dropdown
      context?.setOpenSearchPanel?.(false);
      onSearchComplete?.();
      
      // Navigate to search results page
      console.log("🧭 Navigating to search results page");
      navigate(`/search?query=${encodeURIComponent(trimmed)}&page=1`);
    } catch (error) {
      console.error("❌ Search error:", error);
      if (error?.message && error.message !== "null") {
        context?.alertBox?.("error", error.message || "Search failed");
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = search.trim();
      if (trimmed) {
        console.log("⌨️ Enter pressed with query:", trimmed);
        // Use navigate for smooth transition with loading skeleton
        const url = `/search?query=${encodeURIComponent(trimmed)}&page=1`;
        console.log("🚀 Navigating to:", url);
        
        // Close dropdown/modal before navigation
        context?.setOpenSearchPanel?.(false);
        onSearchComplete?.();
        
        // Navigate using React Router for smooth transition
        navigate(url);
      }
      return;
    }
    // Call the original onKeyDown for other keys (arrow keys, escape, etc.)
    onKeyDown(e);
  };

  const onSelectSuggestion = async (value) => {
    console.log("👆 Suggestion clicked:", value);
    
    // First execute search, then close dropdown
    try {
      await handleSearch(value);
    } catch (error) {
      console.error("Error in onSelectSuggestion:", error);
    }
  };

  const isSearching = search.trim().length > 0;
  const displayTrending = trending.length ? trending : topSearches.slice(0, 6);
  const displayPopular = popularBrands.length
    ? popularBrands.map((b) => b.name || b)
    : topSearches.slice(6, 12);

  return (
    <div ref={wrapperRef} className="search-root search-wrapper">
      <style>{styles}</style>

      <div className="search-box">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products, brands & more..."
          className="search-input"
          value={search}
          onFocus={onFocus}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          role="combobox"
          aria-expanded={isDropdownOpen}
          aria-autocomplete="list"
        />
        {isSearching && (
          <button className="clear-btn" onClick={() => { clearSearch(); openDropdown(); inputRef.current?.focus(); }} aria-label="Clear">
            <IoClose style={{ fontSize: 16 }} />
          </button>
        )}
        <button className="search-btn" onClick={() => handleSearch()} aria-label="Search">
          {loading ? (
            <CircularProgress size={18} />
          ) : (
            <IoSearch style={{ fontSize: 17 }} />
          )}
        </button>
      </div>

      {isDropdownOpen && (
        <div className="search-dropdown" role="listbox">
          <div className="dropdown-scroll">
            {suggestionsLoading && isSearching && (
              <div className="loading-row">
                <CircularProgress size={16} />
                Searching...
              </div>
            )}

            {isSearching ? (
              <>
                {didYouMean && didYouMean !== search.trim().toLowerCase() && (
                  <button 
                    className="did-you-mean-btn" 
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      console.log("👆 Clicked did-you-mean:", didYouMean);
                      
                      // Close dropdown/modal first
                      context?.setOpenSearchPanel?.(false);
                      onSearchComplete?.();
                      
                      // Navigate using React Router
                      const url = `/search?query=${encodeURIComponent(didYouMean)}&page=1`;
                      console.log("🚀 Navigating to:", url);
                      navigate(url);
                    }}
                  >
                    <IoSparklesOutline />
                    <span className="did-you-mean-label">Did you mean</span>
                    <span className="did-you-mean-word">{didYouMean}</span>
                  </button>
                )}

                {suggestions.length > 0 && (
                  <>
                    <div className="section-label"><IoSearch /> Suggestions</div>
                    <ul className="suggestion-list">
                      {suggestions.map((item, idx) => (
                        <li key={item}>
                          <button
                            className={activeIndex === idx ? "active" : ""}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              console.log("👆 Clicked suggestion:", item);
                              
                              // Close dropdown/modal first
                              context?.setOpenSearchPanel?.(false);
                              onSearchComplete?.();
                              
                              // Navigate using React Router for smooth transition
                              const url = `/search?query=${encodeURIComponent(item)}&page=1`;
                              console.log("🚀 Navigating to:", url);
                              navigate(url);
                            }}
                          >
                            <span className="sugg-icon"><IoSearch style={{ fontSize: 13 }} /></span>
                            <span>{item}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {brands.length > 0 && (
                  <>
                    <div className="divider" />
                    <div className="section-label"><IoPricetagOutline /> Brands</div>
                    <ul className="suggestion-list">
                      {brands.slice(0, 5).map((brand) => (
                        <li key={brand.name}>
                          <button 
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              console.log("👆 Clicked brand:", brand.name);
                              
                              context?.setOpenSearchPanel?.(false);
                              onSearchComplete?.();
                              
                              const url = `/search?query=${encodeURIComponent(brand.name)}&page=1`;
                              console.log("🚀 Navigating to:", url);
                              navigate(url);
                            }}
                          >
                            <span className="sugg-icon brand-icon"><IoPricetagOutline style={{ fontSize: 13 }} /></span>
                            <span dangerouslySetInnerHTML={{ __html: brand.highlightedName || brand.name }} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {categories.length > 0 && (
                  <>
                    <div className="divider" />
                    <div className="section-label"><IoStorefrontOutline /> Categories</div>
                    <ul className="suggestion-list">
                      {categories.slice(0, 5).map((cat) => (
                        <li key={cat._id || cat.name}>
                          <button 
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              console.log("👆 Clicked category:", cat.name);
                              
                              context?.setOpenSearchPanel?.(false);
                              onSearchComplete?.();
                              
                              const url = `/search?query=${encodeURIComponent(cat.name)}&page=1`;
                              console.log("🚀 Navigating to:", url);
                              navigate(url);
                            }}
                          >
                            <span className="sugg-icon category-icon"><IoStorefrontOutline style={{ fontSize: 13 }} /></span>
                            <span dangerouslySetInnerHTML={{ __html: cat.highlightedName || cat.name }} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {products.length > 0 && (
                  <>
                    <div className="divider" />
                    <div className="section-label">Products</div>
                    <div className="products-grid">
                      {products.slice(0, 6).map((product) => (
                        <button
                          key={product?._id || product?.name}
                          className="product-card"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log("👆 Clicked product:", product?.name);
                            
                            context?.setOpenSearchPanel?.(false);
                            onSearchComplete?.();
                            
                            const url = `/search?query=${encodeURIComponent(product?.name || "")}&page=1`;
                            console.log("🚀 Navigating to:", url);
                            navigate(url);
                          }}
                        >
                          <div className="product-thumb">
                            {product?.image ? (
                              <img src={product.image} alt="" />
                            ) : (
                              "🛍️"
                            )}
                          </div>
                          <div>
                            <p
                              className="product-name"
                              dangerouslySetInnerHTML={{ __html: product?.highlightedName || product?.name }}
                            />
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
                {recentKeywords.length > 0 && (
                  <>
                    <div className="section-label"><IoTimeOutline /> Recent</div>
                    <div className="chip-row">
                      {recentKeywords.map((item) => (
                        <button 
                          key={item} 
                          className="chip recent-chip" 
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log("👆 Clicked recent:", item);
                            
                            context?.setOpenSearchPanel?.(false);
                            onSearchComplete?.();
                            
                            const url = `/search?query=${encodeURIComponent(item)}&page=1`;
                            console.log("🚀 Navigating to:", url);
                            navigate(url);
                          }}
                        >
                          <IoTimeOutline style={{ fontSize: 11 }} />
                          {item}
                        </button>
                      ))}
                    </div>
                    <div className="divider" />
                  </>
                )}

                {displayTrending.length > 0 && (
                  <>
                    <div className="section-label"><IoFlameOutline /> Trending</div>
                    <ul className="suggestion-list">
                      {displayTrending.map((item) => (
                        <li key={item}>
                          <button 
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              console.log("👆 Clicked trending:", item);
                              
                              context?.setOpenSearchPanel?.(false);
                              onSearchComplete?.();
                              
                              const url = `/search?query=${encodeURIComponent(item)}&page=1`;
                              console.log("🚀 Navigating to:", url);
                              navigate(url);
                            }}
                          >
                            <span className="sugg-icon trending-icon">
                              <IoFlameOutline style={{ fontSize: 13 }} />
                            </span>
                            <span>{item}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {popularCategories.length > 0 && (
                  <>
                    <div className="divider" />
                    <div className="section-label">Popular Categories</div>
                    <div className="chip-row">
                      {popularCategories.slice(0, 8).map((cat) => (
                        <button 
                          key={cat._id || cat.name} 
                          className="chip" 
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log("👆 Clicked popular category:", cat.name);
                            
                            context?.setOpenSearchPanel?.(false);
                            onSearchComplete?.();
                            
                            const url = `/search?query=${encodeURIComponent(cat.name)}&page=1`;
                            console.log("🚀 Navigating to:", url);
                            navigate(url);
                          }}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {displayPopular.length > 0 && (
                  <>
                    <div className="divider" />
                    <div className="section-label">Popular Brands</div>
                    <div className="chip-row">
                      {displayPopular.map((item) => (
                        <button 
                          key={item} 
                          className="chip popular-chip" 
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log("👆 Clicked popular brand:", item);
                            
                            context?.setOpenSearchPanel?.(false);
                            onSearchComplete?.();
                            
                            const url = `/search?query=${encodeURIComponent(item)}&page=1`;
                            console.log("🚀 Navigating to:", url);
                            navigate(url);
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
