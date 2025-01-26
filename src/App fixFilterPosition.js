import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tokens, setTokens] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState({
    name: '',
    symbol: '',
    address: '',
    decimals: '',
    notIncludePump: true,
    notIncludeMoon: true,
    createdOnPump: false
  });

  const ITEMS_PER_PAGE = 20;
  const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || 'https://139.180.184.90/api/tokens';
  const UPDATE_METADATA_ENDPOINT = process.env.REACT_APP_UPDATE_METADATA_ENDPOINT || 'https://139.180.184.90/api/update-metadata';

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

  const handleUpdateMetadata = async () => {
    const confirmUpdate = window.confirm("Are you sure you want to update metadata for the filtered records?");
    if (!confirmUpdate) return;

    const filteredAddresses = filteredTokens.map((token) => token.address);
    console.log('checked ' + filteredAddresses);

    try {
      setLoading(true);
      const response = await axios.post(UPDATE_METADATA_ENDPOINT, { addresses: filteredAddresses });
      alert(response.data.message);
      fetchTokens(); // Refresh data after update
    } catch (err) {
      alert("Error updating metadata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSearchFilters((prevFilters) => ({
      ...prevFilters,
      [name]: type === 'checkbox' ? checked : value
    }));
    setCurrentPage(1); // Reset to the first page when filters change
  };

  const filteredTokens = tokens.filter((token) => {
    const matchesFilters =
      token.name.toLowerCase().includes(searchFilters.name.toLowerCase()) &&
      token.symbol.toLowerCase().includes(searchFilters.symbol.toLowerCase()) &&
      token.address.toLowerCase().includes(searchFilters.address.toLowerCase()) &&
      (searchFilters.decimals === '' || token.decimals.toString() === searchFilters.decimals);

    const matchesNotIncludePump =
      searchFilters.notIncludePump ? !token.address.toLowerCase().endsWith('pump') : true;

    const matchesNotIncludeMoon =
      searchFilters.notIncludeMoon ? !token.address.toLowerCase().endsWith('moon') : true;

    const matchesCreatedOnPump =
      searchFilters.createdOnPump ? token.created_on === 'https://pump.fun' : true;

    return matchesFilters && matchesNotIncludePump && matchesNotIncludeMoon && matchesCreatedOnPump;
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

  const handleGoToFirstPage = () => {
    setCurrentPage(1);
  };

  const handleGoToLastPage = () => {
    setCurrentPage(totalPages);
  };

  return (
    <div className="App">
      <h1 style={{ marginTop: '10px', marginBottom: '5px' }}>Token List</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchTokens} className="refresh-button">Refresh</button>
          <button onClick={handleUpdateMetadata} className="update-metadata-button">Update Metadata</button>
        </div>
        <div style={{ fontSize: '14px' }}>
          <span>Total Records: {filteredTokens.length}</span> | <span>Page {currentPage} of {totalPages}</span>
        </div>
      </div>
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
            <div>
              <label style={{ fontSize: '12px' }}>
                <input
                  type="checkbox"
                  name="notIncludePump"
                  checked={searchFilters.notIncludePump}
                  onChange={handleFilterChange}
                />
                Not Include Pump
              </label>
              <label style={{ fontSize: '12px' }}>
                <input
                  type="checkbox"
                  name="notIncludeMoon"
                  checked={searchFilters.notIncludeMoon}
                  onChange={handleFilterChange}
                />
                Not Include Moon
              </label>
              <label style={{ fontSize: '12px' }}>
                <input
                  type="checkbox"
                  name="createdOnPump"
                  checked={searchFilters.createdOnPump}
                  onChange={handleFilterChange}
                />
                Created On Pump
              </label>
            </div>
          </div>
          <table className="token-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Symbol</th>
                <th>Address</th>
                <th>Decimals</th>
                <th>Created Date</th>
                <th>Holders</th>
                <th>Marketcap</th>
                <th>Supply</th>
                <th>Price</th>
                <th>Volume 24H</th>
                <th>Created On</th>
                <th>Freeze Authority</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTokens.map((token) => (
                <tr key={token.address}>
                  <td>{token.name}</td>
                  <td>{token.symbol}</td>
                  <td>
                    <a
                      href={`https://solscan.io/token/${token.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {token.address}
                    </a>
                  </td>
                  <td>{token.decimals}</td>
                  <td>{new Date(token.created_date).toLocaleString()}</td>
                  <td>{token.holders || '-'}</td>
                  <td>{token.marketcap || '-'}</td>
                  <td>{token.supply || '-'}</td>
                  <td>{token.price || '-'}</td>
                  <td>{token.volume_24h || '-'}</td>
                  <td>{token.created_on || '-'}</td>
                  <td>{token.freeze_authority || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button onClick={handleGoToFirstPage} disabled={currentPage === 1}>First Page</button>
            <button onClick={() => handlePageChange('prev')} disabled={currentPage === 1}>Previous</button>
            <button onClick={() => handlePageChange('next')} disabled={currentPage === totalPages}>Next</button>
            <button onClick={handleGoToLastPage} disabled={currentPage === totalPages}>Last Page</button>
          </div>
        </>
      )}
      {!loading && !error && filteredTokens.length === 0 && <p>No tokens found.</p>}
    </div>
  );
}

export default App;
