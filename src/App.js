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
    createdOnPump: false,
    created_date: '',
    holders: '',
    marketcap: '',
    supply: '',
    price: '',
    volume_24h: '',
    created_on: '',
    freeze_authority: ''
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
      (token.name?.toLowerCase() || '').includes(searchFilters.name.toLowerCase()) &&
      (token.symbol?.toLowerCase() || '').includes(searchFilters.symbol.toLowerCase()) &&
      (token.address?.toLowerCase() || '').includes(searchFilters.address.toLowerCase()) &&
      (token.created_date?.toLowerCase() || '').includes(searchFilters.created_date.toLowerCase()) &&
      (token.holders?.toString() || '').includes(searchFilters.holders) &&
      (token.marketcap?.toLowerCase() || '').includes(searchFilters.marketcap.toLowerCase()) &&
      (token.supply?.toLowerCase() || '').includes(searchFilters.supply.toLowerCase()) &&
      (token.price?.toLowerCase() || '').includes(searchFilters.price.toLowerCase()) &&
      (token.volume_24h?.toLowerCase() || '').includes(searchFilters.volume_24h.toLowerCase()) &&
      (token.created_on?.toLowerCase() || '').includes(searchFilters.created_on.toLowerCase()) &&
      (searchFilters.decimals === '' || token.decimals.toString() === searchFilters.decimals) &&
      (token.freeze_authority?.toLowerCase() || '').includes(searchFilters.freeze_authority.toLowerCase());

    const matchesNotIncludePump =
      searchFilters.notIncludePump ? !(token.address?.toLowerCase() || '').endsWith('pump') : true;

    const matchesNotIncludeMoon =
      searchFilters.notIncludeMoon ? !(token.address?.toLowerCase() || '').endsWith('moon') : true;

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

  const openInBackground = (url) => {
    try {
      var a = document.createElement("a");
      a.href = url;
      var evt = document.createEvent("MouseEvents");
      //the tenth parameter of initMouseEvent sets ctrl key
      evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0,
        true, false, false, false, 0, null);
      a.dispatchEvent(evt);
    } catch (error) {
      console.error('Error opening new tab:', error);
    }
  };

  return (
    <div className="App">
      <h1 style={{ marginTop: '10px', marginBottom: '5px' }}>Token List</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchTokens} className="refresh-button">Refresh</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={handleUpdateMetadata} className="update-metadata-button">Update Metadata</button>
            <label>
              <input
                type="checkbox"
                checked={searchFilters.notIncludePump}
                onChange={(e) => setSearchFilters({ ...searchFilters, notIncludePump: e.target.checked })}
              />
              Not Include Pump
            </label>
            <label>
              <input
                type="checkbox"
                checked={searchFilters.notIncludeMoon}
                onChange={(e) => setSearchFilters({ ...searchFilters, notIncludeMoon: e.target.checked })}
              />
              Not Include Moon
            </label>
            <label>
              <input
                type="checkbox"
                checked={searchFilters.createdOnPump}
                onChange={(e) => setSearchFilters({ ...searchFilters, createdOnPump: e.target.checked })}
              />
              Created On Pump
            </label>
          </div>
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
            {/* <input
              type="text"
              name="name"
              placeholder="Filter by Name"
              value={searchFilters.name}
              onChange={handleFilterChange}
            /> */}
            {/* <input
              type="text"
              name="symbol"
              placeholder="Filter by Symbol"
              value={searchFilters.symbol}
              onChange={handleFilterChange}
            /> */}
            {/* <input
              type="text"
              name="address"
              placeholder="Filter by Address"
              value={searchFilters.address}
              onChange={handleFilterChange}
            /> */}
            {/* <input
              type="text"
              name="decimals"
              placeholder="Filter by Decimals"
              value={searchFilters.decimals}
              onChange={handleFilterChange}
            /> */}
            {/* <input
              type="text"
              name="created_date"
              placeholder="Filter by Created Date"
              value={searchFilters.created_date}
              onChange={handleFilterChange}
            /> */}
            {/* <input
              type="text"
              name="holders"
              placeholder="Filter by Holders"
              value={searchFilters.holders}
              onChange={handleFilterChange}
            /> */}
            {/* <input
              type="text"
              name="marketcap"
              placeholder="Filter by Marketcap"
              value={searchFilters.marketcap}
              onChange={handleFilterChange}
            /> */}
            {/* <input
              type="text"
              name="supply"
              placeholder="Filter by Supply"
              value={searchFilters.supply}
              onChange={handleFilterChange}
            /> */}
            {/* <input
              type="text"
              name="price"
              placeholder="Filter by Price"
              value={searchFilters.price}
              onChange={handleFilterChange}
            /> */}
            {/* <input
              type="text"
              name="volume_24h"
              placeholder="Filter by Volume"
              value={searchFilters.volume_24h}
              onChange={handleFilterChange}
            /> */}
            {/* <input
              type="text"
              name="created_on"
              placeholder="Filter by Created On"
              value={searchFilters.created_on}
              onChange={handleFilterChange}
            /> */}
            {/* <input
              type="text"
              name="freeze_authority"
              placeholder="Filter by Freeze Authority"
              value={searchFilters.freeze_authority}
              onChange={handleFilterChange}
            /> */}
          </div>
          <table className="token-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>
                  <input
                    type="text"
                    name="name"
                    placeholder="Filter by Name"
                    value={searchFilters.name}
                    onChange={handleFilterChange}
                  />
                  Name</th>
                <th>
                  <input
                    type="text"
                    name="symbol"
                    placeholder="Filter by Symbol"
                    value={searchFilters.symbol}
                    onChange={handleFilterChange}
                  />
                  Symbol</th>
                <th>
                  <input
                    type="text"
                    name="address"
                    placeholder="Filter by Address"
                    value={searchFilters.address}
                    onChange={handleFilterChange}
                  />
                  Address</th>
                <th>
                  <input
                    type="text"
                    name="decimals"
                    placeholder="Filter by Decimals"
                    value={searchFilters.decimals}
                    onChange={handleFilterChange}
                  />
                  Decimals</th>
                <th>
                  <input
                    type="text"
                    name="created_date"
                    placeholder="Filter by Created Date"
                    value={searchFilters.created_date}
                    onChange={handleFilterChange}
                  />
                  Created Date</th>
                <th>
                  <input
                    type="text"
                    name="holders"
                    placeholder="Filter by Holders"
                    value={searchFilters.holders}
                    onChange={handleFilterChange}
                  />
                  Holders</th>
                <th>
                  <input
                    type="text"
                    name="marketcap"
                    placeholder="Filter by Marketcap"
                    value={searchFilters.marketcap}
                    onChange={handleFilterChange}
                  />
                  Marketcap</th>
                <th>
                  <input
                    type="text"
                    name="supply"
                    placeholder="Filter by Supply"
                    value={searchFilters.supply}
                    onChange={handleFilterChange}
                  />
                  Supply</th>
                <th>
                  <input
                    type="text"
                    name="price"
                    placeholder="Filter by Price"
                    value={searchFilters.price}
                    onChange={handleFilterChange}
                  />
                  Price</th>
                <th>
                  <input
                    type="text"
                    name="volume_24h"
                    placeholder="Filter by Volume"
                    value={searchFilters.volume_24h}
                    onChange={handleFilterChange}
                  />
                  Volume 24H</th>
                <th>
                  <input
                    type="text"
                    name="created_on"
                    placeholder="Filter by Created On"
                    value={searchFilters.created_on}
                    onChange={handleFilterChange}
                  />
                  Created On</th>
                <th>
                  <input
                    type="text"
                    name="freeze_authority"
                    placeholder="Filter by Freeze Authority"
                    value={searchFilters.freeze_authority}
                    onChange={handleFilterChange}
                  />
                  Freeze Authority</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTokens.map((token) => (
                <tr key={token.address}>
                  <td>{token.name}</td>
                  <td>{token.symbol}</td>
                  <td>
                    <a href="#" onClick={() => openInBackground(`https://solscan.io/token/${token.address}`)}>
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
          <div className="pagination" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button onClick={handleGoToFirstPage} disabled={currentPage === 1}>
              First Page
            </button>
            <button onClick={() => handlePageChange('prev')} disabled={currentPage === 1}>
              Previous
            </button>
            <button onClick={() => handlePageChange('next')} disabled={currentPage === totalPages}>
              Next
            </button>
            <button onClick={handleGoToLastPage} disabled={currentPage === totalPages}>
              Last Page
            </button>
          </div>
        </>
      )}
      {!loading && !error && filteredTokens.length === 0 && <p>No tokens found.</p>}
    </div>
  );
}

export default App;
