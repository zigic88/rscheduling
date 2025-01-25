import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tokens, setTokens] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState({ name: '', symbol: '', address: '', decimals: '' });

  const ITEMS_PER_PAGE = 10;
  const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || 'https://139.180.184.90:3001/api/tokens';

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_ENDPOINT);
      setTokens(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
    setCurrentPage(1); // Reset to the first page when filters change
  };

  const filteredTokens = tokens.filter((token) => {
    return (
      token.name.toLowerCase().includes(searchFilters.name.toLowerCase()) &&
      token.symbol.toLowerCase().includes(searchFilters.symbol.toLowerCase()) &&
      token.address.toLowerCase().includes(searchFilters.address.toLowerCase())&&
      (searchFilters.decimals === '' || token.decimals.toString() === searchFilters.decimals)
    );
  });

  const paginatedTokens = filteredTokens.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredTokens.length / ITEMS_PER_PAGE);

  const handlePageChange = (direction) => {
    setCurrentPage((prevPage) => {
      if (direction === 'next' && prevPage < totalPages) {
        return prevPage + 1;
      } else if (direction === 'prev' && prevPage > 1) {
        return prevPage - 1;
      }
      return prevPage;
    });
  };

  return (
    <div className="App">
      <h1>Token List</h1>
      <button onClick={fetchTokens} className="refresh-button">Refresh</button>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && (
        <>
          <div className="filters">
            <input
              type="text"
              name="name"
              placeholder="Filter by Name"
              value={searchFilters.name}
              onChange={handleFilterChange}
            />
            <input
              type="text"
              name="symbol"
              placeholder="Filter by Symbol"
              value={searchFilters.symbol}
              onChange={handleFilterChange}
            />
            <input
              type="text"
              name="address"
              placeholder="Filter by Address"
              value={searchFilters.address}
              onChange={handleFilterChange}
            />
            <input
              type="text"
              name="decimals"
              placeholder="Filter by Decimals"
              value={searchFilters.decimals}
              onChange={handleFilterChange}
            />
          </div>
          <table className="token-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Symbol</th>
                <th>Address</th>
                <th>Decimals</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTokens.map((token) => (
                <tr key={token.address}>
                  <td>{token.name}</td>
                  <td>{token.symbol}</td>
                  <td>{token.address}</td>
                  <td>{token.decimals}</td>
                  <td>{new Date(token.created_date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button onClick={() => handlePageChange('prev')} disabled={currentPage === 1}>Previous</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => handlePageChange('next')} disabled={currentPage === totalPages}>Next</button>
          </div>
        </>
      )}
      {!loading && !error && filteredTokens.length === 0 && <p>No tokens found.</p>}
    </div>
  );
}

export default App;