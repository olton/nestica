import { bracketsFeature } from './brackets';
import { guidesFeature } from './guides';
import { jsonKeysFeature } from './json-keys';
import { xmlTagsFeature } from './xml-tags';
import { FeatureModule } from '../core/types';

export const FEATURE_REGISTRY: FeatureModule[] = [bracketsFeature, guidesFeature, jsonKeysFeature, xmlTagsFeature];
