/**
 * PeopleOS — Inline Job Position Search & Create Selector
 * Department-scoped job position select with real-time inline creation.
 */
import React, { useState, useEffect, useRef } from 'react';
import { getJobPositions, createJobPosition } from '../../../services/hr/jobPositionService';
import './InlineJobPositionSelect.css';

const InlineJobPositionSelect = ({ departmentId, departmentName, value, onChange, disabled }) => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const containerRef = useRef(null);

  // Fetch department-scoped positions whenever departmentId changes
  useEffect(() => {
    if (!departmentId) {
      setPositions([]);
      setSearch('');
      setError('');
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError('');

    getJobPositions({ departmentId, limit: 100 })
      .then((res) => {
        if (!isMounted) return;
        const items = res?.data || res?.items || res || [];
        const posList = Array.isArray(items) ? items : [];
        setPositions(posList);

        // Sync initial search label if value exists
        if (value) {
          const matched = posList.find((p) => (p._id || p.id) === value);
          if (matched) {
            setSearch(matched.title);
          }
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load job positions');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [departmentId]);

  // Sync selected title when value or positions change
  useEffect(() => {
    if (value && positions.length > 0) {
      const matched = positions.find((p) => (p._id || p.id) === value);
      if (matched) {
        setSearch(matched.title);
      }
    } else if (!value) {
      setSearch('');
    }
  }, [value, positions]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPosition = (pos) => {
    setSearch(pos.title);
    setError('');
    setIsOpen(false);
    onChange(pos._id || pos.id, pos);
  };

  const handleCreatePosition = async (titleToCreate) => {
    if (!departmentId) {
      setError('Please select a Department first.');
      return;
    }
    const trimmed = titleToCreate.trim();
    if (!trimmed) return;

    setIsCreating(true);
    setError('');

    try {
      const createdRes = await createJobPosition({
        title: trimmed,
        departmentId: departmentId,
      });

      const newPos = createdRes?.data || createdRes;
      if (newPos) {
        setPositions((prev) => [newPos, ...prev]);
        setSearch(newPos.title);
        setIsOpen(false);
        onChange(newPos._id || newPos.id, newPos);
      }
    } catch (err) {
      setError(err.message || `Failed to create position '${trimmed}'`);
    } finally {
      setIsCreating(false);
    }
  };

  const cleanQuery = search.trim();
  const filteredPositions = positions.filter((p) =>
    p.title.toLowerCase().includes(cleanQuery.toLowerCase())
  );

  const exactMatchExists = positions.some(
    (p) => p.title.toLowerCase() === cleanQuery.toLowerCase()
  );

  const showCreateOption = cleanQuery.length > 0 && !exactMatchExists;

  return (
    <div className="inline-job-select-container" ref={containerRef}>
      <label className="form-label">
        Job Position <span className="text-danger">*</span>
      </label>

      <div className="select-input-wrapper">
        <input
          type="text"
          className={`form-input select-search-input ${disabled ? 'disabled' : ''} ${
            error ? 'input-error' : ''
          }`}
          placeholder={
            disabled
              ? 'Select Department first...'
              : 'Search or type position name...'
          }
          value={search}
          disabled={disabled || isCreating}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            setError('');
            if (!isOpen && !disabled) setIsOpen(true);
          }}
        />
        <span className="dropdown-arrow">▼</span>
      </div>

      {error && <div className="field-error-text">⚠️ {error}</div>}

      {isOpen && !disabled && (
        <div className="select-dropdown-menu">
          {loading ? (
            <div className="dropdown-state-item">Loading positions...</div>
          ) : (
            <>
              {filteredPositions.map((pos) => {
                const isSelected = (pos._id || pos.id) === value;
                return (
                  <div
                    key={pos._id || pos.id}
                    className={`dropdown-option-item ${
                      isSelected ? 'selected' : ''
                    }`}
                    onClick={() => handleSelectPosition(pos)}
                  >
                    <span>{pos.title}</span>
                    {isSelected && <span className="check-mark">✓</span>}
                  </div>
                );
              })}

              {showCreateOption && (
                <div
                  className="dropdown-option-item create-option"
                  onClick={() => handleCreatePosition(cleanQuery)}
                >
                  <span className="create-plus">+</span>
                  <span>
                    Create <strong>"{cleanQuery}"</strong>
                  </span>
                  {departmentName && (
                    <span className="dept-badge">in {departmentName}</span>
                  )}
                </div>
              )}

              {filteredPositions.length === 0 && !showCreateOption && (
                <div className="dropdown-state-item text-muted">
                  No job positions found. Type a title to create one.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default InlineJobPositionSelect;
