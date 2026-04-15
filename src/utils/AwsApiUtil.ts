import { AwsClient } from 'aws4fetch';
import { AccessKeys } from '@/model';
import { InternalServerError } from '@/error';

interface CostExplorerResult {
  accountId: string;
  periodStart: string;
  periodEnd: string;
  totalCost: number;
  currency: string;
  serviceBreakdown: Record<string, number>;
}

class AwsApiUtil {
  public static async getCostAndUsage(
    accessKeys: AccessKeys,
    startDate: string,
    endDate: string,
    granularity: 'DAILY' | 'MONTHLY' = 'DAILY',
    region: string = 'us-east-1',
  ): Promise<CostExplorerResult[]> {
    const client: AwsClient = new AwsClient({
      service: 'ce',
      region: region,
      accessKeyId: accessKeys.accessKeyId,
      secretAccessKey: accessKeys.secretAccessKey,
      sessionToken: accessKeys.sessionToken,
    });

    const body = JSON.stringify({
      TimePeriod: { Start: startDate, End: endDate },
      Granularity: granularity,
      Metrics: ['UnblendedCost'],
      GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
    });

    const response: Response = await client.fetch(`https://ce.${region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSInsightsIndexService.GetCostAndUsage',
      },
      body,
    });

    const responseText: string = await response.text();

    if (!response.ok) {
      console.error(`Cost Explorer API failed: ${response.status}\n${responseText}`);
      throw new InternalServerError(`Cost Explorer API failed: ${response.status}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = JSON.parse(responseText);
    const results: CostExplorerResult[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const result of data.ResultsByTime || []) {
      const serviceBreakdown: Record<string, number> = {};
      let totalCost: number = 0;
      let currency: string = 'USD';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const group of result.Groups || []) {
        const serviceName: string = group.Keys?.[0] || 'Unknown';
        const amount: number = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
        currency = group.Metrics?.UnblendedCost?.Unit || 'USD';
        if (amount > 0) {
          serviceBreakdown[serviceName] = amount;
          totalCost += amount;
        }
      }

      results.push({
        accountId: '',
        periodStart: result.TimePeriod?.Start || startDate,
        periodEnd: result.TimePeriod?.End || endDate,
        totalCost: Math.round(totalCost * 100) / 100,
        currency,
        serviceBreakdown,
      });
    }

    return results;
  }
}

export { AwsApiUtil };
export type { CostExplorerResult };
