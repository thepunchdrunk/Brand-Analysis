import { expect, test, describe } from 'vitest';
import { getAvailableAssets, InputMethod } from './ingestionLogic';
import { AssetType, AudienceScope } from '../types';

describe('Ingestion Logic', () => {
    test('returns correct assets for Internal scope', () => {
        const assets = getAvailableAssets(AudienceScope.INTERNAL, InputMethod.FILE);
        expect(assets['HR & People (Culture)']).toBeDefined();
        // Marketing is external, should not be in internal scope unless shared
        expect(assets['Marketing & Brand (Awareness)']).toBeUndefined();
    });

    test('returns correct assets for External scope', () => {
        const assets = getAvailableAssets(AudienceScope.EXTERNAL, InputMethod.FILE);
        expect(assets['Marketing & Brand (Awareness)']).toBeDefined();
        expect(assets['HR & People (Culture)']).toBeUndefined();
    });

    test('filters text-only assets correctly', () => {
        const assets = getAvailableAssets(AudienceScope.EXTERNAL, InputMethod.TEXT);
        const flattened = Object.values(assets).flat().map(a => a.value);
        expect(flattened).toContain(AssetType.BLOG_POST);
        expect(flattened).not.toContain(AssetType.VIDEO); // Video can't be pasted as text
    });

    test('filters by file format correctly', () => {
        // Video file
        const videoAssets = getAvailableAssets(AudienceScope.EXTERNAL, InputMethod.FILE, 'test.mp4');
        const flattenedVideo = Object.values(videoAssets).flat().map(a => a.value);
        expect(flattenedVideo).toContain(AssetType.VIDEO);
        expect(flattenedVideo).not.toContain(AssetType.BLOG_POST); // Blog is DOC type usually

        // Image file
        const imageAssets = getAvailableAssets(AudienceScope.EXTERNAL, InputMethod.FILE, 'test.png');
        const flattenedImage = Object.values(imageAssets).flat().map(a => a.value);
        expect(flattenedImage).toContain(AssetType.IMAGE);
    });
});
