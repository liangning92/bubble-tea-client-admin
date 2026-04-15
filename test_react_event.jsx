import React from 'react';
import ReactDOM from 'react-dom/client';

function TestApp() {
  const handleClick = (e) => {
    console.log('Button clicked!', e);
    alert('Button clicked!');
  };

  const handleDivClick = (e) => {
    console.log('Div clicked!', e);
  };

  return (
    <div onClick={handleDivClick} style={{ padding: '20px', background: '#f0f0f0' }}>
      <h1>React Event Test</h1>
      <button onClick={handleClick} style={{ padding: '10px', background: 'blue', color: 'white' }}>
        Test React Button
      </button>
      <button onClick={() => console.log('Inline arrow function')}>
        Inline Arrow Function
      </button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TestApp />);
