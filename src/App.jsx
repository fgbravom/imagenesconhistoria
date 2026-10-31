import { Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import Navbar from './components/Navbar'
import AdminLayout from './components/admin/AdminLayout'
import Home from './pages/Home'
import PhotoDetail from './pages/PhotoDetail'
import Login from './pages/Login'
import Overview from './pages/admin/Overview'
import Photos from './pages/admin/Photos'
import Publish from './pages/admin/Publish'
import Queue from './pages/admin/Queue'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/foto/:id" element={<PhotoDetail />} />
          <Route path="/login" element={<Login />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="fotos" element={<Photos />} />
          <Route path="publicar" element={<Publish />} />
          <Route path="cola" element={<Queue />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}
