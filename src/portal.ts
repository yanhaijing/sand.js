import { createElement } from '.';
import { SandElement } from './element';

export const SANDJS_PORTAL_TAG = 'SANDJS_PORTAL_TAG';
export const SANDJS_PORTAL_CONTAINER = 'SANDJS_PORTAL_CONTAINER';

export function createPortal(child: SandElement, container: HTMLElement) {
    return createElement(
        SANDJS_PORTAL_TAG,
        {
            [SANDJS_PORTAL_CONTAINER]: container,
        },
        child
    );
}
