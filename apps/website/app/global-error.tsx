'use client'

// Replaces Next's legacy pages-style /500 fallback for the App Router.
// This file intentionally renders its own <html>/<body> — it replaces the
// root layout entirely when an error escapes every other boundary.
export default function GlobalError() {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#06091A',
            color: '#fff',
            textAlign: 'center',
            padding: '24px',
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: '#A78BFA', marginBottom: 12 }}>
            SOMETHING WENT WRONG
          </p>
          <h1 style={{ fontSize: 28, marginBottom: 16 }}>We hit an unexpected error</h1>
          <a
            href="/"
            style={{
              borderRadius: 8,
              background: '#10B981',
              color: '#06091A',
              padding: '12px 20px',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Back to SaccoSphere
          </a>
        </main>
      </body>
    </html>
  )
}
