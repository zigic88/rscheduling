import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tokens, setTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
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
    freeze_authority: '',
    metadata_name: '',
    metadata_symbol: '',
    metadata_image: ''
  });

  const ITEMS_PER_PAGE = 20;
  const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || 'https://139.180.184.90/api/tokens';
  const UPDATE_METADATA_ENDPOINT = process.env.REACT_APP_UPDATE_METADATA_ENDPOINT || 'https://139.180.184.90/api/update-metadata';

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

  const handleUpdateMetadata = async () => {
    const filteredAddresses = filteredTokens.map((token) => token.address);
    console.log('checked ' + filteredAddresses);

    try {
      setLoading(true);
      const response = await axios.post(UPDATE_METADATA_ENDPOINT, { addresses: filteredAddresses });
      // alert(response.data.message);
      fetchTokens(); // Refresh data after update
    } catch (err) {
      alert("Error updating metadata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    let filtered = tokens.filter((token) => {
      // const matchesFilters =
      //   (token.name?.toLowerCase() || '').includes(filters.name.toLowerCase()) &&
      //   (token.symbol?.toLowerCase() || '').includes(filters.symbol.toLowerCase()) &&
      //   (token.address?.toLowerCase() || '').includes(filters.address.toLowerCase()) &&
      //   (token.created_date?.toLowerCase() || '').includes(filters.created_date.toLowerCase()) &&
      //   (token.holders?.toString() || '').includes(filters.holders) &&
      //   (token.marketcap?.toLowerCase() || '').includes(filters.marketcap.toLowerCase()) &&
      //   (token.supply?.toLowerCase() || '').includes(filters.supply.toLowerCase()) &&
      //   (token.price?.toLowerCase() || '').includes(filters.price.toLowerCase()) &&
      //   (token.volume_24h?.toLowerCase() || '').includes(filters.volume_24h.toLowerCase()) &&
      //   (token.created_on?.toLowerCase() || '').includes(filters.created_on.toLowerCase()) &&
      //   (token.metadata_name?.toLowerCase() || '').includes(filters.metadata_name.toLowerCase()) &&
      //   (token.metadata_symbol?.toLowerCase() || '').includes(filters.metadata_symbol.toLowerCase()) &&
      //   (token.metadata_image?.toLowerCase() || '').includes(filters.metadata_image.toLowerCase()) &&
      //   (filters.decimals === '' || token.decimals.toString() === filters.decimals) &&
      //   (token.freeze_authority?.toLowerCase() || '').includes(filters.freeze_authority.toLowerCase());

      const matchesNotIncludePump =
        filters.notIncludePump ? !(token.address?.toLowerCase() || '').endsWith('pump') : true;

      const matchesNotIncludeMoon =
        filters.notIncludeMoon ? !(token.address?.toLowerCase() || '').endsWith('moon') : true;

      const matchesCreatedOnPump =
        filters.createdOnPump ? token.created_on === 'https://pump.fun' : true;

      return matchesNotIncludePump && matchesNotIncludeMoon && matchesCreatedOnPump;
    });

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

  //Open Href link for Address attribute
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


  //For Visible Column Configuration
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef(null);
  const buttonRef = useRef(null);

  // Define column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    symbol: true,
    address: true,
    decimals: true,
    created_date: true,
    holders: true,
    marketcap: true,
    supply: true,
    price: true,
    volume_24h: true,
    created_on: true,
    freeze_authority: true,
    metadata_name: true,
    metadata_symbol: true,
    metadata_image: true,
  });

  // Define the columns
  const columns = [
    { key: "name", label: "Name" },
    { key: "symbol", label: "Symbol" },
    { key: "address", label: "Address" },
    { key: "decimals", label: "Decimals" },
    { key: "created_date", label: "Created Date" },
    { key: "holders", label: "Holders" },
    { key: "marketcap", label: "Market Cap" },
    { key: "supply", label: "Supply" },
    { key: "price", label: "Price" },
    { key: "volume_24h", label: "24h Volume" },
    { key: "created_on", label: "Created On" },
    { key: "freeze_authority", label: "Freeze Authority" },
    { key: "metadata_name", label: "Metadata Name" },
    { key: "metadata_symbol", label: "Metadata Symbol" },
    { key: "metadata_image", label: "Metadata Image" },
  ];

  // Function to toggle column visibility
  const toggleColumn = (column) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  // Ensure popup stays at the top of the table without shifting content
  useEffect(() => {
    if (showPopup && popupRef.current) {
      popupRef.current.style.position = "absolute";
      popupRef.current.style.top = "10px"; // Fixed at top
      popupRef.current.style.left = "10px"; // Aligned with table left
    }
  }, [showPopup]);

  return (
    <div className="App">
      <h1 style={{ marginTop: '10px', marginBottom: '5px' }}>Token List</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchTokens} className="refresh-button">Refresh</button>
          <button className="clear-filter-button"
            onClick={() =>
              setFilters({
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
                freeze_authority: '',
                metadata_name: '',
                metadata_symbol: '',
                metadata_image: ''
              })
            }
          >
            Clear Filters
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={handleUpdateMetadata} className="update-metadata-button">Update Metadata</button>
            <label>
              <input
                type="checkbox"
                checked={filters.notIncludePump}
                onChange={(e) => setFilters({ ...setFilters, notIncludePump: e.target.checked })}
              />
              Not Include Pump
            </label>
            <label>
              <input
                type="checkbox"
                checked={setFilters.notIncludeMoon}
                onChange={(e) => setFilters({ ...setFilters, notIncludeMoon: e.target.checked })}
              />
              Not Include Moon
            </label>
            <label>
              <input
                type="checkbox"
                checked={setFilters.createdOnPump}
                onChange={(e) => setFilters({ ...setFilters, createdOnPump: e.target.checked })}
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
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <div style={{ position: "relative" }}>
            <div className="table-container">
              <table className="token-table" style={{ width: '100%', position: "relative" }}>
                <thead>
                  <tr>
                    <th colSpan={columns.length} style={{ textAlign: "left", position: "relative" }}>
                      {/* Settings Button (Top-Left Inside Table) */}
                      <button ref={buttonRef} className="settings-button" onClick={togglePopup}>⚙️</button>
                    </th>
                  </tr>
                  <tr>
                    {columns.map(col => visibleColumns[col.key] && (
                      <th key={col.key}>
                        <input
                          type="text"
                          name={col.key}
                          placeholder={`Filter by ${col.label}`}
                          value={filters[col.key]}
                          onChange={(e) => setFilters({ ...filters, [col.key]: e.target.value })}
                        />
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTokens.length > 0 ? (
                    filteredTokens.map(token => (
                      <tr key={token.address}>
                        {columns.map(col => visibleColumns[col.key] && (
                          <td key={col.key}>
                            {col.key === "metadata_image" ? (
                              token.metadata_image ?
                                <div>
                                  <img src={token.metadata_image} alt="Metadata" style={{ width: "30px", height: "30px" }} />
                                  {token.metadata_image}</div>
                                : '-'
                            ) : col.key === "address" ? (
                              <a href="#" onClick={() => openInBackground(`https://solscan.io/token/${token.address}`)}>
                                {token.address}
                              </a>
                            ) : (
                              token[col.key] || '-'
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6">No records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="pagination" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>First</button>
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage >= totalPages}>Next</button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}>Last</button>
          </div>

          {/* Popup for Column Selection */}
          {showPopup && (
            <div ref={popupRef} className="popup-container">
              <h4>Select Columns:</h4>
              {columns.map(col => (
                <label key={col.key} style={{ display: "block" }}>
                  <input type="checkbox" checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} />
                  {col.label}
                </label>
              ))}
              <button onClick={closePopup}>OK</button>
            </div>
          )}
        </>
      )}
      {!loading && !error && filteredTokens.length === 0 && <p>No tokens found.</p>}
    </div>
  );
}

export default App;
