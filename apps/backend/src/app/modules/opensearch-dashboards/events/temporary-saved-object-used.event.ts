import { SavedObjectType } from '../services/saved-objects';

export class TemporarySavedObjectUsedEvent {
  constructor(readonly type: SavedObjectType, readonly id: string) {}
}
