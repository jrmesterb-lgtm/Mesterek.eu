import { AppShell } from '@/components/app-shell'
import { CategorySearch } from '@/components/category-search'

export const metadata = { title: 'Szakmai kategóriák' }
export default function CategoriesPage() {
  return <AppShell><div className="page-wrap"><h1 className="page-title">Milyen szakembert keres?</h1><p className="page-lead">Válasszon az alábbi kategóriák közül. A következő oldalon település szerint is szűrhet.</p><CategorySearch /></div></AppShell>
}
