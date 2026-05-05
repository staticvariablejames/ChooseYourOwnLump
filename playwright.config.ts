import { PlaywrightTestConfig } from '@playwright/test';

/* Planner tests are independent of the browser,
 * so we don't bother testing them in all available browsers.
 */
let plannerRelatedTests = [
    'test/planner-core.test.ts',
    'test/planner-processing.test.ts',
];

const config: PlaywrightTestConfig = {
    projects: [
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',
            },
            testIgnore: plannerRelatedTests,
        },
        {
            name: 'firefox',
            use: {
                browserName: 'firefox',
            },
            testIgnore: plannerRelatedTests,
        },
        {
            name: 'planner-related',
            use: {
                browserName: 'chromium',
            },
            testMatch: plannerRelatedTests,
        },
    ],
};

export default config;
