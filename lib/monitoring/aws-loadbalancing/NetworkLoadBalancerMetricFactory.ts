import {
  INetworkLoadBalancer,
  INetworkTargetGroup,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";

import {
  ILoadBalancerMetricFactory,
  BaseLoadBalancerMetricFactoryProps,
} from "./LoadBalancerMetricFactory";
import {
  HealthyMetricColor,
  MetricFactory,
  MetricStatistic,
  UnhealthyMetricColor,
} from "../../common";

/**
 * Props to create NetworkLoadBalancerMetricFactory.
 */
export interface NetworkLoadBalancerMetricFactoryProps
  extends BaseLoadBalancerMetricFactoryProps {
  readonly networkLoadBalancer: INetworkLoadBalancer;
  readonly networkTargetGroup: INetworkTargetGroup;
}

/**
 * Metric factory to create metrics for network load-balanced service.
 */
export class NetworkLoadBalancerMetricFactory
  implements ILoadBalancerMetricFactory
{
  protected readonly metricFactory: MetricFactory;
  protected readonly networkLoadBalancer: INetworkLoadBalancer;
  protected readonly networkTargetGroup: INetworkTargetGroup;
  protected readonly invertStatisticsOfTaskCountEnabled: boolean;

  constructor(
    metricFactory: MetricFactory,
    props: NetworkLoadBalancerMetricFactoryProps
  ) {
    this.metricFactory = metricFactory;
    this.networkLoadBalancer = props.networkLoadBalancer;
    this.networkTargetGroup = props.networkTargetGroup;
    this.invertStatisticsOfTaskCountEnabled =
      props.invertStatisticsOfTaskCountEnabled ?? false;
  }

  metricHealthyTaskCount() {
    return this.metricFactory.adaptMetric(
      this.networkTargetGroup.metrics.healthyHostCount({
        label: "Healthy Tasks",
        color: HealthyMetricColor,
        statistic: this.invertStatisticsOfTaskCountEnabled
          ? MetricStatistic.MIN
          : MetricStatistic.MAX,
      })
    );
  }

  metricUnhealthyTaskCount() {
    return this.metricFactory.adaptMetric(
      this.networkTargetGroup.metrics.unHealthyHostCount({
        label: "Unhealthy Tasks",
        color: UnhealthyMetricColor,
        statistic: this.invertStatisticsOfTaskCountEnabled
          ? MetricStatistic.MAX
          : MetricStatistic.MIN,
      })
    );
  }

  metricHealthyTaskInPercent() {
    const healthyTaskCount = this.metricHealthyTaskCount();
    const unhealthyTaskCount = this.metricUnhealthyTaskCount();
    return this.metricFactory.createMetricMath(
      "(healthyTaskCount / (healthyTaskCount + unhealthyTaskCount)) * 100",
      { healthyTaskCount, unhealthyTaskCount },
      "Healthy Task Percent (avg: ${AVG})"
    );
  }

  metricActiveConnectionCount() {
    return this.metricFactory.adaptMetric(
      this.networkLoadBalancer.metrics.activeFlowCount({
        label: "Active",
      })
    );
  }

  metricNewConnectionCount() {
    return this.metricFactory.adaptMetric(
      this.networkLoadBalancer.metrics.newFlowCount({
        label: "New",
      })
    );
  }

  metricProcessedBytesMin() {
    return this.metricFactory.adaptMetric(
      this.networkLoadBalancer.metrics.processedBytes({
        statistic: MetricStatistic.MIN,
        label: "Processed Bytes (min)",
      })
    );
  }
}
