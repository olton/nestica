import { bracketsFeature } from './brackets';
import { guidesFeature } from './guides';
import { FeatureModule } from '../core/types';

export const FEATURE_REGISTRY: FeatureModule[] = [bracketsFeature, guidesFeature];