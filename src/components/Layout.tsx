import { NavLink, Outlet } from 'react-router-dom'

const tools = [
  {
    path: '/fluid-type-scale',
    label: 'Fluid Type Scale',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <text x="2" y="15" style={{ fontSize: 16, fill: 'currentColor', stroke: 'none', fontWeight: 700 }}>
          T
        </text>
        <line x1="11" y1="13" x2="18" y2="13" />
        <line x1="11" y1="9" x2="17" y2="9" />
        <line x1="11" y1="5" x2="15" y2="5" />
      </svg>
    ),
  },
]

export function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%' }}>
      <aside
        style={{
          width: 48,
          background: '#111',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 8,
          gap: 4,
          flexShrink: 0,
          borderRight: '1px solid #222',
        }}
      >
        {tools.map((tool) => (
          <NavLink
            key={tool.path}
            to={tool.path}
            title={tool.label}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 8,
              background: isActive ? '#2a2a2a' : 'transparent',
              color: isActive ? '#fff' : '#666',
              transition: 'all .15s',
              textDecoration: 'none',
            })}
          >
            {tool.icon}
          </NavLink>
        ))}
      </aside>
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  )
}
