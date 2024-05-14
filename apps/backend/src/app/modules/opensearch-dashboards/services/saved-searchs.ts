import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { z } from 'zod';

import { TemporarySavedObjectUsedEvent } from '../events/temporary-saved-object-used.event';

import {
  IndexPattern,
  OpensearchDashboardsIndexPatterns,
} from './index-patterns';
import {
  OpensearchDashboardsSavedObjects,
  SavedObjectType,
} from './saved-objects';

const PhraseFilterInput = z
  .object({
    indexRef: z.number().int().min(0),
    key: z.string(),
    value: z.string(),
  })
  .strict();

const PhrasesFilterInput = z
  .object({
    indexRef: z.number().int().min(0),
    key: z.string(),
    values: z.string().array().min(1),
  })
  .strict();

const SonarQubeMetricsInput = z
  .object({
    repositoryNames: z.string().array().min(1),
    metricNames: z.string().array().min(1),
  })
  .strict();

@Injectable()
export class OpensearchDashboardsSearches {
  savedObjectType = SavedObjectType.SEARCH;

  constructor(
    private readonly eventBus: EventBus,
    private readonly savedObjectsClient: OpensearchDashboardsSavedObjects,
    private readonly indexPatternsClient: OpensearchDashboardsIndexPatterns
  ) {}

  async getAll() {
    return await this.savedObjectsClient.getByType(this.savedObjectType);
  }

  private createSearchSource(filter: Record<string, unknown>[]) {
    return {
      highlightAll: true,
      version: true,
      query: { query: '', language: 'kuery' },
      indexRefName: 'kibanaSavedObjectMeta.searchSourceJSON.index',
      filter,
    };
  }

  private createAttributes(
    title: string,
    searchSource: Record<string, unknown>
  ) {
    return {
      title: title,
      description: '',
      hits: 0,
      columns: ['_source'],
      sort: [],
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify(searchSource),
      },
    };
  }

  private createReferences(indexPattermId: string, filterCount: number) {
    return [
      {
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
        id: indexPattermId,
      },
      ...[...Array(filterCount).keys()].map((i) => ({
        name: `kibanaSavedObjectMeta.searchSourceJSON.filter[${i}].meta.index`,
        type: 'index-pattern',
        id: indexPattermId,
      })),
    ];
  }

  private async save(
    name: string,
    filter: Record<string, unknown>[],
    indexPatternId: string
  ) {
    const resultSavedObject = await this.savedObjectsClient.save(
      this.savedObjectType,
      {
        attributes: this.createAttributes(
          name,
          this.createSearchSource(filter)
        ),
        references: this.createReferences(indexPatternId, filter.length),
      }
    );

    this.eventBus.publish(
      new TemporarySavedObjectUsedEvent(
        this.savedObjectType,
        resultSavedObject.id
      )
    );
    return resultSavedObject;
  }

  private createPhraseFilter(input: z.input<typeof PhraseFilterInput>) {
    const settings = PhraseFilterInput.parse(input);
    return {
      meta: {
        alias: null,
        negate: false,
        disabled: false,
        type: 'phrase',
        key: settings.key,
        params: { query: settings.value },
        indexRefName: `kibanaSavedObjectMeta.searchSourceJSON.filter[${settings.indexRef}].meta.index`,
      },
      query: { match_phrase: { [settings.key]: settings.value } },
      $state: { store: 'appState' },
    };
  }

  private createPhrasesFilter(input: z.input<typeof PhrasesFilterInput>) {
    const settings = PhrasesFilterInput.parse(input);
    return {
      meta: {
        alias: null,
        negate: false,
        disabled: false,
        type: 'phrases',
        key: settings.key,
        value: settings.values.join(', '),
        params: settings.values,
        indexRefName: `kibanaSavedObjectMeta.searchSourceJSON.filter[${settings.indexRef}].meta.index`,
      },
      query: {
        bool: {
          should: settings.values.map((value) => ({
            match_phrase: {
              [settings.key]: value,
            },
          })),
          minimum_should_match: 1,
        },
      },
      $state: { store: 'appState' },
    };
  }

  async createSemantic(repositoryName: string) {
    const searchName = `semantic :: ${repositoryName}`;
    const indexPattern = await this.indexPatternsClient.requireOne(
      IndexPattern.SEMANTIC
    );
    const filter = [
      this.createPhraseFilter({
        indexRef: 0,
        key: 'repository.name.keyword',
        value: repositoryName,
      }),
    ];
    return await this.save(searchName, filter, indexPattern.id);
  }

  async createLineCountForPrimaryLanguage(repositoryNames: string[]) {
    const searchName = `Line count for primary language :: ${JSON.stringify(
      repositoryNames
    )}`;
    const indexPattern = await this.indexPatternsClient.requireOne(
      IndexPattern.PRIMARY_LINE_COUNTS
    );
    const filter = [
      this.createPhrasesFilter({
        indexRef: 0,
        key: 'repository.name.keyword',
        values: repositoryNames,
      }),
    ];
    return await this.save(searchName, filter, indexPattern.id);
  }

  async createSonarQubeMetrics(input: z.input<typeof SonarQubeMetricsInput>) {
    const settings = SonarQubeMetricsInput.parse(input);
    const searchName = `SonarQube metrics :: ${JSON.stringify(settings)}`;
    const indexPattern = await this.indexPatternsClient.requireOne(
      IndexPattern.SONARQUBE_METRICS
    );
    const filter = [
      this.createPhrasesFilter({
        indexRef: 0,
        key: 'repository.name.keyword',
        values: settings.repositoryNames,
      }),
      this.createPhrasesFilter({
        indexRef: 1,
        key: 'metric.name.keyword',
        values: settings.metricNames,
      }),
    ];
    return await this.save(searchName, filter, indexPattern.id);
  }

  createSonarQubeViolations(repositoryNames: string[]) {
    return this.createSonarQubeMetrics({
      repositoryNames,
      metricNames: [
        'blocker_violations',
        'critical_violations',
        'info_violations',
        'major_violations',
        'minor_violations',
      ],
    });
  }
}
