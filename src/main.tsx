import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { Analytics } from "@vercel/analytics/react"
import './index.css'
import App from './App.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_ZGV2b3RlZC1zd2FuLTIzLmNsZXJrLmFjY291bnRzLmRldiQ';

if (!PUBLISHABLE_KEY) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0b10',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          background: '#11131e',
          border: '3px solid #7c5cff',
          borderRadius: '16px',
          padding: '2.5rem',
          boxShadow: '0 8px 30px rgba(124, 92, 255, 0.2)'
        }}>
          <h2 style={{ color: '#7c5cff', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            ⚠️ Configuration Required
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
            Please configure your <strong>Clerk Publishable Key</strong> to start the application.
          </p>
          <div style={{
            background: '#07080c',
            border: '1px dashed #4b5563',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'left',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            color: '#a78bfa',
            marginBottom: '1.5rem'
          }}>
            1. Create a <strong>.env</strong> file in the project root folder.<br/>
            2. Add the following line:<br/>
            <span style={{ color: '#34d399', fontWeight: 'bold' }}>VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</span>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#7c5cff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Reload App
          </button>
        </div>
      </div>
    </StrictMode>
  );
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
      <Analytics />
    </StrictMode>,
  )
}

