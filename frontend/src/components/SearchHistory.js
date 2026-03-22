import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/SearchHistory.css';

export default function SearchHistory() {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    authAPI.profile()
      .then((d) => setHistory((d.user?.searchHistory || []).slice(0, 8)))
      .catch(() => {});
  }, []);

  if (history.length === 0) return null;

  const handleClick = (query) => {
    navigate(`/?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="search-history">
      <span className="sh-label">Recent searches:</span>
      <div className="sh-pills">
        {history.map((item, i) => (
          <button key={i} className="sh-pill" onClick={() => handleClick(item.query)}>
            <span className="sh-icon">⟳</span> {item.query}
          </button>
        ))}
      </div>
    </div>
  );
}
