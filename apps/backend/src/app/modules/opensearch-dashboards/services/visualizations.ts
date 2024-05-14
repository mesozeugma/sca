import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { TemporarySavedObjectUsedEvent } from '../events/temporary-saved-object-used.event';
import { VegaImportsSankeyChart } from '../vega/imports-sankey-chart';

import {
  OpensearchDashboardsSavedObjects,
  SavedObjectType,
} from './saved-objects';
import { OpensearchDashboardsSearches } from './saved-searchs';

@Injectable()
export class OpensearchDashboardsVisualizations {
  savedObjectType = SavedObjectType.VISUALIZATION;

  constructor(
    private readonly eventBus: EventBus,
    private readonly savedObjectsClient: OpensearchDashboardsSavedObjects,
    private readonly searchesClient: OpensearchDashboardsSearches
  ) {}

  async getAll() {
    return await this.savedObjectsClient.getByType(this.savedObjectType);
  }

  private createAttributes(title: string, visState: Record<string, unknown>) {
    return {
      title,
      visState: JSON.stringify(visState),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          query: { query: '', language: 'kuery' },
          filter: [],
        }),
      },
      savedSearchRefName: 'search_0',
    };
  }

  private createReferences(searchId: string) {
    return [
      {
        name: 'search_0',
        type: 'search',
        id: searchId,
      },
    ];
  }

  private async save(
    title: string,
    visState: Record<string, unknown>,
    searchId?: string
  ) {
    const payload = {
      attributes: this.createAttributes(title, visState),
      references: searchId !== undefined ? this.createReferences(searchId) : [],
    };
    const resultSavedObject = await this.savedObjectsClient.save(
      this.savedObjectType,
      payload
    );

    this.eventBus.publish(
      new TemporarySavedObjectUsedEvent(
        this.savedObjectType,
        resultSavedObject.id
      )
    );
    return resultSavedObject;
  }

  private createCountAggregation(id: number) {
    return {
      id: String(id),
      enabled: true,
      type: 'count',
      params: {},
      schema: 'metric',
    };
  }

  private createTopHitsAggregation(
    id: number,
    params: { field: string; label?: string }
  ) {
    return {
      id: String(id),
      enabled: true,
      type: 'top_hits',
      params: {
        field: params.field,
        aggregate: 'concat',
        size: 1,
        sortField: 'repository.date',
        sortOrder: 'desc',
        customLabel: params.label,
      },
      schema: 'metric',
    };
  }

  private createTermsAggregation(
    id: number,
    params: {
      field: string;
      label: string;
      schema: 'group' | 'segment';
      order: 'asc' | 'desc';
      orderBy: '1' | '_key';
      size: number;
      otherBucketEnabled: boolean;
    }
  ) {
    return {
      id: String(id),
      enabled: true,
      type: 'terms',
      params: {
        field: params.field,
        orderBy: params.orderBy,
        order: params.order,
        size: params.size,
        otherBucket: params.otherBucketEnabled,
        otherBucketLabel: 'Other',
        missingBucket: false,
        missingBucketLabel: 'Missing',
        customLabel: params.label,
      },
      schema: params.schema,
    };
  }

  private createDateHistogramAggregation(id: number) {
    return {
      id: String(id),
      enabled: true,
      type: 'date_histogram',
      params: {
        field: 'repository.date',
        timeRange: { from: 'now-10y', to: 'now' },
        useNormalizedOpenSearchInterval: true,
        scaleMetricValues: false,
        interval: 'auto',
        drop_partials: false,
        min_doc_count: 1,
        extended_bounds: {},
        customLabel: 'Timestamp',
      },
      schema: 'segment',
    };
  }

  private createCountLineVisState(params: {
    title: string;
    field: string;
    fieldLabel: string;
  }) {
    return {
      title: params.title,
      type: 'line',
      aggs: [
        this.createCountAggregation(1),
        this.createTermsAggregation(2, {
          field: params.field,
          label: params.fieldLabel,
          schema: 'group',
          order: 'desc',
          orderBy: '1',
          size: 10,
          otherBucketEnabled: true,
        }),
        this.createDateHistogramAggregation(3),
      ],
      params: {
        type: 'line',
        grid: { categoryLines: false, valueAxis: '' },
        categoryAxes: [
          {
            id: 'CategoryAxis-1',
            type: 'category',
            position: 'bottom',
            show: true,
            style: {},
            scale: { type: 'linear' },
            labels: { show: true, filter: true, truncate: 100 },
            title: {},
          },
        ],
        valueAxes: [
          {
            id: 'ValueAxis-1',
            name: 'LeftAxis-1',
            type: 'value',
            position: 'left',
            show: true,
            style: {},
            scale: { type: 'linear', mode: 'normal' },
            labels: {
              show: true,
              rotate: 0,
              filter: false,
              truncate: 100,
            },
            title: { text: 'Count' },
          },
        ],
        seriesParams: [
          {
            show: true,
            type: 'line',
            mode: 'normal',
            data: { label: 'Count', id: '1' },
            valueAxis: 'ValueAxis-1',
            drawLinesBetweenPoints: true,
            lineWidth: 2,
            interpolate: 'linear',
            showCircles: true,
          },
        ],
        addTooltip: true,
        addLegend: true,
        legendPosition: 'right',
        times: [],
        addTimeMarker: false,
        labels: {},
        thresholdLine: {
          show: false,
          value: 10,
          width: 1,
          style: 'full',
          color: '#E7664C',
        },
      },
    };
  }

  async createSemanticSymbolKind(repositoryName: string) {
    const visualizationTitle = `${repositoryName} :: semantic symbol kind`;
    const search = await this.searchesClient.createSemantic(repositoryName);
    const visState = this.createCountLineVisState({
      title: visualizationTitle,
      field: 'symbol.kind.keyword',
      fieldLabel: 'Symbol kind',
    });
    return await this.save(visualizationTitle, visState, search.id);
  }

  private createHorizontalBarLatestVisState(params: {
    title: string;
    metricField: string;
    metricLabel: string;
    yExtents?: [number, number];
  }) {
    return {
      title: params.title,
      type: 'horizontal_bar',
      aggs: [
        this.createTopHitsAggregation(1, {
          field: params.metricField,
          label: params.metricLabel,
        }),
        this.createTermsAggregation(2, {
          field: 'repository.name.keyword',
          label: 'Repository name',
          schema: 'group',
          order: 'asc',
          orderBy: '_key',
          size: 10,
          otherBucketEnabled: false,
        }),
      ],
      params: {
        type: 'histogram',
        grid: { categoryLines: false, valueAxis: '' },
        categoryAxes: [
          {
            id: 'CategoryAxis-1',
            type: 'category',
            position: 'left',
            show: false,
            style: {},
            scale: { type: 'linear' },
            labels: {
              show: true,
              rotate: 0,
              filter: false,
              truncate: 200,
            },
            title: {},
          },
        ],
        valueAxes: [
          {
            id: 'ValueAxis-1',
            name: 'BottomAxis-1',
            type: 'value',
            position: 'bottom',
            show: true,
            style: {},
            scale: {
              type: 'linear',
              mode: 'normal',
              setYExtents: params.yExtents !== undefined,
              defaultYExtents: false,
              min:
                params.yExtents !== undefined ? params.yExtents[0] : undefined,
              max:
                params.yExtents !== undefined ? params.yExtents[1] : undefined,
            },
            labels: {
              show: true,
              rotate: 0,
              filter: true,
              truncate: 100,
            },
            title: { text: params.metricLabel },
          },
        ],
        seriesParams: [
          {
            show: true,
            type: 'histogram',
            mode: 'normal',
            data: { label: params.metricLabel, id: '1' },
            valueAxis: 'ValueAxis-1',
            drawLinesBetweenPoints: true,
            lineWidth: 2,
            showCircles: true,
          },
        ],
        addTooltip: true,
        addLegend: true,
        legendPosition: 'right',
        times: [],
        addTimeMarker: false,
        labels: { show: true },
        thresholdLine: {
          show: false,
          value: 10,
          width: 1,
          style: 'full',
          color: '#E7664C',
        },
      },
    };
  }

  async createLineCountForPrimaryLanguageLatest(repositoryNames: string[]) {
    const title = `Lines of source code latest :: ${JSON.stringify(
      repositoryNames
    )}`;
    const search = await this.searchesClient.createLineCountForPrimaryLanguage(
      repositoryNames
    );
    const visState = this.createHorizontalBarLatestVisState({
      title,
      metricField: 'codeLineCount',
      metricLabel: 'Lines of source code',
    });
    return await this.save(title, visState, search.id);
  }

  private createHistogramVisState(title: string, field: string, label: string) {
    return {
      title,
      type: 'histogram',
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'top_hits',
          params: {
            field,
            aggregate: 'concat',
            size: 1,
            sortField: 'repository.date',
            sortOrder: 'desc',
            customLabel: label,
          },
          schema: 'metric',
        },
        this.createDateHistogramAggregation(2),
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'repository.name.keyword',
            orderBy: '_key',
            order: 'desc',
            size: 10,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Repository',
          },
          schema: 'group',
        },
      ],
      params: {
        type: 'histogram',
        grid: { categoryLines: false },
        categoryAxes: [
          {
            id: 'CategoryAxis-1',
            type: 'category',
            position: 'bottom',
            show: true,
            style: {},
            scale: { type: 'linear' },
            labels: { show: true, filter: true, truncate: 100 },
            title: {},
          },
        ],
        valueAxes: [
          {
            id: 'ValueAxis-1',
            name: 'LeftAxis-1',
            type: 'value',
            position: 'left',
            show: true,
            style: {},
            scale: { type: 'linear', mode: 'normal' },
            labels: {
              show: true,
              rotate: 0,
              filter: false,
              truncate: 100,
            },
            title: { text: label },
          },
        ],
        seriesParams: [
          {
            show: true,
            type: 'histogram',
            mode: 'stacked',
            data: { label, id: '1' },
            valueAxis: 'ValueAxis-1',
            drawLinesBetweenPoints: true,
            lineWidth: 2,
            showCircles: true,
          },
        ],
        addTooltip: true,
        addLegend: true,
        legendPosition: 'right',
        times: [],
        addTimeMarker: false,
        labels: { show: false },
        thresholdLine: {
          show: false,
          value: 10,
          width: 1,
          style: 'full',
          color: '#E7664C',
        },
      },
    };
  }

  async createLineCountForPrimaryLanguageHistogram(repositoryNames: string[]) {
    const title = `Lines of source code histogram :: ${JSON.stringify(
      repositoryNames
    )}`;
    const search = await this.searchesClient.createLineCountForPrimaryLanguage(
      repositoryNames
    );
    const visState = this.createHistogramVisState(
      title,
      'codeLineCount',
      'Lines of source code'
    );
    return await this.save(title, visState, search.id);
  }

  async createCommentRatioLatest(repositoryNames: string[]) {
    const title = `Comment ratio latest :: ${JSON.stringify(repositoryNames)}`;
    const search = await this.searchesClient.createLineCountForPrimaryLanguage(
      repositoryNames
    );
    const visState = this.createHorizontalBarLatestVisState({
      title,
      metricField: 'commentRatio',
      metricLabel: 'Comment ratio',
      yExtents: [0, 1],
    });
    return await this.save(title, visState, search.id);
  }

  async createCommentRatioHistogram(repositoryNames: string[]) {
    const title = `Comment ratio histogram :: ${JSON.stringify(
      repositoryNames
    )}`;
    const search = await this.searchesClient.createLineCountForPrimaryLanguage(
      repositoryNames
    );
    const visState = this.createHistogramVisState(
      title,
      'commentRatio',
      'Comment ratio (0-1)'
    );
    return await this.save(title, visState, search.id);
  }

  async createFileCountLatest(repositoryNames: string[]) {
    const title = `File count latest :: ${JSON.stringify(repositoryNames)}`;
    const search = await this.searchesClient.createLineCountForPrimaryLanguage(
      repositoryNames
    );
    const visState = this.createHorizontalBarLatestVisState({
      title,
      metricField: 'fileCount',
      metricLabel: 'File count',
    });
    return await this.save(title, visState, search.id);
  }

  async createFileCountHistogram(repositoryNames: string[]) {
    const title = `File count histogram :: ${JSON.stringify(repositoryNames)}`;
    const search = await this.searchesClient.createLineCountForPrimaryLanguage(
      repositoryNames
    );
    const visState = this.createHistogramVisState(
      title,
      'fileCount',
      'File count'
    );
    return await this.save(title, visState, search.id);
  }

  async createClassCountLatest(repositoryNames: string[]) {
    const title = `Class count latest :: ${JSON.stringify(repositoryNames)}`;
    const search = await this.searchesClient.createSonarQubeMetrics({
      repositoryNames,
      metricNames: ['classes'],
    });
    const visState = this.createHorizontalBarLatestVisState({
      title,
      metricField: 'metric.value',
      metricLabel: 'Class count',
    });
    return await this.save(title, visState, search.id);
  }

  async createClassCountHistogram(repositoryNames: string[]) {
    const title = `Class count histogram :: ${JSON.stringify(repositoryNames)}`;
    const search = await this.searchesClient.createSonarQubeMetrics({
      repositoryNames,
      metricNames: ['classes'],
    });
    const visState = this.createHistogramVisState(
      title,
      'metric.value',
      'Class count'
    );
    return await this.save(title, visState, search.id);
  }

  async createDuplicationRatioLatest(repositoryNames: string[]) {
    const title = `Duplication percentage latest :: ${JSON.stringify(
      repositoryNames
    )}`;
    const search = await this.searchesClient.createSonarQubeMetrics({
      repositoryNames,
      metricNames: ['duplicated_lines_density'],
    });
    const visState = this.createHorizontalBarLatestVisState({
      title,
      metricField: 'metric.value',
      metricLabel: 'Duplication percentage',
      yExtents: [0, 100],
    });
    return await this.save(title, visState, search.id);
  }

  async createDuplicationRatioHistogram(repositoryNames: string[]) {
    const title = `Duplication percentage histogram :: ${JSON.stringify(
      repositoryNames
    )}`;
    const search = await this.searchesClient.createSonarQubeMetrics({
      repositoryNames,
      metricNames: ['duplicated_lines_density'],
    });
    const visState = this.createHistogramVisState(
      title,
      'metric.value',
      'Duplication percentage (0-100)'
    );
    return await this.save(title, visState, search.id);
  }

  async createBugCountLatest(repositoryNames: string[]) {
    const title = `Bug count latest :: ${JSON.stringify(repositoryNames)}`;
    const search = await this.searchesClient.createSonarQubeMetrics({
      repositoryNames,
      metricNames: ['bugs'],
    });
    const visState = this.createHorizontalBarLatestVisState({
      title,
      metricField: 'metric.value',
      metricLabel: 'Bug count',
    });
    return await this.save(title, visState, search.id);
  }

  async createBugCountHistogram(repositoryNames: string[]) {
    const title = `Bug count histogram :: ${JSON.stringify(repositoryNames)}`;
    const search = await this.searchesClient.createSonarQubeMetrics({
      repositoryNames,
      metricNames: ['bugs'],
    });
    const visState = this.createHistogramVisState(
      title,
      'metric.value',
      'Bug count'
    );
    return await this.save(title, visState, search.id);
  }

  private createPieChartVisState(params: {
    title: string;
    metricField: string;
    termsField: string;
    termsFieldLabel: string;
  }) {
    return {
      title: params.title,
      type: 'pie',
      aggs: [
        this.createTopHitsAggregation(1, { field: params.metricField }),
        this.createTermsAggregation(2, {
          field: params.termsField,
          label: params.termsFieldLabel,
          schema: 'segment',
          order: 'asc',
          orderBy: '_key',
          size: 10,
          otherBucketEnabled: true,
        }),
      ],
      params: {
        type: 'pie',
        addTooltip: true,
        addLegend: true,
        legendPosition: 'bottom',
        isDonut: false,
        labels: {
          show: true,
          values: true,
          last_level: true,
          truncate: 100,
        },
      },
    };
  }

  /**
   * Pie chart to display SonarQube violations (issues) grouped by severity
   */
  async createSonarQubeViolationsPieChart(repositoryName: string) {
    const title = `${repositoryName} :: SonarQube detected issues pie chart`;
    const search = await this.searchesClient.createSonarQubeViolations([
      repositoryName,
    ]);
    const visState = this.createPieChartVisState({
      title,
      metricField: 'metric.value',
      termsField: 'metric.name.keyword',
      termsFieldLabel: 'Violation',
    });
    return await this.save(title, visState, search.id);
  }

  /**
   * Pie chart to display percentage of code lines (ncloc) compared to comment lines
   */
  async createSonarQubeCommentRatioPieChart(repositoryName: string) {
    const title = `${repositoryName} :: SonarQube comment lines pie chart`;
    const search = await this.searchesClient.createSonarQubeMetrics({
      repositoryNames: [repositoryName],
      metricNames: ['comment_lines', 'ncloc'],
    });
    const visState = this.createPieChartVisState({
      title,
      metricField: 'metric.value',
      termsField: 'metric.name.keyword',
      termsFieldLabel: 'Line type',
    });
    return await this.save(title, visState, search.id);
  }

  async createVulnerabilityCountLatest(repositoryNames: string[]) {
    const title = `Vulnerability count latest :: ${JSON.stringify(
      repositoryNames
    )}`;
    const search = await this.searchesClient.createSonarQubeMetrics({
      repositoryNames,
      metricNames: ['vulnerabilities'],
    });
    const visState = this.createHorizontalBarLatestVisState({
      title,
      metricField: 'metric.value',
      metricLabel: 'Vulnerability count',
    });
    return await this.save(title, visState, search.id);
  }

  async createVulnerabilityCountHistogram(repositoryNames: string[]) {
    const title = `Vulnerability count histogram :: ${JSON.stringify(
      repositoryNames
    )}`;
    const search = await this.searchesClient.createSonarQubeMetrics({
      repositoryNames,
      metricNames: ['vulnerabilities'],
    });
    const visState = this.createHistogramVisState(
      title,
      'metric.value',
      'Vulnerability count'
    );
    return await this.save(title, visState, search.id);
  }

  async createSecurityHotspotCountLatest(repositoryNames: string[]) {
    const title = `Security hotspot count latest :: ${JSON.stringify(
      repositoryNames
    )}`;
    const search = await this.searchesClient.createSonarQubeMetrics({
      repositoryNames,
      metricNames: ['security_hotspots'],
    });
    const visState = this.createHorizontalBarLatestVisState({
      title,
      metricField: 'metric.value',
      metricLabel: 'Security hotspot count',
    });
    return await this.save(title, visState, search.id);
  }

  async createSecurityHotspotCountHistogram(repositoryNames: string[]) {
    const title = `Security hotspot count histogram :: ${JSON.stringify(
      repositoryNames
    )}`;
    const search = await this.searchesClient.createSonarQubeMetrics({
      repositoryNames,
      metricNames: ['security_hotspots'],
    });
    const visState = this.createHistogramVisState(
      title,
      'metric.value',
      'Security hotspot count'
    );
    return await this.save(title, visState, search.id);
  }

  async createCyclomaticComplexityLatest(repositoryNames: string[]) {
    const title = `Cyclomatic complexity latest :: ${JSON.stringify(
      repositoryNames
    )}`;
    const search = await this.searchesClient.createSonarQubeMetrics({
      repositoryNames,
      metricNames: ['complexity'],
    });
    const visState = this.createHorizontalBarLatestVisState({
      title,
      metricField: 'metric.value',
      metricLabel: 'Cyclomatic complexity',
    });
    return await this.save(title, visState, search.id);
  }

  async createCyclomaticComplexityHistogram(repositoryNames: string[]) {
    const title = `Cyclomatic complexity histogram :: ${JSON.stringify(
      repositoryNames
    )}`;
    const search = await this.searchesClient.createSonarQubeMetrics({
      repositoryNames,
      metricNames: ['complexity'],
    });
    const visState = this.createHistogramVisState(
      title,
      'metric.value',
      'Cyclomatic complexity'
    );
    return await this.save(title, visState, search.id);
  }

  async createCognitiveComplexityLatest(repositoryNames: string[]) {
    const title = `Cognitive complexity latest :: ${JSON.stringify(
      repositoryNames
    )}`;
    const search = await this.searchesClient.createSonarQubeMetrics({
      repositoryNames,
      metricNames: ['cognitive_complexity'],
    });
    const visState = this.createHorizontalBarLatestVisState({
      title,
      metricField: 'metric.value',
      metricLabel: 'Cognitive complexity',
    });
    return await this.save(title, visState, search.id);
  }

  async createCognitiveComplexityHistogram(repositoryNames: string[]) {
    const title = `Cognitive complexity histogram :: ${JSON.stringify(
      repositoryNames
    )}`;
    const search = await this.searchesClient.createSonarQubeMetrics({
      repositoryNames,
      metricNames: ['cognitive_complexity'],
    });
    const visState = this.createHistogramVisState(
      title,
      'metric.value',
      'Cognitive complexity'
    );
    return await this.save(title, visState, search.id);
  }

  private saveVegaVisualization(title: string, spec: unknown) {
    const visState = {
      title,
      type: 'vega',
      aggs: [],
      params: {
        spec: JSON.stringify(spec, null, 2),
      },
    };
    return this.save(title, visState);
  }

  createImportsSankeyChart(repositoryName: string) {
    return this.saveVegaVisualization(
      `${repositoryName} :: packages`,
      VegaImportsSankeyChart.spec(repositoryName)
    );
  }
}
