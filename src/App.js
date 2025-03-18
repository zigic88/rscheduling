import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tokens, setTokens] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('contains');
  const [filters, setFilters] = useState({
    name: '',
    symbol: '',
    address: '',
    decimals: '',
    notIncludePump: true,
    notIncludeMoon: true,
    createdOnPump: false,
    difMetadataName: false,
    difMetadataSymbol: false,
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
    metadata_image: '',
    metadata_description: '',
  });

  const ITEMS_PER_PAGE = 20;
  const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || 'https://139.180.184.90/api/tokens';
  const UPDATE_METADATA_ENDPOINT = process.env.REACT_APP_UPDATE_METADATA_ENDPOINT || 'https://139.180.184.90/api/update-metadata';
  const API_TELEGRAM_BOT_ENDPOINT = process.env.REACT_APP_API_TELEGRAM_BOT_ENDPOINT || 'https://139.180.184.90/api/bot/sendMessage';

  const handleFilterTypeChange = (event) => {
    setFilterType(event.target.value);
  };

  const fetchData = async () => {
    console.log('Selected Filter Type:', filterType);
    setLoading(true);
    try {
      let queryParams = new URLSearchParams({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });
      queryParams.append('filter_type', filterType);

      if (filters.name) queryParams.append('name', filters.name);
      if (filters.address) queryParams.append('address', filters.address);
      if (filters.symbol) queryParams.append('symbol', filters.symbol);
      if (filters.notIncludePump) queryParams.append('excludePump', filters.notIncludePump);
      if (filters.notIncludeMoon) queryParams.append('excludeMoon', filters.notIncludeMoon);
      if (filters.createdOnPump) queryParams.append('createdOn', filters.createdOnPump);
      if (filters.difMetadataName) queryParams.append('difMetadataName', filters.difMetadataName);
      if (filters.difMetadataSymbol) queryParams.append('difMetadataSymbol', filters.difMetadataSymbol);
      if (filters.decimals) queryParams.append('decimals', filters.decimals);
      if (filters.holders) queryParams.append('holders', filters.holders);
      if (filters.marketcap) queryParams.append('marketcap', filters.marketcap);
      if (filters.supply) queryParams.append('supply', filters.supply);
      if (filters.price) queryParams.append('price', filters.price);
      if (filters.volume_24h) queryParams.append('volume_24h', filters.volume_24h);
      if (filters.created_on) queryParams.append('created_on', filters.created_on);
      if (filters.freeze_authority) queryParams.append('freeze_authority', filters.freeze_authority);
      if (filters.metadata_name) queryParams.append('metadata_name', filters.metadata_name);
      if (filters.metadata_symbol) queryParams.append('metadata_symbol', filters.metadata_symbol);
      if (filters.metadata_image) queryParams.append('metadata_image', filters.metadata_image);
      if (filters.metadata_description) queryParams.append('metadata_description', filters.metadata_description);

      const response = await axios.get(`${API_ENDPOINT}?${queryParams.toString()}`);
      console.log("Query Param: ", queryParams.toString());
      console.log("API Response:", response.data); // Debugging log
      setTokens(response.data.data && Array.isArray(response.data.data) ? response.data.data : []);
      setTotalPages(Math.ceil(response.data.total / ITEMS_PER_PAGE) || 1);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRefresh = () => {
    setFilters({
      name: '',
      address: '',
      notIncludePump: true,
      notIncludeMoon: true,
      createdOnPump: false
    });
    setCurrentPage(1);
    fetchData();
  };


  const handleUpdateMetadata = async () => {
    const filteredAddresses = tokens.map((token) => token.address);
    console.log('checked ' + filteredAddresses);

    try {
      setLoading(true);
      const response = await axios.post(UPDATE_METADATA_ENDPOINT, { addresses: filteredAddresses });
      // alert(response.data.message);
      fetchData(); // Refresh data after update
    } catch (err) {
      alert("Error updating metadata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBotMessage = async () => {
    try {
      setLoading(true);
      const response = await axios.post(API_TELEGRAM_BOT_ENDPOINT, { chat_id: '-4623457838', text: 'Lola bocillll' });
      // alert(response.data.message);      
    } catch (err) {
      alert("Error updating metadata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

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
    metadata_description: true
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
    { key: "metadata_description", label: "Metadata Description" },
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
          <button onClick={handleRefresh} className="refresh-button">Refresh</button>
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
                difMetadataName: false,
                difMetadataSymbol: false,
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
                metadata_image: '',
                metadata_description: ''
              })
            }
          >
            Clear Filters
          </button>
          <div className="checkbox-filter" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <label>
              <input
                type="checkbox"
                checked={setFilters.difMetadataName}
                onChange={(e) => setFilters({ ...setFilters, difMetadataName: e.target.checked })}
              />
              Diff Name - Metadata Name
            </label>
            <label>
              <input
                type="checkbox"
                checked={setFilters.difMetadataSymbol}
                onChange={(e) => setFilters({ ...setFilters, difMetadataSymbol: e.target.checked })}
              />
              Diff Symbol - Metadata Symbol
            </label>
          </div>
        </div>
        <div style={{ fontSize: '14px' }}>
          <span>Total Records: {tokens.length}</span> | <span>Page {currentPage} of {totalPages}</span>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button ref={buttonRef} className="settings-button" onClick={togglePopup}>⚙️</button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <label>Filter Type:</label>
                          <input type="radio" id="contains" name="filterType" value="contains" checked={filterType === 'contains'} onChange={handleFilterTypeChange} />
                          <label htmlFor="contains">Contains</label>
                          <input type="radio" id="equals" name="filterType" value="equals" checked={filterType === 'equals'} onChange={handleFilterTypeChange} />
                          <label htmlFor="equals">Equals</label>
                        </div>
                        <button onClick={fetchData} className="execute-button">Apply Filter</button>
                      </div>
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
                  {tokens.length > 0 ? (
                    tokens.map(token => (
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
                            ) : col.key === "created_date" ? (
                              <div>{new Date(token.created_date).toLocaleString()}</div>
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
            <button onClick={() => setCurrentPage(1)}>First Page</button>
            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>Previous</button>
            <button onClick={() => setCurrentPage((prev) => prev + 1)}>Next</button>
            <button onClick={() => setCurrentPage(totalPages)}>Last Page</button>
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
      {!loading && !error && tokens.length === 0 && <p>No tokens found.</p>}
    </div>
  );
}

export default App;
