import { bracketsFeature } from './brackets';
import { guidesFeature } from './guides';
import { xmlTagsFeature } from './xml-tags';
import { FeatureModule } from '../core/types';

export const FEATURE_REGISTRY: FeatureModule[] = [bracketsFeature, guidesFeature, xmlTagsFeature];
