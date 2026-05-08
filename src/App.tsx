import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import FluidTypeScale from './tools/fluid-type-scale'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/fluid-type-scale" replace />} />
          <Route path="fluid-type-scale" element={<FluidTypeScale />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
