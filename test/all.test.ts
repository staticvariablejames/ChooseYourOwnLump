import { Browser, chromium } from 'playwright';
import { basicPredictions } from './basic-predictions';
import { userInterface } from './user-interface';

let browser: Browser;

beforeAll(async () => {
    browser = await chromium.launch();
});
afterAll(async () => {
    await browser.close();
});

describe('Lump types are predicted correctly', () => basicPredictions(() => browser));
describe('User interface displays predictions correctly', () => userInterface(() => browser));
