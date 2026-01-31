// app/global-error.jsx
'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2>Something went wrong!</h2>
          <p>{error?.message || 'An unexpected error occurred'}</p>
          <button 
            onClick={() => reset()}
            style={{ padding: '10px 20px', marginTop: '10px' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}