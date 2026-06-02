import React, { useRef, useEffect } from "react";
import { IoChevronBack } from "react-icons/io5";
import Search from "../Search";
import "./style.css";

const SearchModal = ({ isOpen, onClose, logoUrl }) => {
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Focus search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay">
      <div className="search-modal-container">
        {/* Header: Back + Search Bar + Close */}
        <div className="search-modal-header">
          <button
            className="search-modal-back-btn"
            onClick={onClose}
            aria-label="Go back"
          >
            <IoChevronBack size={22} />
          </button>

          <div className="search-modal-search-wrapper">
            <Search
              onSearchComplete={onClose}
              inputRef={searchInputRef}
            />
          </div>

          <button
            className="search-modal-close-btn"
            onClick={onClose}
            aria-label="Close search"
          >
            <span className="search-modal-close-icon">✕</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
