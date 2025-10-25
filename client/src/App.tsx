import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { DashboardPage } from "@/pages/dashboard"

function App() {
  return (
    <div className="[--header-height:calc(var(--spacing)*14)]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <DashboardPage />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}

export default App
