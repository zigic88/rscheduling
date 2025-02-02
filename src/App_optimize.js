import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tokens, setTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ name: '', symbol: '', address: '', marketcap: '', price: '', holders: '' });

  const ITEMS_PER_PAGE = 20;
  const API_ENDPOINT = 'http://localhost:3001/api/tokens';

  useEffect(() => {
    fetchTokens(currentPage, ITEMS_PER_PAGE);
  }, [currentPage]);

  useEffect(() => {
    applyFilters();
  }, [tokens, filters]);

  const fetchTokens = async (page, limit) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching page ${page}...`);
      const response = await axios.get(`${API_ENDPOINT}?page=${page}&limit=${limit}`);
      if (response.data && response.data.data) {
        console.log("API Response:", response.data);
        setTokens(prevTokens => [...prevTokens, ...response.data.data]);
        setTotalRecords(parseInt(response.data.total, 10));
      } else {
        setTokens([]);
      }
    } catch (err) {
      setError('Failed to fetch data');
    }
    setLoading(false);
  };

  const applyFilters = async () => {
    let filtered = tokens.filter(token =>
      token.name.toLowerCase().includes(filters.name.toLowerCase()) &&
      token.symbol.toLowerCase().includes(filters.symbol.toLowerCase()) &&
      token.address.toLowerCase().includes(filters.address.toLowerCase())
    );
    if (filtered.length > 0) {
      setFilteredTokens(filtered);
    } else {
      try {
        setLoading(true);
        const response = await axios.get(`${API_ENDPOINT}?name=${filters.name}&symbol=${filters.symbol}&address=${filters.address}`);
        setFilteredTokens(response.data.data || []);
      } catch (err) {
        setError('Failed to fetch filtered data');
      }
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prevFilters => ({ ...prevFilters, [field]: value }));
  };

  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  return (
    <div className="App">
      <h1>Token List</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>
              Name
              <input type="text" placeholder="Filter" onChange={e => handleFilterChange('name', e.target.value)} />
            </th>
            <th>
              Symbol
              <input type="text" placeholder="Filter" onChange={e => handleFilterChange('symbol', e.target.value)} />
            </th>
            <th>
              Address
              <input type="text" placeholder="Filter" onChange={e => handleFilterChange('address', e.target.value)} />
            </th>
            <th>Marketcap</th>
            <th>Price</th>
            <th>Holders</th>
          </tr>
        </thead>
        <tbody>
          {filteredTokens.length > 0 ? (
            filteredTokens.map(token => (
              <tr key={token.address}>
                <td>{token.name}</td>
                <td>{token.symbol}</td>
                <td>{token.address}</td>
                <td>${parseFloat(token.marketcap).toFixed(2)}</td>
                <td>${parseFloat(token.price).toFixed(6)}</td>
                <td>{token.holders}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="6">No records found</td></tr>
          )}
        </tbody>
      </table>
      <div className="pagination">
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>First</button>
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage >= totalPages}>Next</button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}>Last</button>
      </div>
    </div>
  );
}

export default App;
