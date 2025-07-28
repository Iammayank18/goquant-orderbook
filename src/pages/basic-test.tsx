import React from 'react';

const BasicTestPage: React.FC = () => {
  return (
    <div style={{ height: '100vh', backgroundColor: 'black', color: 'white', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Basic Test Page</h1>
      
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={{ width: '100px', height: '100px', backgroundColor: 'green' }}>
          Green Box
        </div>
        <div style={{ width: '100px', height: '100px', backgroundColor: 'red' }}>
          Red Box
        </div>
        <div style={{ width: '100px', height: '100px', backgroundColor: 'blue' }}>
          Blue Box
        </div>
      </div>
      
      <div style={{ marginTop: '40px' }}>
        <p>If you can see this text and the colored boxes above, React is working.</p>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default BasicTestPage;