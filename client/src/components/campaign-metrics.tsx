import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CampaignMetrics } from "@trainwell-funnel/shared"

interface CampaignMetricsTableProps {
  campaigns: CampaignMetrics[]
  isLoading?: boolean
}

export function CampaignMetricsTable({ campaigns, isLoading }: CampaignMetricsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Loading campaign data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <p className="text-sm">Analyzing campaigns...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>No campaign data available for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">No UTM campaigns found</p>
              <p className="text-xs">Make sure your events include UTM parameters</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Performance</CardTitle>
        <CardDescription>
          Top performing campaigns by user acquisition and conversion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Medium</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Total Users</TableHead>
              <TableHead className="text-right">First Views</TableHead>
              <TableHead className="text-right">Conversion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {campaign.utm_source || '-'}
                </TableCell>
                <TableCell>{campaign.utm_medium || '-'}</TableCell>
                <TableCell>{campaign.utm_campaign || '-'}</TableCell>
                <TableCell className="text-right">
                  {campaign.totalUsers.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {campaign.firstViewUsers.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      campaign.conversionRate >= 80
                        ? 'text-green-600 font-semibold'
                        : campaign.conversionRate >= 50
                          ? 'text-yellow-600 font-semibold'
                          : 'text-red-600 font-semibold'
                    }
                  >
                    {campaign.conversionRate.toFixed(1)}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

interface CampaignSummaryCardsProps {
  totalCampaigns: number
  totalUsers: number
  topCampaign: CampaignMetrics | null
}

export function CampaignSummaryCards({
  totalCampaigns,
  totalUsers,
  topCampaign,
}: CampaignSummaryCardsProps) {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalCampaigns.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Active UTM campaigns
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Campaign Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalUsers.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Total users from campaigns
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          {topCampaign ? (
            <>
              <div className="text-2xl font-bold">
                {topCampaign.utm_campaign || topCampaign.utm_source}
              </div>
              <p className="text-xs text-muted-foreground">
                {topCampaign.totalUsers.toLocaleString()} users · {topCampaign.conversionRate.toFixed(1)}% conversion
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-muted-foreground">-</div>
              <p className="text-xs text-muted-foreground">No campaigns yet</p>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}
