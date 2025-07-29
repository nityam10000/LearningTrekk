import React, { useState, useEffect } from 'react';
import '../css/SearchBar.css';

function SearchBar({ 
    placeholder = "Search...", 
    onSearch, 
    onFilterChange, 
    showFilters = false, 
    filterOptions = [],
    searchType = "courses", // "courses" or "blogs"
    initialQuery = "" // Add support for initial search query
}) {
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [selectedFilters, setSelectedFilters] = useState({});
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    // Update search query when initialQuery changes
    useEffect(() => {
        if (initialQuery) {
            setSearchQuery(initialQuery);
        }
    }, [initialQuery]);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, onSearch]);

    const handleFilterChange = (filterType, value) => {
        const newFilters = {
            ...selectedFilters,
            [filterType]: selectedFilters[filterType] === value ? '' : value
        };
        setSelectedFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearAllFilters = () => {
        setSelectedFilters({});
        setSearchQuery('');
        onSearch('');
        onFilterChange({});
    };

    const getActiveFilterCount = () => {
        return Object.values(selectedFilters).filter(value => value !== '').length;
    };

    return (
        <div className="searchbar-container">
            {/* Main Search Input */}
            <div className="searchbar-input-wrapper">
                <div className="searchbar-input-container">
                    <i className="fas fa-search searchbar-icon"></i>
                    <input
                        type="text"
                        className="searchbar-input"
                        placeholder={placeholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button 
                            className="searchbar-clear-btn"
                            onClick={() => setSearchQuery('')}
                            aria-label="Clear search"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>
                
                {showFilters && (
                    <button 
                        className={`searchbar-filter-toggle-btn ${isFilterExpanded ? 'active' : ''}`}
                        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                        aria-label="Toggle filters"
                    >
                        <i className="fas fa-filter"></i>
                        <span>Filters</span>
                        {getActiveFilterCount() > 0 && (
                            <span className="searchbar-filter-count">{getActiveFilterCount()}</span>
                        )}
                    </button>
                )}
            </div>

            {/* Filter Panel */}
            {showFilters && isFilterExpanded && (
                <div className="searchbar-filter-panel">
                    <div className="searchbar-filter-header">
                        <h4>Filter {searchType}</h4>
                        {getActiveFilterCount() > 0 && (
                            <button 
                                className="searchbar-clear-filters-btn"
                                onClick={clearAllFilters}
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="searchbar-filter-groups">
                        {filterOptions.map((filterGroup) => (
                            <div key={filterGroup.key} className="searchbar-filter-group">
                                <h5 className="searchbar-filter-group-title">{filterGroup.title}</h5>
                                <div className="searchbar-filter-options">
                                    {filterGroup.options.map((option) => (
                                        <button
                                            key={option.value}
                                            className={`searchbar-filter-option ${
                                                selectedFilters[filterGroup.key] === option.value ? 'active' : ''
                                            }`}
                                            onClick={() => handleFilterChange(filterGroup.key, option.value)}
                                        >
                                            {option.label}
                                            {option.count && (
                                                <span className="searchbar-option-count">({option.count})</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Filters Display */}
            {getActiveFilterCount() > 0 && (
                <div className="searchbar-active-filters">
                    {Object.entries(selectedFilters).map(([key, value]) => {
                        if (!value) return null;
                        const filterGroup = filterOptions.find(group => group.key === key);
                        const option = filterGroup?.options.find(opt => opt.value === value);
                        return (
                            <span key={key} className="searchbar-active-filter-tag">
                                {option?.label || value}
                                <button
                                    onClick={() => handleFilterChange(key, value)}
                                    aria-label={`Remove ${option?.label || value} filter`}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Search Suggestions (placeholder for future enhancement) */}
            {searchQuery && (
                <div className="searchbar-suggestions">
                    {/* This can be expanded later with actual search suggestions */}
                </div>
            )}
        </div>
    );
}

export default SearchBar;