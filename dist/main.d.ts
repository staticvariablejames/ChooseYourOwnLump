import * as CYOL from './index';
declare global {
    interface Window {
        CYOL: typeof CYOL;
    }
}
