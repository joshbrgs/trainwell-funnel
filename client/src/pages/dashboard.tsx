import { useState, useEffect } from "react"
import { type DateRange } from "react-day-picker"
import { subDays } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useHealthCheck, useFunnelAnalysis } from "@/hooks/use-events"
import { useCampaignAnalysis } from "@/hooks/use-campaigns"
import { DateRangePicker } from "@/components/date-range-picker"
import { FunnelStepBuilder, type FunnelStep } from "@/components/funnel-step-builder"
import { FunnelVisualization, type FunnelData } from "@/components/funnel-visualization"
import { CampaignMetricsTable, CampaignSummaryCards } from "@/components/campaign-metrics"
import type { FunnelStepConfig, FunnelAnalysisResponse, CampaignAnalysisResponse } from "@trainwell-funnel/shared"

export function DashboardPage() {
  const { data: health, isLoading } = useHealthCheck()
  const { mutate: analyzeFunnel, data: funnelResults, isPending, isError, error } = useFunnelAnalysis()
  const { mutate: analyzeCampaigns, data: campaignResults, isPending: isCampaignPending } = useCampaignAnalysis()

  // Date range state - default to last 30 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  // Funnel steps state
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([])

  // Debounced funnel analysis - wait 1 second after user stops typing
  useEffect(() => {
    if (funnelSteps.length === 0 || !dateRange?.from || !dateRange?.to) {
      return
    }

    // Validate that all steps have required values
    const hasEmptySteps = funnelSteps.some(
      step => !step.name.trim() || !step.matchValue.trim()
    )
    if (hasEmptySteps) {
      return
    }

    const timeoutId = setTimeout(() => {
      const request = {
        steps: funnelSteps.map((step): FunnelStepConfig => ({
          name: step.name,
          matchType: step.matchType,
          matchValue: step.matchValue,
        })),
        startDate: dateRange.from!.toISOString(),
        endDate: dateRange.to!.toISOString(),
      }
      analyzeFunnel(request)
    }, 1000) // 1 second debounce

    return () => clearTimeout(timeoutId)
  }, [funnelSteps, dateRange, analyzeFunnel])

  // Campaign analysis - trigger when date range changes
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return
    }

    const timeoutId = setTimeout(() => {
      const request = {
        startDate: dateRange.from!.toISOString(),
        endDate: dateRange.to!.toISOString(),
      }
      analyzeCampaigns(request)
    }, 1000) // 1 second debounce

    return () => clearTimeout(timeoutId)
  }, [dateRange, analyzeCampaigns])

  // Convert API results to visualization data
  const funnelData: FunnelData[] = funnelResults?.success && funnelResults.data
    ? funnelResults.data.steps.map(step => ({
        step: step.step,
        users: step.users,
        conversionRate: step.conversionRate,
        dropoffRate: step.dropoffRate,
      }))
    : []

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <div className="flex items-center space-x-4">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          {!isLoading && health && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>API Connected</span>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="funnel" className="w-full">
        <TabsList>
          <TabsTrigger value="funnel">Funnel Analysis</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          <FunnelTab
            funnelResults={funnelResults}
            funnelData={funnelData}
            funnelSteps={funnelSteps}
            setFunnelSteps={setFunnelSteps}
            isPending={isPending}
            isError={isError}
            error={error}
          />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignTab
            campaignResults={campaignResults}
            isCampaignPending={isCampaignPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FunnelTab({
  funnelResults,
  funnelData,
  funnelSteps,
  setFunnelSteps,
  isPending,
  isError,
  error
}: {
  funnelResults: FunnelAnalysisResponse | undefined
  funnelData: FunnelData[]
  funnelSteps: FunnelStep[]
  setFunnelSteps: (steps: FunnelStep[]) => void
  isPending: boolean
  isError: boolean
  error: Error | null
}) {
  return (
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {funnelResults?.data?.summary.totalUsers.toLocaleString() ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Entered the funnel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {funnelResults?.data?.summary.completedUsers.toLocaleString() ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Finished all steps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {funnelResults?.data?.summary.overallConversionRate.toFixed(1) ?? '-'}%
            </div>
            <p className="text-xs text-muted-foreground">
              End-to-end conversion rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="min-h-screen flex-1 rounded-xl md:min-h-min">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 h-full">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Funnel Visualization</CardTitle>
              <CardDescription>
                {isPending ? 'Analyzing funnel...' : 'Configure your funnel steps to analyze user flow'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {isError && (
                <div className="flex h-[350px] items-center justify-center text-destructive">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium">Error analyzing funnel</p>
                    <p className="text-xs">{error?.message || 'An unknown error occurred'}</p>
                  </div>
                </div>
              )}
              {!isError && <FunnelVisualization data={funnelData} />}
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Funnel Configuration</CardTitle>
              <CardDescription>
                Add and configure funnel steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FunnelStepBuilder steps={funnelSteps} onChange={setFunnelSteps} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

function CampaignTab({
  campaignResults,
  isCampaignPending,
}: {
  campaignResults: CampaignAnalysisResponse | undefined
  isCampaignPending: boolean
}) {
  const campaigns = campaignResults?.success && campaignResults.data
    ? campaignResults.data.campaigns
    : []

  const summary = campaignResults?.success && campaignResults.data
    ? campaignResults.data.summary
    : { totalCampaigns: 0, totalUsers: 0, topCampaign: null }

  return (
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <CampaignSummaryCards
          totalCampaigns={summary.totalCampaigns}
          totalUsers={summary.totalUsers}
          topCampaign={summary.topCampaign}
        />
      </div>

      <CampaignMetricsTable
        campaigns={campaigns}
        isLoading={isCampaignPending}
      />
    </>
  )
}
