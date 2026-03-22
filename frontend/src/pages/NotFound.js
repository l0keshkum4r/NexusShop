import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/NotFound.css';

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-inner">
        <div className="notfound-code">404</div>
        <div className="notfound-orb" />
        <h1 className="notfound-title">Page not found</h1>
        <p className="notfound-sub">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="notfound-actions">
          <Link to="/" className="btn btn-primary btn-lg">Go Home</Link>
          <button className="btn btn-ghost btn-lg" onClick={() => window.history.back()}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
