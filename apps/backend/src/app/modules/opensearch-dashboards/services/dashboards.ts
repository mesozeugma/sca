import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';

import { TemporarySavedObjectUsedEvent } from '../events/temporary-saved-object-used.event';

import {
  OpensearchDashboardsSavedObjects,
  SavedObjectType,
} from './saved-objects';
import { OpensearchDashboardsVisualizations } from './visualizations';

interface PanelSavedObject {
  id: string;
  type: string;
}

interface EnabledSideBySidePanels {
  imports: boolean;
  sonarQube: boolean;
  symbols: boolean;
}

interface EnabledMultiSelectPanels {
  codeQuantity: boolean;
  codeQuality: boolean;
}

class OpensearchDashboard {
  private panels: unknown[] = [];
  private references: unknown[] = [];
  private title: string;
  panelHeight = 20;

  constructor(title: string) {
    this.title = title;
  }

  addPanel(panel: PanelSavedObject) {
    const panelIndex = this.panels.length;
    const panelUUID = randomUUID();
    const panelRef = `panel_${panelIndex}`;
    this.panels.push({
      version: '2.12.0',
      gridData: {
        x: panelIndex % 2 === 0 ? 0 : 24,
        y: (panelIndex / 2) * this.panelHeight,
        w: 24,
        h: this.panelHeight,
        i: panelUUID,
      },
      panelIndex: panelUUID,
      embeddableConfig: {},
      panelRefName: panelRef,
    });
    this.references.push({
      id: panel.id,
      type: panel.type,
      name: panelRef,
    });
  }

  getPayload() {
    return {
      attributes: {
        title: this.title,
        hits: 0,
        description: '',
        panelsJSON: JSON.stringify(this.panels),
        optionsJSON: JSON.stringify({
          useMargins: false,
          hidePanelTitles: false,
        }),
        version: 1,
        timeRestore: false,
        kibanaSavedObjectMeta: {
          searchSourceJSON: JSON.stringify({
            query: { query: '', language: 'kuery' },
            filter: [],
          }),
        },
      },
      references: this.references,
    };
  }

  getHeightPixels() {
    const numberOfPanels = this.panels.length / 2;
    return this.panelHeight * 20 * numberOfPanels + 24;
  }
}

@Injectable()
export class OpensearchDashboardsDashboards {
  savedObjectType = SavedObjectType.DASHBOARD;

  constructor(
    private readonly eventBus: EventBus,
    private readonly savedObjectsClient: OpensearchDashboardsSavedObjects,
    private readonly visualizationClient: OpensearchDashboardsVisualizations
  ) {}

  async getAll() {
    return await this.savedObjectsClient.getByType(this.savedObjectType);
  }

  async createSideBySideDashboard(
    repositoryName: string,
    repositoryName2: string,
    panels: EnabledSideBySidePanels
  ) {
    const dashboard = new OpensearchDashboard(
      `${repositoryName} vs ${repositoryName2} :: ${JSON.stringify(panels)}`
    );

    if (panels.imports) {
      const leftImportsSankeyChart =
        await this.visualizationClient.createImportsSankeyChart(repositoryName);
      dashboard.addPanel(leftImportsSankeyChart);
      const rightImportsSankeyChart =
        await this.visualizationClient.createImportsSankeyChart(
          repositoryName2
        );
      dashboard.addPanel(rightImportsSankeyChart);
    }

    if (panels.sonarQube) {
      const leftSonarQubeViolationsPieChart =
        await this.visualizationClient.createSonarQubeViolationsPieChart(
          repositoryName
        );
      dashboard.addPanel(leftSonarQubeViolationsPieChart);
      const rightSonarQubeViolationsPieChart =
        await this.visualizationClient.createSonarQubeViolationsPieChart(
          repositoryName2
        );
      dashboard.addPanel(rightSonarQubeViolationsPieChart);

      const leftSonarQubeCommentRatioPieChart =
        await this.visualizationClient.createSonarQubeCommentRatioPieChart(
          repositoryName
        );
      dashboard.addPanel(leftSonarQubeCommentRatioPieChart);
      const rightSonarQubeCommentRatioPieChart =
        await this.visualizationClient.createSonarQubeCommentRatioPieChart(
          repositoryName2
        );
      dashboard.addPanel(rightSonarQubeCommentRatioPieChart);
    }

    if (panels.symbols) {
      const leftSemanticSymbolKind =
        await this.visualizationClient.createSemanticSymbolKind(repositoryName);
      dashboard.addPanel(leftSemanticSymbolKind);
      const rightSemanticSymbolKind =
        await this.visualizationClient.createSemanticSymbolKind(
          repositoryName2
        );
      dashboard.addPanel(rightSemanticSymbolKind);
    }
    const data = await this.save(dashboard);
    return { ...data, height: dashboard.getHeightPixels() };
  }

  async createMultiSelectDashboard(
    repositoryNames: string[],
    panels: EnabledMultiSelectPanels
  ) {
    const dashboard = new OpensearchDashboard(
      `${JSON.stringify(repositoryNames)} :: ${JSON.stringify(panels)}`
    );

    if (panels.codeQuantity) {
      const lineCountForPrimaryLanguageLatest =
        await this.visualizationClient.createLineCountForPrimaryLanguageLatest(
          repositoryNames
        );
      dashboard.addPanel(lineCountForPrimaryLanguageLatest);
      const lineCountForPrimaryLanguageHistogram =
        await this.visualizationClient.createLineCountForPrimaryLanguageHistogram(
          repositoryNames
        );
      dashboard.addPanel(lineCountForPrimaryLanguageHistogram);

      const commentRatioLatest =
        await this.visualizationClient.createCommentRatioLatest(
          repositoryNames
        );
      dashboard.addPanel(commentRatioLatest);
      const commentRatioHistogram =
        await this.visualizationClient.createCommentRatioHistogram(
          repositoryNames
        );
      dashboard.addPanel(commentRatioHistogram);

      const fileCountLatest =
        await this.visualizationClient.createFileCountLatest(repositoryNames);
      dashboard.addPanel(fileCountLatest);
      const fileCountHistogram =
        await this.visualizationClient.createFileCountHistogram(
          repositoryNames
        );
      dashboard.addPanel(fileCountHistogram);

      dashboard.addPanel(
        await this.visualizationClient.createClassCountLatest(repositoryNames)
      );
      dashboard.addPanel(
        await this.visualizationClient.createClassCountHistogram(
          repositoryNames
        )
      );
    }

    if (panels.codeQuality) {
      dashboard.addPanel(
        await this.visualizationClient.createDuplicationRatioLatest(
          repositoryNames
        )
      );
      dashboard.addPanel(
        await this.visualizationClient.createDuplicationRatioHistogram(
          repositoryNames
        )
      );

      dashboard.addPanel(
        await this.visualizationClient.createBugCountLatest(repositoryNames)
      );
      dashboard.addPanel(
        await this.visualizationClient.createBugCountHistogram(repositoryNames)
      );

      dashboard.addPanel(
        await this.visualizationClient.createVulnerabilityCountLatest(
          repositoryNames
        )
      );
      dashboard.addPanel(
        await this.visualizationClient.createVulnerabilityCountHistogram(
          repositoryNames
        )
      );

      dashboard.addPanel(
        await this.visualizationClient.createSecurityHotspotCountLatest(
          repositoryNames
        )
      );
      dashboard.addPanel(
        await this.visualizationClient.createSecurityHotspotCountHistogram(
          repositoryNames
        )
      );

      dashboard.addPanel(
        await this.visualizationClient.createCyclomaticComplexityLatest(
          repositoryNames
        )
      );
      dashboard.addPanel(
        await this.visualizationClient.createCyclomaticComplexityHistogram(
          repositoryNames
        )
      );

      dashboard.addPanel(
        await this.visualizationClient.createCognitiveComplexityLatest(
          repositoryNames
        )
      );
      dashboard.addPanel(
        await this.visualizationClient.createCognitiveComplexityHistogram(
          repositoryNames
        )
      );
    }

    const data = await this.save(dashboard);
    return { ...data, height: dashboard.getHeightPixels() };
  }

  private async save(dashboard: OpensearchDashboard) {
    const resultSavedObject = await this.savedObjectsClient.save(
      this.savedObjectType,
      dashboard.getPayload()
    );

    this.eventBus.publish(
      new TemporarySavedObjectUsedEvent(
        this.savedObjectType,
        resultSavedObject.id
      )
    );
    return resultSavedObject;
  }
}
